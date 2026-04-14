'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChapterSeenMap } from '@/lib/types';

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

const SAMPLE_TOTAL = 10; // used only for ALL / multi-chapter mode

// ── Chapter icon ─────────────────────────────────────────────────────────────
function ChapterIcon({ number, selected, cleared }: {
  number: number | null;
  selected: boolean;
  cleared?: boolean;
}) {
  const color  = cleared ? '#22c55e' : selected ? '#f7941d' : '#5a607a';
  const glow   = cleared
    ? 'drop-shadow(0 0 8px rgba(34,197,94,0.7))'
    : selected ? 'drop-shadow(0 0 8px rgba(247,148,29,0.8))' : 'none';
  const label  = number === null ? '∞' : String(number);
  const fSize  = label.length > 2 ? '28' : '40';
  const bgFill = selected ? 'rgba(247,148,29,0.06)' : cleared ? 'rgba(34,197,94,0.06)' : 'rgba(13,13,20,0.9)';

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      {/* Outer hexagonal frame */}
      <polygon
        points="22,2 78,2 98,22 98,78 78,98 22,98 2,78 2,22"
        fill={bgFill}
        stroke={color}
        strokeWidth={selected ? '2.5' : '1.5'}
        style={{ filter: glow }}
      />
      {/* Inner thin accent */}
      <polygon
        points="28,7 72,7 93,28 93,72 72,93 28,93 7,72 7,28"
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        opacity="0.3"
      />
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
      {/* Number */}
      <text x="50" y="58"
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fSize} fontWeight="900"
            fontFamily="'Barlow Condensed', 'Rajdhani', sans-serif"
            fill={color}
            style={{ filter: glow }}>
        {label}
      </text>
      {/* "CH" label */}
      {number !== null && (
        <text x="50" y="82"
              textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="600" letterSpacing="3"
              fontFamily="'Share Tech Mono', monospace"
              fill={color} opacity="0.6">
          CH
        </text>
      )}
    </svg>
  );
}

// ── Chapter card ──────────────────────────────────────────────────────────────
function ChapterCard({
  chapter, selected, seen, onToggle,
}: {
  chapter: Chapter | null;
  selected: boolean;
  seen: number;
  onToggle: () => void;
}) {
  const isAll   = chapter === null;
  const total   = chapter?.total ?? 0;
  const cleared = !isAll && total > 0 && seen >= total;
  const pct     = !isAll && total > 0 ? Math.min(100, Math.round((seen / total) * 100)) : 0;
  const label   = isAll ? 'ALL OPS' : `CH ${chapter!.number}`;

  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col items-center gap-2 p-3 transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] op-card ${
        selected ? 'active' : ''
      } ${cleared ? 'cleared' : ''}`}
    >
      {/* Selected corner brackets */}
      {selected && (
        <>
          <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l"
                style={{ borderColor: cleared ? '#22c55e' : '#f7941d' }} />
          <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r"
                style={{ borderColor: cleared ? '#22c55e' : '#f7941d' }} />
        </>
      )}

      {/* Icon */}
      <div className="w-full aspect-square max-w-[80px]">
        <ChapterIcon number={isAll ? null : chapter!.number} selected={selected} cleared={cleared} />
      </div>

      {/* Label */}
      <div className="text-center leading-tight w-full">
        <p className="text-xs font-bold tracking-[0.18em] uppercase font-mono"
           style={{ color: cleared ? '#22c55e' : selected ? '#f7941d' : '#9097b0' }}>
          {label}
        </p>

        {!isAll && total > 0 && (
          <div className="mt-1.5 w-full space-y-0.5">
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: '#1a1a28' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{
                     width: `${pct}%`,
                     background: cleared ? '#22c55e' : '#f7941d',
                     boxShadow: cleared ? '0 0 4px rgba(34,197,94,0.6)' : 'none',
                   }} />
            </div>
            <p className="text-[9px] font-mono tracking-widest"
               style={{ color: cleared ? '#22c55e' : '#3d4560' }}>
              {cleared ? 'CLEARED' : `${seen}/${total}`}
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
  const missionId = params.get('missionId') ?? '';
  const mapId     = params.get('mapId') ?? '';
  const subject   = params.get('subject') ?? 'Operation';

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(['ALL']));
  const [seenMap, setSeenMap]   = useState<ChapterSeenMap>({});
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!missionId) { router.push('/'); return; }
    setSeenMap(loadSeenMap());
    fetch('/api/list-chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId, mapId }),
    })
      .then((r) => r.json())
      .then((d) => { setChapters(d.chapters ?? []); setFetching(false); })
      .catch(() => setFetching(false));
  }, [missionId, mapId, router]);

  const allSelected = selected.has('ALL');

  const toggleAll = useCallback(() => setSelected(new Set(['ALL'])), []);

  const toggleChapter = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete('ALL');
      if (next.has(id)) { next.delete(id); if (next.size === 0) next.add('ALL'); }
      else next.add(id);
      return next;
    });
  }, []);

  const handleDeploy = async () => {
    setLoading(true);
    setError('');
    const chaptersArr = allSelected ? ['ALL'] : Array.from(selected);
    const isFullChapter = !allSelected && chaptersArr.length === 1;
    const res = await fetch('/api/load-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionId, mapId,
        // single chapter → no cap (route returns all); otherwise sample 10
        total: isFullChapter ? undefined : SAMPLE_TOTAL,
        chapters: chaptersArr,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to load questions'); setLoading(false); return; }
    localStorage.setItem('rts-questions', JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',   data.subject);
    router.push(`/operator-select?subject=${encodeURIComponent(data.subject)}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen siege-bg flex flex-col items-center justify-center gap-4">
        <p className="text-xs font-mono uppercase tracking-[0.35em]" style={{ color: '#f7941d' }}>
          Loading Intel...
        </p>
        <span className="text-2xl animate-blink" style={{ color: '#f7941d' }}>_</span>
      </main>
    );
  }

  // Overall progress
  const clearedCount = chapters.filter(ch => ch.total > 0 && (seenMap[ch.id]?.length ?? 0) >= ch.total).length;
  const totalQ  = chapters.reduce((s, ch) => s + ch.total, 0);
  const seenQ   = chapters.reduce((s, ch) => s + Math.min(seenMap[ch.id]?.length ?? 0, ch.total), 0);
  const allDone = chapters.length > 0 && clearedCount === chapters.length;

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
            // Intelligence Selection
          </p>
        </div>
        <p className="text-xs font-mono uppercase tracking-widest truncate max-w-[130px]"
           style={{ color: '#6b7090' }}>
          {subject}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-4xl mx-auto w-full">

        {/* Progress banner */}
        {!fetching && chapters.length > 0 && (
          <div className="w-full p-4 op-card"
               style={allDone ? { borderColor: 'rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.05)' } : {}}>
            {allDone ? (
              <div className="text-center">
                <p className="text-xs font-mono uppercase tracking-[0.3em] mb-1" style={{ color: '#22c55e' }}>
                  // All Chapters Cleared
                </p>
                <p className="font-bold text-base uppercase tracking-widest mb-1" style={{ color: '#e8eaf2' }}>
                  Shift to Practice Mode
                </p>
                <p className="text-xs font-mono" style={{ color: '#6b7090' }}>
                  Every question seen. Stop covering — start drilling under pressure.
                </p>
              </div>
            ) : (
              <div>
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
                       style={{ width: `${totalQ > 0 ? Math.round((seenQ / totalQ) * 100) : 0}%`, background: '#f7941d' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div className="text-center">
          <p className="text-lg font-bold uppercase tracking-[0.25em]" style={{ color: '#e8eaf2' }}>
            Select Chapters
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: '#6b7090' }}>
            {allSelected ? 'Full debrief — all chapters' : `${selected.size} chapter${selected.size > 1 ? 's' : ''} selected`}
          </p>
        </div>

        {/* Chapter grid */}
        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
                 style={{ borderColor: '#f7941d', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="w-full grid gap-3"
               style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
            <ChapterCard chapter={null} selected={allSelected} seen={0} onToggle={toggleAll} />
            {chapters.map((ch) => (
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

        {error && <p className="text-sm font-mono" style={{ color: '#e8001a' }}>⚠ {error}</p>}

        {/* Deploy */}
        <button
          onClick={handleDeploy}
          disabled={selected.size === 0 || fetching}
          className="siege-btn-primary"
          style={{ minWidth: '220px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          DEPLOY
        </button>

        <p className="text-xs font-mono uppercase tracking-widest -mt-4" style={{ color: '#2a2a40' }}>
          {allSelected ? `${SAMPLE_TOTAL} Random Objectives` : selected.size === 1 ? 'Full Chapter — All Questions' : `${SAMPLE_TOTAL} Objectives`} · 5 Squad
        </p>
      </div>
    </main>
  );
}

export default function ChaptersPage() {
  return <Suspense><ChaptersContent /></Suspense>;
}
