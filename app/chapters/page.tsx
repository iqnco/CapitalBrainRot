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

// Assign enemy character to each chapter by index
function chapterBoss(index: number): string {
  return OPERATORS[index % OPERATORS.length].id;
}

function ProgressRing({ pct, size = 72, cleared }: { pct: number; size?: number; cleared: boolean }) {
  const R    = size / 2 - 6;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - pct / 100);
  const color  = cleared ? '#22c55e' : pct > 0 ? '#008C45' : '#D0C8C0';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#F0E8D8" strokeWidth="4.5" />
      <circle
        cx={size / 2} cy={size / 2} r={R}
        fill="none" stroke={color} strokeWidth="4.5"
        strokeDasharray={CIRC} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
      />
    </svg>
  );
}

function ChapterNode({ chapter, bossId, selected, seen, onToggle }: {
  chapter: Chapter;
  bossId: string;
  selected: boolean;
  seen: number;
  onToggle: () => void;
}) {
  const cleared = chapter.total > 0 && seen >= chapter.total;
  const pct     = chapter.total > 0 ? Math.min(100, Math.round((seen / chapter.total) * 100)) : 0;
  const size    = 72;

  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center gap-1.5 transition-all duration-150 hover:scale-[1.06] active:scale-[0.95] group"
    >
      {/* Boss chibi */}
      <img
        src={`/Characters/8bit/${bossId}.png`}
        alt={bossId}
        style={{
          height: 44, width: 'auto',
          imageRendering: 'pixelated', objectFit: 'contain',
          opacity: cleared ? 1 : selected ? 1 : 0.6,
          filter: cleared ? 'none' : selected ? 'none' : 'grayscale(40%)',
          transition: 'all 0.2s ease',
        }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
      />

      {/* Progress ring + chapter number */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <ProgressRing pct={pct} size={size} cleared={cleared} />
        {/* Fill circle */}
        <div style={{
          position: 'absolute', inset: 6,
          borderRadius: '50%',
          background: selected
            ? 'rgba(0,140,69,0.12)'
            : cleared
            ? 'rgba(34,197,94,0.1)'
            : 'rgba(255,249,240,0.9)',
          border: `2px solid ${selected ? '#008C45' : cleared ? '#22c55e' : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 0,
          transition: 'all 0.2s ease',
          boxShadow: selected ? '0 0 14px rgba(0,140,69,0.25)' : 'none',
        }}>
          {cleared ? (
            <span style={{ fontSize: '1.4rem' }}>✓</span>
          ) : (
            <span style={{
              fontSize: '1.4rem', fontFamily: "'Fredoka One', sans-serif",
              color: selected ? '#008C45' : '#1A1A2E', lineHeight: 1,
            }}>
              {chapter.number}
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-widest font-bold leading-none"
           style={{
             color: cleared ? '#22c55e' : selected ? '#008C45' : '#B0A090',
             fontFamily: "'Fredoka One', sans-serif",
           }}>
          {cleared ? 'DONE 🍕' : `${pct}%`}
        </p>
      </div>
    </button>
  );
}

function ChaptersContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const { profile } = useAuth();
  const missionId = params.get('missionId') ?? '';
  const mapId     = params.get('mapId') ?? '';
  const subject   = params.get('subject') ?? 'Materia';

  const [mode, setMode]           = useState<'ranked' | 'training' | 'review'>('ranked');
  const [chapters, setChapters]   = useState<Chapter[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [seenMap, setSeenMap]     = useState<ChapterSeenMap>({});
  const [weakCount, setWeakCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [error, setError]         = useState('');
  const [timePressure, setTimePressure] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('rts-time-pressure') === 'true'
  );

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

    const playerOp = profile?.favorite_operator ?? 'tralalero';
    const enemies  = OPERATORS.filter(op => op.id !== playerOp);
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);

    if (mode === 'review') {
      const raw    = localStorage.getItem('rts-weak-questions');
      const weakQs = raw ? JSON.parse(raw) : [];
      if (weakQs.length === 0) { setError('No mistakes saved yet!'); setLoading(false); return; }
      const shuffledWeak = [...weakQs].sort(() => Math.random() - 0.5).slice(0, 20);
      localStorage.setItem('rts-questions', JSON.stringify(shuffledWeak));
      localStorage.setItem('rts-subject',   'Review — Mistakes');
      const enemyIds = shuffledWeak.map((_: unknown, i: number) => shuffled[i % shuffled.length].id);
      localStorage.setItem('rts-player-operator', playerOp);
      localStorage.setItem('rts-operator-ids',    JSON.stringify(enemyIds));
      router.push(`/quiz?subject=${encodeURIComponent('Review — Mistakes')}`);
      return;
    }

    const isRanked       = mode === 'ranked';
    const chaptersArr    = isRanked ? ['ALL'] : Array.from(selected);
    const isSingleChapter = !isRanked && chaptersArr.length === 1;

    const res  = await fetch('/api/load-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionId, mapId,
        total: isRanked || !isSingleChapter ? 10 : undefined,
        chapters: chaptersArr,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to load questions!'); setLoading(false); return; }

    localStorage.setItem('rts-questions', JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',   data.subject);

    const enemyIds2 = Array.from({ length: data.questions.length }, (_: unknown, i: number) =>
      shuffled[i % shuffled.length].id
    );
    localStorage.setItem('rts-player-operator', playerOp);
    localStorage.setItem('rts-operator-ids',    JSON.stringify(enemyIds2));
    router.push(`/quiz?subject=${encodeURIComponent(data.subject)}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen siege-bg flex flex-col items-center justify-center gap-4">
        <p className="text-lg uppercase tracking-[0.2em]"
           style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
          🍕 Briefing...
        </p>
      </main>
    );
  }

  const clearedCount = chapters.filter(ch => ch.total > 0 && (seenMap[ch.id]?.length ?? 0) >= ch.total).length;
  const totalQ       = chapters.reduce((s, ch) => s + ch.total, 0);
  const seenQ        = chapters.reduce((s, ch) => s + Math.min(seenMap[ch.id]?.length ?? 0, ch.total), 0);
  const canDeploy    = mode === 'ranked' || mode === 'review' || selected.size > 0;
  const overallPct   = totalQ > 0 ? Math.round((seenQ / totalQ) * 100) : 0;

  return (
    <main className="min-h-screen siege-bg flex flex-col pb-12">

      {/* Header */}
      <header className="flex-none flex items-center gap-4 px-5 h-14 border-b"
              style={{ background: 'rgba(255,249,240,0.97)', borderColor: '#E0CCB0' }}>
        <button onClick={() => router.back()}
                className="text-sm uppercase tracking-widest transition-colors"
                style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
          ← Map
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm uppercase tracking-[0.2em]"
             style={{ color: 'rgba(206,43,55,0.8)', fontFamily: "'Fredoka One', sans-serif" }}>
            🍕 Tactical Briefing
          </p>
        </div>
        <p className="text-xs uppercase tracking-widest truncate max-w-[140px]"
           style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
          {subject}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-4xl mx-auto w-full">

        {/* ── Overall zone progress ── */}
        {!fetching && chapters.length > 0 && (
          <div className="w-full p-4 op-card flex items-center gap-4"
               style={{ borderColor: 'rgba(0,140,69,0.25)', background: 'rgba(0,140,69,0.03)' }}>
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
              <ProgressRing pct={overallPct} size={56} cleared={overallPct === 100} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-black text-sm" style={{ color: '#008C45', fontFamily: "'Fredoka One', sans-serif" }}>
                  {overallPct}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-base uppercase"
                 style={{ color: '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
                Zone Coverage
              </p>
              <p className="text-sm" style={{ color: '#7A7A8C' }}>
                {clearedCount}/{chapters.length} chapters cleared · {seenQ}/{totalQ} questions seen
              </p>
            </div>
          </div>
        )}

        {/* ── Mode selector ── */}
        <div className="w-full grid grid-cols-3 gap-3">
          {[
            { key: 'ranked',   label: 'Total Brainrot', sub: '10 random · all chapters', color: '#CE2B37', accent: 'rgba(206,43,55,0.08)' },
            { key: 'training', label: 'Training',       sub: 'Pick chapters · all Qs',    color: '#22c55e', accent: 'rgba(34,197,94,0.06)'  },
            { key: 'review',   label: 'Review',         sub: weakCount > 0 ? `${weakCount} mistakes` : 'No mistakes yet 🍕', color: '#8b7cf7', accent: 'rgba(139,124,247,0.06)' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key as typeof mode)}
              className="p-4 text-left transition-all duration-150 op-card"
              style={{
                borderColor: mode === m.key ? m.color : undefined,
                background:  mode === m.key ? m.accent : undefined,
                boxShadow:   mode === m.key ? `0 0 0 3px ${m.color}25` : undefined,
              }}
            >
              <p className="font-bold text-base uppercase leading-none mb-1"
                 style={{ color: mode === m.key ? m.color : '#9097b0', fontFamily: "'Fredoka One', sans-serif" }}>
                {m.label}
              </p>
              <p className="text-xs" style={{ color: '#7A7A8C' }}>{m.sub}</p>
            </button>
          ))}
        </div>

        {/* ── Training chapter map ── */}
        {mode === 'training' && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest"
                 style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
                {selected.size === 0 ? 'Select chapters to siege' : `${selected.size} chapter${selected.size > 1 ? 's' : ''} selected`}
              </p>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())}
                        className="text-[10px] uppercase tracking-widest"
                        style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
                  Clear
                </button>
              )}
            </div>

            {fetching ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                     style={{ borderColor: '#008C45', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="relative">
                {/* Path connector */}
                {chapters.length > 1 && (
                  <div className="absolute top-[54px] left-0 right-0 h-0.5 mx-[36px] z-0"
                       style={{ background: 'repeating-linear-gradient(90deg, #E0CCB0 0, #E0CCB0 8px, transparent 8px, transparent 16px)' }} />
                )}
                <div className="flex flex-wrap justify-center gap-6 relative z-10">
                  {chapters.map((ch, i) => (
                    <ChapterNode
                      key={ch.id}
                      chapter={ch}
                      bossId={chapterBoss(i)}
                      selected={selected.has(ch.id)}
                      seen={seenMap[ch.id]?.length ?? 0}
                      onToggle={() => toggleChapter(ch.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
            🍕 {error}
          </p>
        )}

        {/* ── Time pressure toggle ── */}
        <button
          onClick={() => {
            const next = !timePressure;
            setTimePressure(next);
            localStorage.setItem('rts-time-pressure', String(next));
          }}
          className="flex items-center gap-3 px-4 py-3 op-card w-full max-w-sm transition-all"
          style={{
            borderColor: timePressure ? '#CE2B37' : '#E0CCB0',
            background:  timePressure ? 'rgba(206,43,55,0.05)' : undefined,
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>🍕</span>
          <div className="text-left flex-1">
            <p className="text-sm font-bold uppercase tracking-wide"
               style={{ color: timePressure ? '#CE2B37' : '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
              Time Pressure
            </p>
            <p className="text-xs" style={{ color: '#7A7A8C' }}>
              {timePressure ? '20s per question — pizza is burning' : '20s per question — off'}
            </p>
          </div>
          <div style={{
            width: 36, height: 20, borderRadius: 10, flexShrink: 0,
            background: timePressure ? '#CE2B37' : '#D0C8C0',
            position: 'relative', transition: 'background 0.2s ease',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3,
              left: timePressure ? 19 : 3,
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </button>

        {/* ── Deploy button ── */}
        <button
          onClick={handleDeploy}
          disabled={!canDeploy || fetching}
          className="siege-btn-primary"
          style={{ minWidth: '260px', fontSize: '1.1rem' }}
        >
          <span>🍕</span>
          {mode === 'ranked'   ? 'START THE BRAINROT!'
         : mode === 'review'   ? 'REVIEW MISTAKES'
         :                       'TRAIN!'}
        </button>

        <p className="text-xs uppercase tracking-widest -mt-4"
           style={{ color: '#C0C0D0', fontFamily: "'Fredoka One', sans-serif" }}>
          {mode === 'ranked'   ? '10 Random Questions · 5 Lives'
         : mode === 'review'   ? 'Up to 20 Wrong Questions · 5 Lives'
         : selected.size === 1 ? 'Full Chapter — All Questions · 5 Lives'
         :                       '10 Questions · 5 Lives'}
        </p>

      </div>
    </main>
  );
}

export default function ChaptersPage() {
  return <Suspense><ChaptersContent /></Suspense>;
}
