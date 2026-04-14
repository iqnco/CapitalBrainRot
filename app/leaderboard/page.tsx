'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, LeaderboardEntry, flagEmoji, kdToRank } from '@/lib/supabase';

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId]       = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    supabase
      .from('leaderboard')
      .select('*')
      .order('kd', { ascending: false })
      .limit(50)
      .then(({ data }) => { setEntries(data ?? []); setLoading(false); });
  }, []);

  const medalColor = (i: number) => {
    if (i === 0) return '#f7941d';
    if (i === 1) return '#9da8ba';
    if (i === 2) return '#cd7f32';
    return '#3d4560';
  };

  return (
    <main className="min-h-screen siege-bg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)' }}>
        <button onClick={() => router.push('/')}
                className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
                style={{ color: '#6b7090' }}>
          ← LOBBY
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-mono uppercase tracking-[0.3em]"
                style={{ color: 'rgba(232,0,26,0.75)' }}>// Global Leaderboard</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6 space-y-3">
        <div className="text-center mb-6">
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>
            K/D = correct answers / total questions &nbsp;·&nbsp; min 10 questions to rank
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
                 style={{ borderColor: '#f7941d', borderTopColor: 'transparent' }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-mono uppercase tracking-widest" style={{ color: '#3d4560' }}>
              No operators ranked yet. Be the first.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = entry.user_id === myId;
              const rank = kdToRank(Number(entry.kd));
              const opId = entry.favorite_operator ?? 'ash';
              return (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 px-3 py-2 op-card"
                  style={{
                    borderColor: isMe ? 'rgba(247,148,29,0.5)' : undefined,
                    background: isMe ? 'rgba(247,148,29,0.06)' : undefined,
                  }}
                >
                  {/* Rank number */}
                  <span className="flex-none w-7 text-center font-black font-mono text-lg"
                        style={{ color: medalColor(i) }}>
                    {i + 1}
                  </span>

                  {/* Operator chibi */}
                  <img
                    src={`/chibis/${opId}.png`}
                    alt={opId}
                    style={{ width: 36, height: 36, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
                  />

                  {/* Username + flag */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-widest text-sm truncate"
                            style={{ color: isMe ? '#f7941d' : '#e8eaf2' }}>
                        {entry.username}
                      </span>
                      {isMe && <span className="text-[9px] font-mono flex-none" style={{ color: '#f7941d' }}>YOU</span>}
                      {entry.country && (
                        <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{flagEmoji(entry.country)}</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-right flex-none">
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#3d4560' }}>Correct</p>
                      <p className="font-bold font-mono text-xs leading-none" style={{ color: '#9da8ba' }}>
                        {entry.total_correct}/{entry.total_answered}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#3d4560' }}>K/D</p>
                      <p className="font-black font-mono text-base leading-none"
                         style={{ color: entry.kd >= 0.8 ? '#22c55e' : entry.kd >= 0.5 ? '#f7941d' : '#e8001a' }}>
                        {Number(entry.kd).toFixed(2)}
                      </p>
                    </div>

                    {/* Rank icon */}
                    <img
                      src={`/RankIcons/${rank.file}.png`}
                      alt={rank.label}
                      title={rank.label}
                      style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
