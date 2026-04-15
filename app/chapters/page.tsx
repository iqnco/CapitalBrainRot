'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChapterSeenMap } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { OPERATORS } from '@/lib/supabase';

interface Chapter {
  id: string;
  number: number;
  total: number;
}

const SEEN_KEY = 'rts-chapter-seen';

function loadSeenMap(): ChapterSeenMap {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(SEEN_KEY);
  return raw ? JSON.parse(raw) : {};
}

// ── Chapter icon ──────────────────────────────────────────────────────────────
function ChapterIcon({ number, selected, cleared }: {
  number: number;
  selected: boolean;
  cleared?: boolean;
}) {
  const color  = cleared ? '#22c55e' : selected ? '#f7941d' : '#5a607a';
  const glow   = cleared
    ? 'drop-shadow(0 0 8px rgba(34,197,94,0.7))'
    : selected ? 'drop-shadow(0 0 8px rgba(247,148,29,0.8))' : 'none';
  const label  = String(number);
  const fSize  = label.length > 2 ? '26' : '36';
  const bgFill = selected ? 'rgba(247,148,29,0.06)' : cleared ? 'rgba(34,197,94,0.06)' : 'rgba(13,13,20,0.9)';

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <polygon points="22,2 78,2 98,22 98,78 78,98 22,98 2,78 2,22"
               fill={bgFill} stroke={color} strokeWidth={selected ? '2.5' : '1.5'}
               style={{ filter: glow }} />
      <polygon points="28,7 72,7 93,28 93,72 72,93 28,93 7,72 7,28"
               fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      {/* Corner ticks */}
      <line x1="2"  y1="22" x2="14" y2="22" stroke={color} strokeWidth="1.5" opacity="0.6"/>
      <line x1="22" y1="2"  x2="22" y2="14" stroke={color} strokeWidth="1.5" opacity="0.6"/>
      <line x1="98" y1="78" x2="86" y2="78" stroke={color} strokeWidth="1.5" opacity="0.6"/>
      <line x1="78" y1="98" x2="78" y2="86" stroke={color} strokeWidth="1.5" opacity="0.6"/>
      {/* Cleared tick */}
      {cleared && (
        <text x="74" y="26" fontSize="18" textAnchor="middle" dominantBaseline="middle"
              fill="#22c55e" style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.8))' }}>✓</text>
      )}
      {/* CH label above + number below — centred as a group */}
      <text x="50" y="38"
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="600" letterSpacing="3"
            fontFamily="'Share Tech Mono', monospace"
            fill={color} opacity="0.7">
        CH
      </text>
      <text x="50" y="60"
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fSize} fontWeight="900"
            fontFamily="'Barlow Condensed', 'Rajdhani', sans-serif"
            fill={color} style={{ filter: glow }}>
        {label}
      </text>
    </svg>
  );
}

// ── Chapter card ──────────────────────────────────────────────────────────────
function ChapterCard({ chapter, selected, seen, onToggle }: {
  chapter: Chapter;
  selected: boolean;
  seen: number;
  onToggle: () => void;
}) {
  const cleared = chapter.total > 0 && seen >= chapter.total;
  const pct     = chapter.total > 0 ? Math.min(100, Math.round((seen / chapter.total) * 100)) : 0;

  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col items-center gap-2 p-3 transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] op-card ${selected ? 'active' : ''} ${cleared ? 'cleared' : ''}`}
    >
      {selected && (
        <>
          <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l"
                style={{ borderColor: cleared ? '#22c55e' : '#f7941d' }} />
          <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r"
                style={{ borderColor: cleared ? '#22c55e' : '#f7941d' }} />
        </>
      )}
      <div className="w-full aspect-square max-w-[80px]">
        <ChapterIcon number={chapter.number} selected={selected} cleared={cleared} />
      </div>
      <div className="text-center leading-tight w-full">
        <p className="text-xs font-bold tracking-[0.18em] uppercase font-mono"
           style={{ color: cleared ? '#22c55e' : selected ? '#f7941d' : '#9097b0' }}>
          CH {chapter.number}
        </p>
        {chapter.total > 0 && (
          <div className="mt-1.5 w-full space-y-0.5">
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: '#1a1a28' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${pct}%`, background: cleared ? '#22c55e' : '#f7941d',
                            boxShadow: cleared ? '0 0 4px rgba(34,197,94,0.6)' : 'none' }} />
            </div>
            <p className="text-[9px] font-mono tracking-widest"
               style={{ color: cleared ? '#22c55e' : '#3d4560' }}>
              {cleared ? 'CLEARED' : `${seen}/${chapter.total}`}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ChaptersContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const { profile } = useAuth();
  const missionId = params.get('missionId') ?? '';
  const mapId     = params.get('mapId') ?? '';
  const subject   = params.get('subject') ?? 'Operation';

  const [mode, setMode]         = useState<'ranked' | 'training' | 'review'>('ranked');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seenMap, setSeenMap]   = useState<ChapterSeenMap>({});
  const [weakCount, setWeakCount] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('rts-weak-questions');
    setWeakCount(raw ? JSON.parse(raw).length : 0);
  }, []);

  useEffect(() => {
    if (!missionId) { router.push('/'); return; }
    setSeenMap(loadSeenMap());
    fetch('/api/list-chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId, mapId }),
    })
      .then(r => r.json())
      .then(d => { setChapters(d.chapters ?? []); setFetching(false); })
      .catch(() => setFetching(false));
  }, [missionId, mapId, router]);

  const toggleChapter = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleDeploy = async () => {
    setLoading(true);
    setError('');

    const playerOp = profile?.favorite_operator ?? 'ash';
    const enemies  = OPERATORS.filter(op => op.id !== playerOp);
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);

    // ── After Action Review: load from localStorage directly ──
    if (mode === 'review') {
      const raw = localStorage.getItem('rts-weak-questions');
      const weakQs = raw ? JSON.parse(raw) : [];
      if (weakQs.length === 0) { setError('No wrong answers saved yet.'); setLoading(false); return; }
      const shuffledWeak = [...weakQs].sort(() => Math.random() - 0.5).slice(0, 20);
      localStorage.setItem('rts-questions', JSON.stringify(shuffledWeak));
      localStorage.setItem('rts-subject',   `After Action Review`);
      const enemyIds = shuffledWeak.map((_: unknown, i: number) => shuffled[i % shuffled.length].id);
      localStorage.setItem('rts-player-operator', playerOp);
      localStorage.setItem('rts-operator-ids',    JSON.stringify(enemyIds));
      router.push(`/quiz?subject=${encodeURIComponent('After Action Review')}`);
      return;
    }

    const isRanked = mode === 'ranked';
    const chaptersArr = isRanked ? ['ALL'] : Array.from(selected);
    const isSingleChapter = !isRanked && chaptersArr.length === 1;

    const res = await fetch('/api/load-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionId, mapId,
        total: isRanked || !isSingleChapter ? 10 : undefined,
        chapters: chaptersArr,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to load questions'); setLoading(false); return; }

    localStorage.setItem('rts-questions', JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',   data.subject);

    const playerOp = profile?.favorite_operator ?? 'ash';
    const enemies  = OPERATORS.filter(op => op.id !== playerOp);
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    const enemyIds = Array.from({ length: data.questions.length }, (_: unknown, i: number) =>
      shuffled[i % shuffled.length].id
    );
    localStorage.setItem('rts-player-operator', playerOp);
    localStorage.setItem('rts-operator-ids',    JSON.stringify(enemyIds));
    router.push(`/quiz?subject=${encodeURIComponent(data.subject)}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen siege-bg flex flex-col items-center justify-center gap-4">
        <p className="text-xs font-mono uppercase tracking-[0.35em]" style={{ color: '#f7941d' }}>Loading Intel...</p>
        <span className="text-2xl animate-blink" style={{ color: '#f7941d' }}>_</span>
      </main>
    );
  }

  const clearedCount = chapters.filter(ch => ch.total > 0 && (seenMap[ch.id]?.length ?? 0) >= ch.total).length;
  const totalQ  = chapters.reduce((s, ch) => s + ch.total, 0);
  const seenQ   = chapters.reduce((s, ch) => s + Math.min(seenMap[ch.id]?.length ?? 0, ch.total), 0);

  const canDeploy = mode === 'ranked' || mode === 'review' || selected.size > 0;

  return (
    <main className="min-h-screen siege-bg flex flex-col">

      {/* Header */}
      <header className="flex-none flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)' }}>
        <button onClick={() => router.back()}
                className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
                style={{ color: '#6b7090' }}>
          ← BACK
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em]"
             style={{ color: 'rgba(232,0,26,0.75)' }}>
            // Select Playlist
          </p>
        </div>
        <p className="text-xs font-mono uppercase tracking-widest truncate max-w-[130px]"
           style={{ color: '#6b7090' }}>
          {subject}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-4xl mx-auto w-full">

        {/* ── Playlist selector ── */}
        <div className="w-full grid grid-cols-3 gap-3">

          {/* Ranked */}
          <button
            onClick={() => setMode('ranked')}
            className="relative p-5 text-left transition-all duration-150 op-card"
            style={{
              borderColor: mode === 'ranked' ? '#e8001a' : undefined,
              background:  mode === 'ranked' ? 'rgba(232,0,26,0.07)' : undefined,
              boxShadow:   mode === 'ranked' ? '0 0 20px rgba(232,0,26,0.15)' : undefined,
            }}
          >
            {mode === 'ranked' && (
              <>
                <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l" style={{ borderColor: '#e8001a' }} />
                <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r" style={{ borderColor: '#e8001a' }} />
              </>
            )}
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
               style={{ color: mode === 'ranked' ? 'rgba(232,0,26,0.8)' : '#3d4560' }}>
              Competitive
            </p>
            <p className="font-black text-lg uppercase tracking-wider leading-none"
               style={{ color: mode === 'ranked' ? '#ffffff' : '#9097b0',
                        fontFamily: "'Barlow Condensed', sans-serif" }}>
              Ranked
            </p>
            <p className="text-xs font-mono mt-2" style={{ color: '#6b7090' }}>
              10 random questions from all chapters
            </p>
          </button>

          {/* Training Grounds */}
          <button
            onClick={() => setMode('training')}
            className="relative p-5 text-left transition-all duration-150 op-card"
            style={{
              borderColor: mode === 'training' ? '#22c55e' : undefined,
              background:  mode === 'training' ? 'rgba(34,197,94,0.05)' : undefined,
              boxShadow:   mode === 'training' ? '0 0 20px rgba(34,197,94,0.1)' : undefined,
            }}
          >
            {mode === 'training' && (
              <>
                <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l" style={{ borderColor: '#22c55e' }} />
                <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r" style={{ borderColor: '#22c55e' }} />
              </>
            )}
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
               style={{ color: mode === 'training' ? 'rgba(34,197,94,0.8)' : '#3d4560' }}>
              Practice
            </p>
            <p className="font-black text-lg uppercase tracking-wider leading-none"
               style={{ color: mode === 'training' ? '#22c55e' : '#9097b0',
                        fontFamily: "'Barlow Condensed', sans-serif" }}>
              Training Grounds
            </p>
            <p className="text-xs font-mono mt-2" style={{ color: '#6b7090' }}>
              Pick chapters · all questions
            </p>
          </button>
          {/* After Action Review */}
          <button
            onClick={() => setMode('review')}
            className="relative p-5 text-left transition-all duration-150 op-card"
            style={{
              borderColor: mode === 'review' ? '#8b7cf7' : undefined,
              background:  mode === 'review' ? 'rgba(139,124,247,0.07)' : undefined,
              boxShadow:   mode === 'review' ? '0 0 20px rgba(139,124,247,0.12)' : undefined,
            }}
          >
            {mode === 'review' && (
              <>
                <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l" style={{ borderColor: '#8b7cf7' }} />
                <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r" style={{ borderColor: '#8b7cf7' }} />
              </>
            )}
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
               style={{ color: mode === 'review' ? 'rgba(139,124,247,0.9)' : '#3d4560' }}>
              Mistakes
            </p>
            <p className="font-black text-lg uppercase tracking-wider leading-none"
               style={{ color: mode === 'review' ? '#8b7cf7' : '#9097b0',
                        fontFamily: "'Barlow Condensed', sans-serif" }}>
              AAR
            </p>
            <p className="text-xs font-mono mt-2" style={{ color: '#6b7090' }}>
              {weakCount > 0 ? `${weakCount} question${weakCount > 1 ? 's' : ''} saved` : 'No mistakes yet'}
            </p>
          </button>

        </div>

        {/* ── Ranked info ── */}
        {mode === 'ranked' && !fetching && (
          <div className="w-full p-4 op-card" style={{ borderColor: 'rgba(232,0,26,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: '#6b7090' }}>
                Coverage
              </p>
              <p className="text-xs font-mono font-bold" style={{ color: '#f7941d' }}>
                {clearedCount}/{chapters.length} cleared &nbsp;·&nbsp; {seenQ}/{totalQ} questions
              </p>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1a1a28' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${totalQ > 0 ? Math.round((seenQ / totalQ) * 100) : 0}%`, background: '#e8001a', opacity: 0.8 }} />
            </div>
          </div>
        )}

        {/* ── Training Grounds chapter grid ── */}
        {mode === 'training' && (
          <>
            <div className="w-full flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: '#6b7090' }}>
                {selected.size === 0 ? 'Select chapters' : `${selected.size} chapter${selected.size > 1 ? 's' : ''} selected`}
              </p>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())}
                        className="text-[10px] font-mono uppercase tracking-widest transition-colors hover:text-white"
                        style={{ color: '#6b7090' }}>
                  Clear
                </button>
              )}
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                     style={{ borderColor: '#22c55e', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="w-full grid gap-3"
                   style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                {chapters.map(ch => (
                  <ChapterCard
                    key={ch.id}
                    chapter={ch}
                    selected={selected.has(ch.id)}
                    seen={seenMap[ch.id]?.length ?? 0}
                    onToggle={() => toggleChapter(ch.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm font-mono" style={{ color: '#e8001a' }}>⚠ {error}</p>}

        {/* Deploy */}
        <button
          onClick={handleDeploy}
          disabled={!canDeploy || fetching}
          className="siege-btn-primary"
          style={{ minWidth: '220px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          {mode === 'ranked' ? 'ENTER RANKED' : mode === 'review' ? 'REVIEW MISTAKES' : 'DEPLOY TO TRAINING'}
        </button>

        <p className="text-xs font-mono uppercase tracking-widest -mt-4" style={{ color: '#2a2a40' }}>
          {mode === 'ranked'   ? '10 Random Objectives · 5 Squad'
         : mode === 'review'   ? `Up to 20 Weak Questions · 5 Squad`
         : selected.size === 1 ? 'Full Chapter — All Questions · 5 Squad'
         :                       '10 Objectives · 5 Squad'}
        </p>

      </div>
    </main>
  );
}

export default function ChaptersPage() {
  return <Suspense><ChaptersContent /></Suspense>;
}
