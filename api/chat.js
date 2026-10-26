/**
 * /api/chat — server-side proxy for the Aria assistant (Vercel serverless function).
 *
 * Vite inlines every `VITE_*` variable into the public JavaScript bundle at build
 * time. That means a key configured only as `VITE_GEMINI_API_KEY` is both (a)
 * frozen into the bundle at build time — so adding it later has no effect until a
 * redeploy — and (b) downloadable by anyone visiting the site.
 *
 * Keeping the request here means the key stays server-side, and the assistant
 * works as long as the variable exists in the Vercel project, with no rebuild
 * needed per key change.
 *
 * Accepted variable names (first one found wins):
 *   GEMINI_API_KEY, GOOGLE_API_KEY, VITE_GEMINI_API_KEY
 */

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL?.trim(),
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
].filter(Boolean);

const FALLBACK_SYSTEM_INSTRUCTION = `
You are Aria, the Application Assistant for ApplyEase, the administrative workflow
platform of Apex State University.

Help students, staff and administrators understand how to use ApplyEase: how
applications are submitted, how documents are uploaded and verified, how stages
(Faculty Advisor, HoD, Warden, Registrar, Finance, depending on type) and SLA
deadlines work, and how signatures, seals and the verification QR code on issued
certificates are used.

Strict limits:
- Do NOT approve applications, issue documents, or claim signing authority.
- Do NOT fabricate deadlines, fee amounts or university policies.
- Do NOT ask for or repeat passwords, full ID numbers or auth tokens.
- If a policy is unknown, say so and suggest contacting the department.
- Answer in 2-4 sentences unless a list is clearly better.`;

function apiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Gemini rejects `thinkingConfig` on models that do not reason, so scope it. */
function wantsThinkingConfig(model) {
  // Reasoning-capable flash models only; `-lite` variants reject the field.
  return /^gemini-3(\.\d+)?-flash$/.test(model) || /^gemini-3\.\d+-flash$/i.test(model);
}

function generationConfig(model, withThinking) {
  const config = { maxOutputTokens: 700, temperature: 0.6 };
  if (withThinking && wantsThinkingConfig(model)) config.thinkingConfig = { thinkingBudget: 0 };
  return config;
}

export default async function handler(req, res) {
  // Health probe: lets the UI know whether the assistant is usable here without
  // spending a Gemini request.
  if (req.method === 'GET') {
    return send(res, 200, { configured: Boolean(apiKey()), transport: 'server', models: MODEL_CANDIDATES });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'method_not_allowed' });
  }

  const key = apiKey();
  if (!key) return send(res, 503, { error: 'not_configured' });

  const body = await readBody(req);
  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    return send(res, 400, { error: 'bad_request' });
  }

  const message = body.message.slice(0, 2000);
  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  const systemInstruction = typeof body.systemInstruction === 'string' && body.systemInstruction.trim()
    ? body.systemInstruction
    : FALLBACK_SYSTEM_INSTRUCTION;

  const contents = [
    ...history
      .filter(turn => turn && (turn.role === 'user' || turn.role === 'model') && Array.isArray(turn.parts))
      .map(turn => ({ role: turn.role, parts: turn.parts })),
    { role: 'user', parts: [{ text: message }] },
  ];

  let lastError = 'No Gemini model is currently available.';

  // Free-tier latency is variable (1-9s observed), so allow one slow but
  // successful call instead of aborting early; vercel.json sets maxDuration 30.
  const deadline = Date.now() + 25000;


  for (const model of MODEL_CANDIDATES) {
    const remaining = deadline - Date.now();
    if (remaining < 3000) break;

    // One attempt with reasoning disabled (fast), then one without it, because
    // `-lite` models reject `thinkingConfig` outright.
    for (const withThinking of [true, false]) {
      if (!withThinking && !wantsThinkingConfig(model)) break;
      try {
        const upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: generationConfig(model, withThinking) }),
            signal: AbortSignal.timeout(Math.min(12000, deadline - Date.now())),
          }
        );

        if (!upstream.ok) {
          const detail = (await upstream.text()).slice(0, 300);
          lastError = `Gemini ${upstream.status}: ${detail}`;
          if (upstream.status === 429) {
            // One shared account quota: trying other models just burns 20s.
            return send(res, 429, { error: 'quota', detail });
          }
          // 400 usually means a rejected parameter (thinkingConfig); retry bare.
          if (upstream.status === 400 && withThinking) continue;
          break;
        }

        const data = await upstream.json();
        const text = (data?.candidates?.[0]?.content?.parts || [])
          .map(part => part.text || '')
          .join('')
          .trim();

        if (text) return send(res, 200, { text, model });
        lastError = 'Gemini returned an empty response.';
        break;
      } catch (error) {
        lastError = error?.name === 'TimeoutError' ? 'Gemini request timed out.' : String(error?.message || error);
        break;
      }
    }
  }

  // 429 already returned early, so this is a retired model / outage / timeout.
  return send(res, 502, { error: 'upstream', detail: lastError });
}
