'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchReport } from '@/lib/types';

const RANKS = [
  { name: 'Copper',   color: '#a0522d' },
  { name: 'Bronze',   color: '#cd7f32' },
  { name: 'Silver',   color: '#9da8ba' },
  { name: 'Gold',     color: '#d4a017' },
  { name: 'Platinum', color: '#00b4cc' },
  { name: 'Emerald',  color: '#00c878' },
  { name: 'Diamond',  color: '#8b7cf7' },
  { name: 'Champion', color: '#f7941d' },
];

function getRank(score: number, total: number) {
  const pct = total > 0 ? score / total : 0;
  return RANKS[Math.min(7, Math.floor(pct * 8))];
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<MatchReport[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('rts-history');
    setHistory(saved ? JSON.parse(saved) : []);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('rts-history');
    setHistory([]);
  };

  return (
    <main className="min-h-screen siege-bg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)' }}>
        <button onClick={() => router.back()}
                className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
                style={{ color: '#6b7090' }}>
          ← BACK
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-mono uppercase tracking-[0.3em]"
                style={{ color: 'rgba(232,0,26,0.75)' }}>// Match History</span>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory}
                  className="text-xs font-mono tracking-widest uppercase transition-colors"
                  style={{ color: '#6b7090' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e8001a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7090')}>
            CLEAR
          </button>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-5 space-y-2">
        {history.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xs font-mono uppercase tracking-[0.4em] mb-6" style={{ color: '#6b7090' }}>
              No operations on record
            </p>
            <button onClick={() => router.push('/')} className="siege-btn-primary">
              Start Mission
            </button>
          </div>
        ) : (
          history.map((report) => {
            const rank   = getRank(report.score, report.total);
            const pct    = report.total > 0 ? Math.round((report.score / report.total) * 100) : 0;
            const date   = new Date(report.date).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            });
            const wrongs = report.answers.filter(a => !a.correct).length;

            return (
              <button
                key={report.id}
                onClick={() => router.push(`/report?id=${report.id}`)}
                className="w-full text-left p-4 transition-all active:scale-[0.99] op-card"
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(247,148,29,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#242432')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold uppercase tracking-wide text-sm truncate"
                       style={{ color: '#e8eaf2' }}>{report.subject}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#6b7090' }}>{date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm" style={{ color: rank.color, fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {rank.name}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#6b7090' }}>{pct}%</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-3">
                  <span className="text-xs font-mono">
                    <span style={{ color: '#6b7090' }}>Score </span>
                    <span className="font-semibold" style={{ color: '#e8eaf2' }}>{report.score}/{report.total}</span>
                  </span>
                  <span className="text-xs font-mono">
                    <span style={{ color: '#6b7090' }}>Wrong </span>
                    <span className="font-semibold" style={{ color: wrongs > 0 ? '#e8001a' : '#22c55e' }}>{wrongs}</span>
                  </span>
                  <span className="ml-auto text-xs font-mono tracking-widest" style={{ color: '#f7941d' }}>VIEW →</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </main>
  );
}
