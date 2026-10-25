/**
 * ApplyEase — Application Assistant AI endpoint
 * Vercel serverless function: POST /api/chat
 *
 * Calls Google Gemini on the server so the API key is never exposed to
 * the browser. The frontend sends { history, message }; this function
 * returns { reply } or { error }.
 *
 * Security measures:
 *  - API key read from process.env only (never logged or returned)
 *  - Request body validated: message length, history depth, role values
 *  - Output tokens capped
 *  - No database access; no student records forwarded to the model
 *  - Stack traces stripped from user-facing errors
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

/* ── Constants ───────────────────────────────────────────────────────────── */
const MAX_MESSAGE_LENGTH = 1000;   // characters per user turn
const MAX_HISTORY_TURNS  = 10;     // pairs kept for context window
const MAX_OUTPUT_TOKENS  = 512;

const SYSTEM_INSTRUCTION = `
You are the Application Assistant for ApplyEase, the administrative workflow
platform of Apex State University.

Your role:
- Help students, staff, and administrators understand how to use ApplyEase.
- Explain application categories (academic, hostel, financial, administrative).
- Describe the general submission process: fill form → upload documents →
  track stages → receive signed certificate.
- Explain that applications pass through department stages (Faculty Advisor →
  HoD → Warden / Registrar / Finance, depending on type) with SLA deadlines.
- Explain document verification, signature and seal requirements, and the
  public verification QR code on issued certificates.
- Explain that the admin provisions accounts and manages services.

Strict limits:
- Do NOT approve applications, issue documents, or claim signing authority.
- Do NOT fabricate specific deadlines, fee amounts, or university policies
  unless stated in this prompt.
- If you do not know an official university policy, say so clearly and suggest
  the user contact the relevant department.
- Do NOT ask for or repeat passwords, full ID numbers, or auth tokens.
- Keep answers concise (2–4 sentences unless a list is clearer).
- If the question is completely unrelated to the university or ApplyEase,
  politely redirect.
`.trim();

/* ── Allowed roles ───────────────────────────────────────────────────────── */
type Role = 'user' | 'model';
interface Turn { role: Role; parts: [{ text: string }] }

function isValidRole(r: unknown): r is Role {
  return r === 'user' || r === 'model';
}

/* ── Handler ─────────────────────────────────────────────────────────────── */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  /* Only POST */
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  /* API key */
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.error('[chat] GEMINI_API_KEY is not configured.');
    return res.status(503).json({
      error: 'The AI assistant is not configured yet. Please check back later.'
    });
  }

  /* Parse body */
  const { message, history } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'Message is too long (max 1000 characters).' });
  }

  /* Validate & sanitize history */
  const rawHistory: unknown[] = Array.isArray(history) ? history : [];
  const safeHistory: Turn[] = rawHistory
    .slice(-MAX_HISTORY_TURNS * 2)          // cap depth
    .filter((t): t is Turn => {
      if (!t || typeof t !== 'object') return false;
      const turn = t as Record<string, unknown>;
      if (!isValidRole(turn.role)) return false;
      const parts = turn.parts;
      if (!Array.isArray(parts) || parts.length === 0) return false;
      const first = parts[0] as Record<string, unknown>;
      return typeof first?.text === 'string' && first.text.length <= MAX_MESSAGE_LENGTH;
    });

  /* Call Gemini */
  try {
    const genai = new GoogleGenAI({ apiKey });

    const chat = genai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      history: safeHistory,
    });

    const response = await chat.sendMessage({ message: message.trim() });
    const reply = response.text ?? '';

    return res.status(200).json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    /* Distinguish quota / auth errors from generic ones */
    if (/quota|rate.?limit|429/i.test(msg)) {
      return res.status(429).json({ error: 'The assistant is busy right now. Please try again in a moment.' });
    }
    if (/api.?key|401|403|invalid/i.test(msg)) {
      console.error('[chat] Gemini auth error:', msg);
      return res.status(503).json({ error: 'The AI assistant is temporarily unavailable.' });
    }

    console.error('[chat] Gemini error:', msg);
    return res.status(502).json({ error: 'The assistant could not respond. Please try again.' });
  }
}
