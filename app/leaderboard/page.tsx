'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, LeaderboardEntry, flagEmoji, kdToRank } from '@/lib/supabase';

type Tab = 'fame' | 'shame';

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId]       = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>('fame');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    supabase
      .from('leaderboard')
      .select('*')
      .order('kd', { ascending: false })
      .limit(100)
      .then(({ data }) => { setEntries(data ?? []); setLoading(false); });
  }, []);

  const fameList  = entries.slice(0, 10);
  const shameList = [...entries]
    .sort((a, b) => Number(a.kd) - Number(b.kd))
    .slice(0, 10);

  const medalColor = (i: number) => {
    if (tab === 'shame') {
      if (i === 0) return '#CE2B37';
      if (i === 1) return '#e8572a';
      if (i === 2) return '#f7941d';
      return '#7A7A8C';
    }
    if (i === 0) return '#f7941d';
    if (i === 1) return '#9da8ba';
    if (i === 2) return '#cd7f32';
    return '#3d4560';
  };

  const displayList = tab === 'fame' ? fameList : shameList;

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
            {tab === 'fame' ? '🏆 Wall of Fame' : '💀 Wall of Shame'}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex mx-auto max-w-3xl px-4 pt-5 gap-2 mb-4">
        {(['fame', 'shame'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm uppercase tracking-widest font-bold rounded-xl transition-all"
            style={{
              fontFamily: "'Fredoka One', sans-serif",
              background: tab === t
                ? (t === 'fame' ? 'rgba(0,140,69,0.1)' : 'rgba(206,43,55,0.1)')
                : 'rgba(255,249,240,0.8)',
              border: `2px solid ${tab === t
                ? (t === 'fame' ? 'rgba(0,140,69,0.5)' : 'rgba(206,43,55,0.5)')
                : 'rgba(0,0,0,0.08)'}`,
              color: tab === t
                ? (t === 'fame' ? '#008C45' : '#CE2B37')
                : '#7A7A8C',
            }}
          >
            {t === 'fame' ? '🏆 Wall of Fame' : '💀 Wall of Shame'}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-3xl px-4 space-y-3">
        <div className="text-center mb-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
            {tab === 'fame'
              ? 'Top 10 by accuracy — K/D = correct / total'
              : 'Bottom 10 by accuracy — everyone qualifies'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
                 style={{ borderColor: '#CE2B37', borderTopColor: 'transparent' }} />
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
              {tab === 'shame' ? 'No one qualifies for the Wall of Shame yet. Keep playing!' : 'No players ranked yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayList.map((entry, i) => {
              const isMe = entry.user_id === myId;
              const rank = kdToRank(Number(entry.kd));
              const opId = entry.favorite_operator ?? 'tralalero';
              const kdColor = tab === 'shame'
                ? (Number(entry.kd) < 0.3 ? '#CE2B37' : '#f7941d')
                : (Number(entry.kd) >= 0.8 ? '#22c55e' : Number(entry.kd) >= 0.5 ? '#d4a017' : '#CE2B37');
              return (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 px-3 py-3 op-card"
                  style={{
                    borderColor: isMe ? 'rgba(0,140,69,0.5)' : tab === 'shame' && i === 0 ? 'rgba(206,43,55,0.4)' : undefined,
                    background:  isMe ? 'rgba(0,140,69,0.06)' : tab === 'shame' && i === 0 ? 'rgba(206,43,55,0.05)' : undefined,
                  }}
                >
                  <span className="flex-none w-7 text-center font-black text-lg"
                        style={{ color: medalColor(i), fontFamily: "'Fredoka One', sans-serif" }}>
                    {tab === 'shame' ? `#${i + 1}` : i + 1}
                  </span>

                  <img
                    src={`/Characters/8bit/${opId}.png`}
                    alt={opId}
                    style={{ width: 38, height: 38, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-widest text-sm truncate"
                            style={{ color: isMe ? '#008C45' : '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
                        {entry.username}
                      </span>
                      {isMe && <span className="text-[9px] flex-none" style={{ color: '#008C45', fontFamily: "'Fredoka One', sans-serif" }}>YOU</span>}
                      {tab === 'shame' && i === 0 && (
                        <span className="text-[9px] flex-none" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>💀 MOST ROTTEN</span>
                      )}
                      {entry.country && <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{flagEmoji(entry.country)}</span>}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
                      {entry.sessions} session{entry.sessions !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right flex-none">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>Correct</p>
                      <p className="font-bold text-xs leading-none" style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
                        {entry.total_correct}/{entry.total_answered}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>K/D</p>
                      <p className="font-black text-base leading-none" style={{ color: kdColor, fontFamily: "'Fredoka One', sans-serif" }}>
                        {Number(entry.kd).toFixed(2)}
                      </p>
                    </div>
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
