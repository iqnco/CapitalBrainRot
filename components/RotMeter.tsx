'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { loadXP, getLevel } from '@/lib/progression';

const HIDE_ON = ['/quiz', '/login', '/signup', '/map', '/'];

export default function RotMeter() {
  const pathname = usePathname();
  const [info, setInfo] = useState<ReturnType<typeof getLevel> | null>(null);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const lvl = getLevel(loadXP());
      setInfo(lvl);
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  useEffect(() => {
    if (!info) return;
    const total = (info.xpToNextLevel ?? 0) + info.xpIntoLevel;
    const pct   = total > 0 ? Math.round((info.xpIntoLevel / total) * 100) : 100;
    const t = setTimeout(() => setAnimPct(pct), 100);
    return () => clearTimeout(t);
  }, [info]);

  if (!info) return null;
  if (HIDE_ON.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p))) return null;

  const total = (info.xpToNextLevel ?? 0) + info.xpIntoLevel;
  const xpLabel = info.nextXp
    ? `${info.xpIntoLevel} / ${total} XP`
    : 'MAX LEVEL';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-2"
      style={{
        background:  'rgba(255,249,240,0.97)',
        borderTop:   '1px solid #E0CCB0',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Level badge */}
      <div className="flex-none flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
          style={{
            background: 'rgba(206,43,55,0.12)',
            color: '#CE2B37',
            fontFamily: "'Fredoka One', sans-serif",
          }}
        >
          {info.level}
        </div>
        <div className="leading-none">
          <p className="text-[8px] uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
            Level
          </p>
          <p className="text-xs font-bold uppercase" style={{ color: '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
            {info.name}
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
            Rot Progress
          </span>
          <span className="text-[8px] font-bold" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
            {xpLabel}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0E8D8' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${animPct}%`,
              background: 'linear-gradient(90deg, #CE2B37, #f7941d)',
              transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
        {info.nextName && (
          <p className="text-[8px] mt-0.5 text-right" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
            Next: {info.nextName}
          </p>
        )}
      </div>

      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🍕</span>
    </div>
  );
}
