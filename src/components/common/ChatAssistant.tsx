import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, User, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  error?: boolean;
}

type HistoryTurn = { role: 'user' | 'model'; parts: [{ text: string }] };

function uid() { return Math.random().toString(36).slice(2, 9); }

const WELCOME: Message = {
  id: 'welcome',
  role: 'model',
  text: "Hi! I'm **Aria** 🎓, your Application Assistant. I can help with:\n• Submitting & tracking applications\n• Required documents & workflow stages\n• Signatures, seals & certificate verification\n\nWhat would you like to know?",
};

const SYSTEM_INSTRUCTION = `
You are Aria, the Application Assistant for ApplyEase, the university administrative
workflow platform of Apex State University.
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

const ASSISTANT_NAME = 'Aria';
const ASSISTANT_EMOJI = '🎓';
const ASSISTANT_LOGO = '/assets/brand/aria-mark.svg';
const ASSISTANT_TAGLINE = 'Academic Records Assistant';

function renderText(text: string) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={line.startsWith('•') ? 'ml-1' : ''}>
      {line.split(/\*\*(.+?)\*\*/g).map((chunk, j) =>
        j % 2 === 1 ? <strong key={j}>{chunk}</strong> : chunk
      )}
    </p>
  ));
}

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE' || key.length < 10) return null;
  if (!_ai) _ai = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 12000 } });
  return _ai;
}

const MODEL =
  ((import.meta as any).env?.VITE_GEMINI_MODEL as string | undefined)?.trim() ||
  'gemini-3.6-flash';

export const ChatAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const ai = getAI();
    if (!ai) {
      setMessages(prev => [...prev, {
        id: uid(), role: 'model', text: 'The AI assistant is not configured. Please add VITE_GEMINI_API_KEY to your .env file.', error: true
      }]);
      setInput('');
      return;
    }

    setMessages(prev => [...prev, { id: uid(), role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
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
      else if (/api.?key|401|403/i.test(msg)) userMsg = 'API key issue. Please check your VITE_GEMINI_API_KEY.';
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

  const configured = !!getAI();

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
