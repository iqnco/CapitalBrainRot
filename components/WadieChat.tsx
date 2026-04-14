'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GREETINGS = [
  "Yalla, ask me anything.",
  "What's confusing you?",
  "I've read every question in this course. Go ahead.",
  "Don't be shy — what do you need?",
];

export default function WadieChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [greeting]              = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [hasMessaged, setHasMessaged] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);
  const sendRef                 = useRef<(forcedText?: string) => Promise<void>>();

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = useCallback(async (forcedText?: string) => {
    const text = (forcedText ?? input).trim();
    if (!text || loading) return;
    const isFirst = !hasMessaged;
    setHasMessaged(true);
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    if (!forcedText) setInput('');
    setLoading(true);

    // Kick off real API call immediately so it runs in background
    const apiPromise = fetch('/api/wadie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: next }),
    }).then(r => r.json()).catch(() => ({ reply: "Sorry, something broke on my end. Try again." }));

    if (isFirst) {
      // Show joke message, hide loading dots
      setLoading(false);
      setMessages([...next, { role: 'assistant', content: "did you really think I was gonna be able to help" }]);
      // Wait 5 seconds, then reveal real answer
      await new Promise(resolve => setTimeout(resolve, 5000));
      const data = await apiPromise;
      setMessages([...next,
        { role: 'assistant', content: "did you really think I was gonna be able to help" },
        { role: 'assistant', content: "Got ya!  " + (data.reply ?? '...') },
      ]);
    } else {
      try {
        const data = await apiPromise;
        setMessages([...next, { role: 'assistant', content: data.reply ?? '...' }]);
      } catch {
        setMessages([...next, { role: 'assistant', content: "Sorry, something broke on my end. Try again." }]);
      }
      setLoading(false);
    }
  }, [input, loading, hasMessaged, messages]);

  // Keep ref in sync so the event handler always has the latest closure
  useEffect(() => { sendRef.current = send; }, [send]);

  // Listen for explain-my-mistake events dispatched by the report page
  useEffect(() => {
    const handler = (e: Event) => {
      const { question, userAnswer, correctAnswer } = (e as CustomEvent<{
        question: string; userAnswer: string; correctAnswer: string;
      }>).detail;
      const msg = `Explain why I got this wrong. Question: "${question}". I answered: "${userAnswer}". Correct answer: "${correctAnswer}". What did I misunderstand?`;
      setOpen(true);
      setTimeout(() => sendRef.current?.(msg), 120);
    };
    window.addEventListener('wadie-explain', handler);
    return () => window.removeEventListener('wadie-explain', handler);
  }, []);

  return (
    <>
      {/* ── Floating Wadie button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-50 flex flex-col items-center gap-1 transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{ right: '14px', bottom: '80px' }}
        title="Ask Wadie"
      >
        {/* Speech bubble hint when closed */}
        {!open && messages.length === 0 && (
          <div
            className="mb-1 px-2 py-1 text-[9px] font-mono uppercase tracking-widest animate-blink"
            style={{
              background: 'rgba(13,13,20,0.95)',
              border: '1px solid rgba(247,148,29,0.4)',
              color: '#f7941d',
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              whiteSpace: 'nowrap',
            }}
          >
            Ask Wadie
          </div>
        )}
        <img
          src="/wadie.svg"
          alt="Wadie"
          style={{
            width: '52px',
            height: 'auto',
            imageRendering: 'pixelated',
            filter: open
              ? 'drop-shadow(0 0 8px rgba(247,148,29,0.7))'
              : 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
          }}
        />
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className="fixed z-40 flex flex-col"
          style={{
            right: '14px',
            bottom: '210px',
            width: '300px',
            maxHeight: '440px',
            background: 'rgba(8,8,14,0.97)',
            border: '1px solid rgba(247,148,29,0.35)',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            boxShadow: '0 0 30px rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b flex-none"
            style={{ borderColor: 'rgba(247,148,29,0.2)', background: 'rgba(13,13,20,0.98)' }}
          >
            <div className="flex items-center gap-2">
              <img src="/wadie.svg" alt="" style={{ width: '22px', imageRendering: 'pixelated' }} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest leading-none" style={{ color: '#f7941d' }}>
                  WADIE
                </p>
                <p className="text-[9px] font-mono uppercase tracking-widest leading-none" style={{ color: '#3d4560' }}>
                  OB Study Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xs font-mono hover:text-white transition-colors"
              style={{ color: '#3d4560' }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {/* Greeting */}
            <div className="flex gap-2 items-start">
              <img src="/wadie.svg" alt="" style={{ width: '18px', flexShrink: 0, imageRendering: 'pixelated', marginTop: '2px' }} />
              <div
                className="px-3 py-2 text-sm leading-relaxed"
                style={{
                  background: 'rgba(247,148,29,0.08)',
                  border: '1px solid rgba(247,148,29,0.2)',
                  color: '#e8eaf2',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                {greeting}
              </div>
            </div>

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <img src="/wadie.svg" alt="" style={{ width: '18px', flexShrink: 0, imageRendering: 'pixelated', marginTop: '2px' }} />
                )}
                <div
                  className="px-3 py-2 text-sm leading-relaxed max-w-[85%]"
                  style={{
                    background: msg.role === 'user'
                      ? 'rgba(232,0,26,0.08)'
                      : 'rgba(247,148,29,0.08)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(232,0,26,0.2)' : 'rgba(247,148,29,0.2)'}`,
                    color: '#e8eaf2',
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center">
                <img src="/wadie.svg" alt="" style={{ width: '18px', flexShrink: 0, imageRendering: 'pixelated' }} />
                <div className="flex gap-1 px-3 py-2"
                     style={{ background: 'rgba(247,148,29,0.06)', border: '1px solid rgba(247,148,29,0.15)' }}>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                         style={{ background: '#f7941d', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex-none flex gap-2 px-3 py-2 border-t"
            style={{ borderColor: 'rgba(247,148,29,0.15)' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about the course..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#2a2a45]"
              style={{ color: '#e8eaf2', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-30"
              style={{ color: '#f7941d' }}
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </>
  );
}
