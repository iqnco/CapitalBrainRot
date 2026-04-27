'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPERATORS } from '@/lib/supabase';
import { UNLOCK_DEFS, loadStats, getCombinedUnlockedIds } from '@/lib/progression';
import { CHAPTERS, getUnlockedCharacters } from '@/lib/chapters';
import { getTaunt } from '@/lib/commentary';

export default function CharactersPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [hovered, setHovered]   = useState<string | null>(null);

  useEffect(() => {
    const stats = loadStats();
    setUnlocked(getCombinedUnlockedIds(stats, getUnlockedCharacters()));
  }, []);

  const totalUnlocked = unlocked.length;
  const total         = OPERATORS.length;

  return (
    <main className="min-h-screen siege-bg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(255,249,240,0.97)', borderColor: '#E0CCB0' }}>
        <button onClick={() => router.push('/')}
                className="text-xs uppercase tracking-widest transition-colors"
                style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
          ← Back
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs uppercase tracking-[0.3em]"
                style={{ color: 'rgba(206,43,55,0.75)', fontFamily: "'Fredoka One', sans-serif" }}>
            🍕 Character Collection
          </span>
        </div>
        <span className="text-xs uppercase tracking-widest"
              style={{ color: '#008C45', fontFamily: "'Fredoka One', sans-serif" }}>
          {totalUnlocked}/{total}
        </span>
      </header>

      {/* Progress bar */}
      <div className="mx-auto max-w-3xl px-5 pt-5 pb-2">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs uppercase tracking-widest"
                style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
            Collection Progress
          </span>
          <span className="text-xs font-bold"
                style={{ color: '#008C45', fontFamily: "'Fredoka One', sans-serif" }}>
            {Math.round((totalUnlocked / total) * 100)}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0E8D8' }}>
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${(totalUnlocked / total) * 100}%`, background: 'linear-gradient(90deg, #008C45, #00c878)' }} />
        </div>
      </div>

      {/* Character grid */}
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {OPERATORS.map(op => {
            const isUnlocked   = unlocked.includes(op.id);
            const campaignCh   = CHAPTERS.find(ch => ch.bossId === op.id);
            const achievDef    = UNLOCK_DEFS.find(d => d.id === op.id);
            const lockLabel    = campaignCh
              ? `Beat Ch.${campaignCh.number} · ${campaignCh.region}`
              : (achievDef?.label ?? 'Locked');
            const taunt        = isUnlocked ? getTaunt(op.id) : null;
            const isHovered  = hovered === op.id;

            return (
              <div
                key={op.id}
                onMouseEnter={() => setHovered(op.id)}
                onMouseLeave={() => setHovered(null)}
                className="op-card p-3 flex flex-col items-center gap-2 transition-all duration-150 relative overflow-hidden"
                style={{
                  opacity: isUnlocked ? 1 : 0.6,
                  borderColor: isUnlocked ? (isHovered ? 'rgba(0,140,69,0.6)' : undefined) : 'rgba(0,0,0,0.08)',
                  background: isUnlocked && isHovered ? 'rgba(0,140,69,0.05)' : undefined,
                  cursor: 'default',
                }}
              >
                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10"
                       style={{ background: 'rgba(255,249,240,0.75)', backdropFilter: 'blur(2px)' }}>
                    <div className="text-center px-2">
                      <p style={{ fontSize: '1.5rem' }}>🔒</p>
                      <p className="text-[9px] uppercase tracking-wide mt-1 leading-tight"
                         style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
                        {lockLabel}
                      </p>
                    </div>
                  </div>
                )}

                {/* Character sprite */}
                <div style={{ height: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <img
                    src={`/Characters/8bit/${op.id}.png`}
                    alt={op.name}
                    style={{
                      maxHeight: 90, maxWidth: 80, width: 'auto', height: 'auto',
                      objectFit: 'contain', imageRendering: 'pixelated',
                      filter: isUnlocked ? 'none' : 'grayscale(100%)',
                    }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                  />
                </div>

                {/* Name */}
                <p className="text-[11px] font-bold uppercase tracking-wide text-center leading-tight"
                   style={{ color: isUnlocked ? '#1A1A2E' : '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
                  {op.name}
                </p>

                {/* Taunt quote on hover */}
                {isUnlocked && isHovered && taunt && (
                  <p className="text-[9px] italic text-center leading-snug"
                     style={{ color: '#CE2B37', fontFamily: "'Nunito', sans-serif" }}>
                    "{taunt}"
                  </p>
                )}

                {/* Unlocked badge */}
                {isUnlocked && (
                  <div className="absolute top-2 right-2 text-[10px]" style={{ color: '#008C45' }}>✓</div>
                )}
              </div>
            );
          })}
        </div>

        {totalUnlocked === total && (
          <div className="mt-8 text-center py-6 op-card"
               style={{ border: '2px solid rgba(0,140,69,0.4)', background: 'rgba(0,140,69,0.05)' }}>
            <p className="text-2xl mb-2">🍕🏆🍕</p>
            <p className="font-black text-lg uppercase tracking-widest"
               style={{ color: '#008C45', fontFamily: "'Fredoka One', sans-serif" }}>
              Full Collection!
            </p>
            <p className="text-sm mt-1" style={{ color: '#7A7A8C' }}>
              You've unlocked every character. Truly brain rotted.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
