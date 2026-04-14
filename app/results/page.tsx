'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizResults } from '@/lib/types';

const RANKS = [
  { name: 'COPPER I',     color: '#b87333', minPct: 0    },
  { name: 'BRONZE II',    color: '#cd7f32', minPct: 0.2  },
  { name: 'SILVER III',   color: '#aaa9ad', minPct: 0.4  },
  { name: 'GOLD IV',      color: '#ffd700', minPct: 0.6  },
  { name: 'PLATINUM III', color: '#5eead4', minPct: 0.75 },
  { name: 'DIAMOND I',    color: '#7dd3fc', minPct: 0.9  },
  { name: 'CHAMPION',     color: '#f7941d', minPct: 1.0  },
];

function getRank(score: number, total: number) {
  const pct = total > 0 ? score / total : 0;
  return RANKS.reduce((best, r) => (pct >= r.minPct ? r : best), RANKS[0]);
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<QuizResults | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('rts-results');
    if (!saved) { router.push('/'); return; }
    setResults(JSON.parse(saved));
  }, [router]);

  if (!results) return null;

  const rank     = getRank(results.score, results.total);
  const pct      = results.total > 0 ? Math.round((results.score / results.total) * 100) : 0;
  const survived = results.wrongCount < 5;

  return (
    <main className="min-h-screen siege-bg flex flex-col items-center justify-center p-6">

      {/* Debrief label */}
      <p className="text-xs font-mono uppercase tracking-[0.45em] mb-8"
         style={{ color: 'rgba(232,0,26,0.7)' }}>
        // Mission Debrief
      </p>

      <div className="w-full max-w-xl">

        {/* Mission status banner */}
        <div className="mb-4 py-3 px-5 text-center"
             style={{
               background: survived ? 'rgba(34,197,94,0.07)' : 'rgba(232,0,26,0.07)',
               border: `1px solid ${survived ? 'rgba(34,197,94,0.4)' : 'rgba(232,0,26,0.4)'}`,
               clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
             }}>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] mb-0.5"
             style={{ color: '#6b7090' }}>Operation</p>
          <p className="font-bold text-base uppercase tracking-wide leading-tight"
             style={{ color: '#e8eaf2' }}>
            {results.subject}
          </p>
          <p className="text-xs font-mono uppercase tracking-widest mt-1"
             style={{ color: survived ? '#22c55e' : '#e8001a' }}>
            {survived ? '✓ MISSION COMPLETE' : "✗ MISSION FAILED — WE'LL GET EM NEXT TIME"}
          </p>
        </div>

        {/* Rank block */}
        <div className="op-card p-6 mb-4 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] mb-3"
             style={{ color: '#6b7090' }}>Rank Awarded</p>

          <p className="font-black text-2xl tracking-[0.15em] uppercase mb-4"
             style={{ color: rank.color, textShadow: `0 0 18px ${rank.color}70`, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {rank.name}
          </p>

          <div className="siege-divider mx-auto mb-4" style={{ width: '60%' }} />

          <p className="font-black leading-none"
             style={{ fontSize: '4.5rem', color: '#e8eaf2',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}>
            {pct}<span style={{ fontSize: '2rem', color: '#6b7090' }}>%</span>
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Correct',  value: results.score,      color: '#22c55e' },
            { label: 'Wrong',    value: results.wrongCount,  color: '#e8001a' },
            { label: 'Squad Left', value: results.armor,     color: '#f7941d' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center py-3 op-card">
              <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#6b7090' }}>{label}</p>
              <p className="font-black text-2xl" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={() => router.push('/report')}
            className="w-full siege-btn-primary"
            style={{ width: '100%' }}
          >
            Match Report
          </button>
          <button onClick={() => router.push('/history')} className="w-full siege-btn-ghost">
            Match History
          </button>
          <button
            onClick={() => { localStorage.removeItem('rts-results'); router.push('/'); }}
            className="w-full py-3 text-xs font-mono uppercase tracking-[0.2em] transition-colors"
            style={{ color: '#6b7090', background: 'transparent', border: 'none' }}
          >
            ← Main Menu
          </button>
        </div>
      </div>
    </main>
  );
}
