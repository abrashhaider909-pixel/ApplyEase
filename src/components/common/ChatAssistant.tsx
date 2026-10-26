/**
 * ChatAssistant — floating Application Assistant chatbot.
 *
 * Primary path: POST /api/chat (server-side proxy, key stays on the server).
 * Fallback path: the browser SDK with VITE_GEMINI_API_KEY, which only exists
 * when running `npm run dev` with a local .env — Vite inlines VITE_* at build
 * time, so a deployed bundle cannot pick the key up later without a rebuild.
 */

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, User, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  error?: boolean;
}

type HistoryTurn = { role: 'user' | 'model'; parts: [{ text: string }] };

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function uid() { return Math.random().toString(36).slice(2, 9); }

const WELCOME: Message = {
  id: 'welcome',
  role: 'model',
  text: "Hi! I'm **Aria** 🎓, your Application Assistant. I can help with:\n• Submitting & tracking applications\n• Required documents & workflow stages\n• Signatures, seals & certificate verification\n\nWhat would you like to know?",
};

const SYSTEM_INSTRUCTION = `
You are Aria, the Application Assistant for ApplyEase, the university administrative
workflow platform of MCS.
Help users understand how to submit applications, track workflow stages, upload
required documents, get electronic signatures and seals, and verify issued
certificates via QR code.
Do NOT approve applications, issue documents, or claim signing authority.
Do NOT fabricate specific deadlines, fee amounts, or university policies.
If you do not know an official policy, say so and suggest contacting the department.
Keep answers concise (2–4 sentences).
If asked who you are, say you are Aria, ApplyEase's application assistant.
`.trim();

const MAX_HISTORY = 10; // pairs

/* ── Brand ───────────────────────────────────────────────────────────── */
const ASSISTANT_NAME = 'Aria';
const ASSISTANT_EMOJI = '🎓';
const ASSISTANT_LOGO = '/assets/brand/aria-mark.svg';
const ASSISTANT_TAGLINE = 'Academic Records Assistant';

/* ── Simple markdown renderer (bold + line breaks) ───────────────────────── */
function renderText(text: string) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={line.startsWith('•') ? 'ml-1' : ''}>
      {line.split(/\*\*(.+?)\*\*/g).map((chunk, j) =>
        j % 2 === 1 ? <strong key={j}>{chunk}</strong> : chunk
      )}
    </p>
  ));
}

/* ── Server proxy (preferred) ──────────────────────────────────────────── */
const CHAT_ENDPOINT = '/api/chat';

type ServerReply = { text?: string; model?: string; error?: string; detail?: string };

/**
 * Returns null when no proxy is deployed (plain `vite dev`, or static hosting),
 * so the caller can fall back to the browser SDK.
 */
async function askServer(message: string, history: HistoryTurn[]): Promise<ServerReply | null> {
  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message, history, systemInstruction: SYSTEM_INSTRUCTION }),
      signal: AbortSignal.timeout(28000),
    });
    // Vite/static hosts answer with HTML, not JSON — treat that as "no proxy".
    if (!(res.headers.get('content-type') || '').includes('application/json')) return null;
    return (await res.json()) as ServerReply;
  } catch {
    return null;
  }
}

/* ── Singleton AI client (browser fallback) ────────────────────────────── */
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE' || key.length < 10) return null;
  // Fail over quickly when a model hangs instead of waiting on the SDK default.
  if (!_ai) _ai = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 12000 } });
  return _ai;
}

/**
 * Gemini retires model IDs (gemini-2.0-flash now 404s). Use the moving
 * "latest" alias so the assistant keeps working, and allow an override.
 */
const MODEL =
  ((import.meta as any).env?.VITE_GEMINI_MODEL as string | undefined)?.trim() ||
  'gemini-3.6-flash';

/* ── Component ────────────────────────────────────────────────────────────── */
export const ChatAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  /* Does a working /api/chat exist on this deployment? */
  const [serverState, setServerState] = useState<'unknown' | 'ready' | 'not_configured' | 'absent'>('unknown');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(CHAT_ENDPOINT, { headers: { Accept: 'application/json' } })
      .then(async res => {
        if (!(res.headers.get('content-type') || '').includes('application/json')) return 'absent' as const;
        const data = await res.json().catch(() => null);
        return data?.configured ? ('ready' as const) : ('not_configured' as const);
      })
      .catch(() => 'absent' as const)
      .then(state => { if (alive) setServerState(state); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  function buildHistory(): HistoryTurn[] {
    return messages
      .filter(m => m.id !== 'welcome' && !m.error)
      .slice(-MAX_HISTORY * 2)
      .map(m => ({ role: m.role, parts: [{ text: m.text }] }));
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { id: uid(), role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      // 1. Preferred: server proxy (key never ships to the browser).
      const proxy = await askServer(text, buildHistory());
      if (proxy?.text) {
        setMessages(prev => [...prev, { id: uid(), role: 'model', text: proxy.text!.trim() }]);
        return;
      }
      if (proxy?.error === 'quota') {
        setMessages(prev => [...prev, {
          id: uid(), role: 'model', error: true,
          text: 'The assistant has reached its Gemini daily request limit. It will work again after the quota resets, or immediately with a paid API key.',
        }]);
        return;
      }
      if (proxy?.error && proxy.error !== 'not_configured') {
        throw new Error(proxy.detail || proxy.error);
      }
      if (proxy?.error === 'not_configured') setServerState('not_configured');

      // 2. Fallback: browser SDK key from the local .env (development only).
      const ai = getAI();
      if (!ai) {
        setMessages(prev => [...prev, {
          id: uid(), role: 'model', error: true,
          text: serverState === 'ready'
            ? 'The assistant did not respond in time. Please try again.'
            : 'The assistant is not configured on this deployment. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.',
        }]);
        return;
      }

      // Model IDs get retired without notice, and free tiers hit demand spikes.
      // Try the configured model first, then the current aliases.
      const candidates = Array.from(new Set([MODEL, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest']));
      let reply: string | null = null;
      let lastError: unknown = null;

      for (const model of candidates) {
        try {
          const chat = ai.chats.create({
            model,
            config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 900,
            // Gemini 3 models spend output budget on internal reasoning;
            // a help-desk assistant answers faster without it.
            thinkingConfig: { thinkingBudget: 0 },
          },
            history: buildHistory(),
          });
          const response = await chat.sendMessage({ message: text });
          reply = response.text?.trim() || '(no response)';
          break;
        } catch (e) {
          lastError = e;
        }
      }

      if (reply === null) throw lastError ?? new Error('No Gemini model is currently available.');
      setMessages(prev => [...prev, { id: uid(), role: 'model', text: reply }]);
    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : err);
      let userMsg = 'Something went wrong. Please try again.';
      if (/quota|429|rate/i.test(msg)) userMsg = 'Rate limit reached. Please wait a moment and try again.';
      else if (/api.?key|401|403/i.test(msg)) userMsg = 'The assistant could not authenticate. Please check the GEMINI_API_KEY setting.';
      else if (/404|not found|no longer available|models\//i.test(msg)) userMsg = 'The AI model is unavailable. Set VITE_GEMINI_MODEL (for example gemini-2.5-flash).';
      else if (/503|high demand|overloaded|unavailable/i.test(msg)) userMsg = 'The AI service is busy right now. Please try again in a moment.';
      else if (/network|fetch|failed/i.test(msg)) userMsg = 'Network error. Please check your connection.';
      setMessages(prev => [...prev, { id: uid(), role: 'model', text: userMsg, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetChat = () => { setMessages([WELCOME]); setInput(''); };

  const hasClientKey = !!getAI();
  const configured = serverState === 'unknown' || serverState === 'ready' || hasClientKey;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? `Close ${ASSISTANT_NAME}` : `Open ${ASSISTANT_NAME} — application assistant`}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#172b50] hover:bg-[#1f3763]'
        }`}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <img src={ASSISTANT_LOGO} alt="" className="w-10 h-10 rounded-2xl ring-1 ring-white/20" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: 'min(520px, calc(100dvh - 7rem))' }}
          role="dialog"
          aria-label={`${ASSISTANT_NAME} — Application Assistant`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#172b50] shrink-0">
            <div className="flex items-center gap-2.5">
              <img src={ASSISTANT_LOGO} alt="" className="w-9 h-9 rounded-xl ring-1 ring-white/15 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  {ASSISTANT_NAME}
                  <span aria-hidden="true">{ASSISTANT_EMOJI}</span>
                </p>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {configured ? ASSISTANT_TAGLINE : 'API key not set'}
                </p>
              </div>
            </div>
            <button onClick={resetChat} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors" title="Clear chat">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user' ? 'bg-[#172b50]' : msg.error ? 'bg-rose-100' : 'bg-white'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : msg.error
                    ? <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    : <img src={ASSISTANT_LOGO} alt="" className="w-full h-full rounded-full object-cover" />}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-1 ${
                  msg.role === 'user'
                    ? 'bg-[#172b50] text-white rounded-tr-sm'
                    : msg.error
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-sm'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-sm'
                }`}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 mt-0.5">
                  <img src={ASSISTANT_LOGO} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  <span className="text-xs text-slate-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Disclaimer */}
          <p className="px-4 py-1.5 text-[10px] text-slate-400 bg-white border-t border-slate-100 shrink-0 text-center">
            AI guidance only — not official university policy
          </p>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-slate-200 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={handleKey}
              placeholder="Ask about applications, documents…"
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2 bg-[#172b50] hover:bg-[#1f3763] disabled:bg-slate-200 rounded-xl transition-colors shrink-0"
              aria-label="Send"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
