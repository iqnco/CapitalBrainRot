'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  CHAPTERS, getCompletedChapters, getUnlockedCharacters,
  isChapterAvailable, isRankedUnlocked, isSkibidiUnlocked, getChapterStars, type Chapter,
} from '@/lib/chapters';
import { OPERATORS } from '@/lib/supabase';
import { loadXP, loadStats, getLevel, getCombinedUnlockedIds } from '@/lib/progression';

// Pin positions as % of the italy_map.png (1024×1536 portrait)
// Calibrated by reading the actual map image pixel positions
const PIN_POS: Record<string, { top: number; left: number }> = {
  ch7: { top: 13, left: 23 }, // Piemonte  — Torino, NW corner
  ch5: { top: 11, left: 39 }, // Lombardia — Milano, north-center
  ch6: { top: 12, left: 56 }, // Veneto    — Venezia, northeast
  ch4: { top: 32, left: 38 }, // Toscana   — Firenze, center
  ch1: { top: 42, left: 43 }, // Lazio     — Roma, center
  ch2: { top: 51, left: 50 }, // Campania  — Napoli, south of Roma
  ch9: { top: 70, left: 56 }, // Calabria  — toe of boot
  ch3: { top: 80, left: 40 }, // Sicilia   — Palermo, NW of island
  ch8: { top: 61, left: 21 }, // Sardegna  — center of island
};

// Road order: Piemonte → Lombardia → Veneto → Toscana → Lazio → Campania → Sicilia
const ROAD_ORDER = ['ch7','ch5','ch6','ch4','ch1','ch2','ch3'];

// Build the list of road segments to traverse between two chapter IDs
function buildWalkPath(fromId: string, toId: string): Array<{ fromId: string; toId: string }> {
  const fi = ROAD_ORDER.indexOf(fromId);
  const ti = ROAD_ORDER.indexOf(toId);
  if (fi === -1 || ti === -1 || fi === ti) return [];
  const step = fi < ti ? 1 : -1;
  const segs: Array<{ fromId: string; toId: string }> = [];
  for (let i = fi; i !== ti; i += step) {
    segs.push({ fromId: ROAD_ORDER[i], toId: ROAD_ORDER[i + step] });
  }
  return segs;
}

type ChapterState = 'locked' | 'available' | 'completed';
function getState(ch: Chapter, completed: Set<string>): ChapterState {
  if (completed.has(ch.id)) return 'completed';
  if (isChapterAvailable(ch)) return 'available';
  return 'locked';
}

export default function CampaignMap() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [unlocked,   setUnlocked]   = useState<Set<string>>(new Set(['tralalero']));
  const [rankedOk,      setRankedOk]      = useState(false);
  const [skibidiOk,     setSkibidiOk]     = useState(false);
  const [skibidiOpen,   setSkibidiOpen]   = useState(false);
  const [selected,   setSelected]   = useState<Chapter | null>(null);
  const [playerChar, setPlayerChar] = useState('tralalero');
  const [levelInfo,  setLevelInfo]  = useState<ReturnType<typeof getLevel> | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [dailyDone,     setDailyDone]     = useState<{ score: number; total: number } | null>(null);
  const [mapSize,      setMapSize]      = useState({ w: 1, h: 1 });
  const [walkPath,     setWalkPath]     = useState<Array<{ fromId: string; toId: string }>>([]);
  const [walkProgress, setWalkProgress] = useState(0); // 0→1 across entire path
  const [isMoving,     setIsMoving]     = useState(false);
  const [charPos,      setCharPos]      = useState<string>('ch1');
  const [zoomed,       setZoomed]       = useState(false);
  const [missionMode,  setMissionMode]  = useState<'snippet' | 'full'>('snippet');
  const [stars,        setStars]        = useState<Record<string, number>>({});
  const [panOffset,    setPanOffset]    = useState({ x: 0, y: 0 });
  const [isDragging,   setIsDragging]   = useState(false);
  const mapRef        = useRef<HTMLDivElement>(null);
  const animRef       = useRef<number>();
  const isDraggingRef = useRef(false);
  const dragStartRef  = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });

  useEffect(() => {
    const comp = getCompletedChapters();
    setCompleted(comp);
    setUnlocked(new Set(getCombinedUnlockedIds(loadStats(), getUnlockedCharacters())));
    setRankedOk(isRankedUnlocked());
    setSkibidiOk(isSkibidiUnlocked());
    setLevelInfo(getLevel(loadXP()));
    setPlayerChar(localStorage.getItem('rts-player-operator') ?? 'tralalero');
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem(`rts-daily-${today}`);
    if (saved) setDailyDone(JSON.parse(saved));

    // Load star ratings
    const starMap: Record<string, number> = {};
    CHAPTERS.forEach(ch => { starMap[ch.id] = getChapterStars(ch.id); });
    setStars(starMap);

    // Place character at first available chapter
    const firstAvailable = CHAPTERS.find((ch, idx) =>
      !comp.has(ch.id) && (idx === 0 || comp.has(CHAPTERS[idx - 1].id))
    );
    setCharPos(firstAvailable?.id ?? CHAPTERS[0].id);

    // Walk animation triggered from results page
    const from = localStorage.getItem('rts-move-from');
    const to   = localStorage.getItem('rts-move-to');
    if (from && to) {
      localStorage.removeItem('rts-move-from');
      localStorage.removeItem('rts-move-to');
      const path = buildWalkPath(from, to);
      if (path.length > 0) setWalkPath(path);
    }
  }, []);

  // Track the map container size so we can place SVG overlays in pixels
  useEffect(() => {
    if (!mapRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setMapSize({ w: width, h: height });
    });
    obs.observe(mapRef.current);
    return () => obs.disconnect();
  }, []);

  // Convert % pin pos → pixel coords relative to the map image inside the container
  // The image uses object-fit: contain so we account for letterbox/pillarbox padding
  function pinPx(top: number, left: number) {
    const mapAspect = 1024 / 1536; // portrait
    const boxAspect = mapSize.w / mapSize.h;
    let imgW: number, imgH: number, offX: number, offY: number;
    if (boxAspect > mapAspect) {
      // box wider → contain fills height, sides padded
      imgH = mapSize.h;
      imgW = mapSize.h * mapAspect;
      offX = (mapSize.w - imgW) / 2;
      offY = 0;
    } else {
      // box taller → contain fills width, top/bottom padded
      imgW = mapSize.w;
      imgH = mapSize.w / mapAspect;
      offX = 0;
      offY = (mapSize.h - imgH) / 2;
    }
    return {
      x: offX + (left / 100) * imgW,
      y: offY + (top  / 100) * imgH,
    };
  }

  // Cubic bezier interpolation (matches road curve formula)
  function bezierPt(t: number, from: { x: number; y: number }, to: { x: number; y: number }) {
    const cx1 = from.x + (to.x - from.x) * 0.5; const cy1 = from.y;
    const cx2 = from.x + (to.x - from.x) * 0.5; const cy2 = to.y;
    return {
      x: (1-t)**3*from.x + 3*(1-t)**2*t*cx1 + 3*(1-t)*t**2*cx2 + t**3*to.x,
      y: (1-t)**3*from.y + 3*(1-t)**2*t*cy1 + 3*(1-t)*t**2*cy2 + t**3*to.y,
    };
  }

  // Walk animation: play through all road segments in walkPath
  useEffect(() => {
    if (walkPath.length === 0 || mapSize.w <= 1) return;
    const destination = walkPath[walkPath.length - 1].toId;
    setIsMoving(true);
    setWalkProgress(0);
    const DURATION = Math.min(2400, 750 * walkPath.length); // cap at 2.4s total
    const start = performance.now();
    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / DURATION);
      // ease-in at start, ease-out at end, linear in the middle
      const eased = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
      setWalkProgress(eased);
      if (raw < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsMoving(false);
        setCharPos(destination);
        setWalkPath([]);
        setWalkProgress(0);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [walkPath, mapSize.w]);

  // Keyboard pan (WASD / arrow keys)
  useEffect(() => {
    const PAN_STEP = 50;
    const handleKey = (e: KeyboardEvent) => {
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') dx =  PAN_STEP;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = -PAN_STEP;
      if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') dy =  PAN_STEP;
      if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') dy = -PAN_STEP;
      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Drag-to-pan handler
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // let buttons handle their own clicks
    isDraggingRef.current = false;
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: panOffset.x, panY: panOffset.y };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
      if (isDraggingRef.current) {
        setPanOffset({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
      }
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // Reset isDraggingRef after a tick so click handlers can check it
      setTimeout(() => { isDraggingRef.current = false; }, 0);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Which segments of the road are completed
  function getSegmentState(fromId: string, toId: string): 'completed' | 'active' | 'locked' {
    if (completed.has(fromId) && completed.has(toId)) return 'completed';
    if (completed.has(fromId)) return 'active';
    return 'locked';
  }

  const handlePlay = async (ch: Chapter) => {
    setLoading(true);
    const res  = await fetch('/api/chapter-questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId: ch.id, full: missionMode === 'full' }),
    });
    const data = await res.json();
    if (!res.ok || !data.questions) { setLoading(false); return; }
    const qCount = data.questions.length;
    localStorage.setItem('rts-questions',       JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',          data.subject);
    localStorage.setItem('rts-chapter-id',       ch.id);
    localStorage.setItem('rts-player-operator',  playerChar);
    localStorage.setItem('rts-operator-ids',     JSON.stringify(Array(qCount).fill(ch.bossId)));
    localStorage.setItem('rts-max-hp',           String(Math.max(5, Math.floor(qCount * 0.4))));
    localStorage.removeItem('rts-daily-mode');
    setLoading(false);
    router.push(`/quiz?subject=${encodeURIComponent(data.subject)}`);
  };

  const handleRanked = async () => {
    setLoading(true);
    const res  = await fetch('/api/chapter-questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranked: true }),
    });
    const data = await res.json();
    if (!res.ok || !data.questions) { setLoading(false); return; }
    const ops = [...OPERATORS].sort(() => Math.random() - 0.5);
    localStorage.setItem('rts-questions',      JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',         data.subject);
    localStorage.setItem('rts-operator-ids',    JSON.stringify(data.questions.map((_: unknown, i: number) => ops[i % ops.length].id)));
    localStorage.setItem('rts-player-operator', playerChar);
    localStorage.setItem('rts-max-hp',          '5');
    localStorage.removeItem('rts-chapter-id');
    localStorage.removeItem('rts-daily-mode');
    setLoading(false);
    router.push(`/quiz?subject=${encodeURIComponent(data.subject)}`);
  };

  const handleDaily = async () => {
    const res  = await fetch('/api/daily-questions');
    const data = await res.json();
    if (!res.ok || !data.questions) return;
    const ops = [...OPERATORS].sort(() => Math.random() - 0.5);
    localStorage.setItem('rts-questions',      JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',         '🔥 Daily Brain Rot');
    localStorage.setItem('rts-daily-mode',      'true');
    localStorage.setItem('rts-operator-ids',    JSON.stringify(data.questions.map((_: unknown, i: number) => ops[i % ops.length].id)));
    localStorage.setItem('rts-player-operator', profile?.favorite_operator ?? playerChar);
    localStorage.removeItem('rts-chapter-id');
    router.push('/quiz?subject=%F0%9F%94%A5%20Daily%20Brain%20Rot');
  };

  const handleSkibidi = async () => {
    setLoading(true);
    const res  = await fetch('/api/skibidi-questions');
    const data = await res.json();
    if (!res.ok || !data.questions) { setLoading(false); return; }
    localStorage.setItem('rts-questions',      JSON.stringify(data.questions));
    localStorage.setItem('rts-subject',         data.subject);
    localStorage.setItem('rts-operator-ids',    JSON.stringify(data.questions.map(() => 'mrskib')));
    localStorage.setItem('rts-player-operator', playerChar);
    localStorage.setItem('rts-chapter-id',      'skibidi');
    localStorage.removeItem('rts-daily-mode');
    setLoading(false);
    router.push(`/quiz?subject=${encodeURIComponent(data.subject)}`);
  };

  const unlockedArr = [...unlocked];
  const selectedState = selected ? getState(selected, completed) : null;

  // Find the "current" chapter (first available)
  const currentChapter = CHAPTERS.find(ch => getState(ch, completed) === 'available');

  // Compute zoom transform: scale up and center on current chapter
  const ZOOM_LEVEL = 2.0;
  const mapZoomStyle: React.CSSProperties = (() => {
    const transition = isDragging ? 'none' : 'transform 0.55s cubic-bezier(0.34, 1.2, 0.64, 1)';
    const { x: panX, y: panY } = panOffset;
    if (!zoomed || mapSize.w <= 1) {
      const t = `translate(${panX}px, ${panY}px)`;
      return panX === 0 && panY === 0 ? { transition } : { transform: t, transformOrigin: 'center center', transition };
    }
    // Zoom follows: selected chapter → where character stands → first available → first chapter
    const target = selected
      ?? CHAPTERS.find(c => c.id === charPos)
      ?? currentChapter
      ?? CHAPTERS[0];
    const pos = PIN_POS[target.id];
    if (!pos) return { transition };
    const { x: px, y: py } = pinPx(pos.top, pos.left);
    // translate so pin lands at container center, then scale; pan is in screen-space so divide by ZOOM
    const tx = mapSize.w / 2 - px + panX / ZOOM_LEVEL;
    const ty = mapSize.h / 2 - py + panY / ZOOM_LEVEL;
    return { transform: `scale(${ZOOM_LEVEL}) translate(${tx}px, ${ty}px)`, transformOrigin: 'center center', transition };
  })();

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">

      {/* ── Full-bleed map background ── */}
      {/* Outer div: layout anchor, never transforms — prevents white banner when zoomed */}
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{
          background: '#feedce',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMapMouseDown}
      >
      {/* Inner div: receives zoom + pan transform */}
      <div style={{ position: 'absolute', inset: 0, ...mapZoomStyle }}>
        {/* Italy map — contain shows the full map, matching background fills gaps */}
        <img
          src="/regions/italy_map.png"
          alt="Italy"
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            userSelect: 'none',
          }}
        />

        {/* ── SVG road + nodes overlay ── */}
        {mapSize.w > 1 && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="glow-gold">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-dim">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Road segments — one per pair of consecutive chapters */}
            {ROAD_ORDER.map((id, i) => {
              if (i === 0) return null;
              const fromId  = ROAD_ORDER[i - 1];
              const fromPos = PIN_POS[fromId];
              const toPos   = PIN_POS[id];
              if (!fromPos || !toPos) return null;
              const from = pinPx(fromPos.top, fromPos.left);
              const to   = pinPx(toPos.top,   toPos.left);
              const segState = getSegmentState(fromId, id);
              const cx1 = from.x + (to.x - from.x) * 0.5;
              const cy1 = from.y;
              const cx2 = from.x + (to.x - from.x) * 0.5;
              const cy2 = to.y;
              const d   = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

              return (
                <g key={`seg-${fromId}-${id}`}>
                  {/* Road shadow */}
                  <path d={d} fill="none"
                    stroke="rgba(0,0,0,0.35)" strokeWidth={segState === 'locked' ? 2.5 : 3}
                    strokeLinecap="round" strokeDasharray={segState === 'locked' ? '5 5' : 'none'}
                  />
                  {/* Road fill */}
                  <path d={d} fill="none"
                    stroke={
                      segState === 'completed' ? '#d4a017'
                    : segState === 'active'    ? '#f7941d'
                    :                            'rgba(180,140,80,0.35)'
                    }
                    strokeWidth={segState === 'locked' ? 1.5 : 2}
                    strokeLinecap="round"
                    strokeDasharray={segState === 'locked' ? '4 5' : 'none'}
                    filter={segState !== 'locked' ? 'url(#glow-gold)' : undefined}
                    style={segState === 'active' ? { animation: 'pulse-orange 1.8s ease-in-out infinite' } : undefined}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* ── Chapter node pins ── */}
        {mapSize.w > 1 && CHAPTERS.map(ch => {
          const pos   = PIN_POS[ch.id];
          if (!pos) return null;
          const { x, y } = pinPx(pos.top, pos.left);
          const state  = getState(ch, completed);
          const isSel  = selected?.id === ch.id;
          const isCurr = currentChapter?.id === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => {
                if (isDraggingRef.current) return;
                setSelected(isSel ? null : ch);
                setPanOffset({ x: 0, y: 0 }); // re-center on new selection
                if (!isSel && !isMoving && charPos !== ch.id) {
                  const path = buildWalkPath(charPos, ch.id);
                  if (path.length > 0) setWalkPath(path);
                }
              }}
              style={{
                position: 'absolute',
                left: x, top: y,
                transform: 'translate(-50%, -50%)',
                zIndex: isSel ? 25 : isCurr ? 20 : 10,
                background: 'none', border: 'none', padding: 0,
                cursor: state === 'locked' ? 'not-allowed' : 'pointer',
              }}
            >
              {/* Node platform circle */}
              <div style={{
                width: 56, height: 56,
                borderRadius: '50%',
                background:
                  state === 'completed' ? 'linear-gradient(135deg, #008C45, #00c878)'
                : state === 'available' ? `linear-gradient(135deg, ${ch.accentColor}, ${ch.accentColor}cc)`
                : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                border: `3px solid ${
                  state === 'completed' ? 'rgba(0,200,120,0.8)'
                : state === 'available' ? 'rgba(255,255,255,0.6)'
                : 'rgba(255,255,255,0.15)'
                }`,
                boxShadow: state === 'locked' ? 'none'
                  : state === 'completed' ? '0 4px 20px rgba(0,200,120,0.5), 0 0 0 4px rgba(0,200,120,0.15)'
                  : `0 4px 20px ${ch.accentColor}66, 0 0 0 4px ${ch.accentColor}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'visible',
                transition: 'transform 0.15s',
                transform: isSel ? 'scale(1.2)' : isCurr ? 'scale(1.1)' : 'scale(1)',
              }}>
                {state === 'locked' ? (
                  <span style={{ fontSize: 22 }}>🔒</span>
                ) : charPos === ch.id && !isMoving ? (
                  // Player is here — show their character inside the circle
                  <img
                    src={`/Characters/8bit/${playerChar}.png`}
                    alt="you"
                    draggable={false}
                    className="animate-boxer"
                    style={{ width: 42, height: 42, objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                ) : (
                  <img
                    src={`/Characters/8bit/${ch.bossId}.png`}
                    alt={ch.bossName}
                    draggable={false}
                    style={{
                      width: 42, height: 42, objectFit: 'contain', imageRendering: 'pixelated',
                      filter: state === 'completed' ? 'brightness(0.7) saturate(0.5)' : 'none',
                    }}
                  />
                )}
                {state === 'completed' && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#00c878', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'white', fontWeight: 900,
                  }}>✓</div>
                )}
              </div>

              {/* Chapter label + stars below pin */}
              <div style={{
                marginTop: 5, textAlign: 'center',
                background: 'rgba(10,5,0,0.8)',
                backdropFilter: 'blur(4px)',
                borderRadius: 8, padding: '3px 8px',
                border: `1px solid ${isSel ? ch.accentColor : 'rgba(255,220,100,0.2)'}`,
              }}>
                <p style={{
                  fontFamily: "'Fredoka One', sans-serif",
                  fontSize: 9, letterSpacing: '0.05em',
                  color: state === 'completed' ? '#00c878'
                       : state === 'available' ? 'white'
                       : 'rgba(255,255,255,0.3)',
                  whiteSpace: 'nowrap',
                }}>
                  {ch.number} · {ch.region}
                </p>
                {/* Star rating */}
                {state !== 'locked' && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 1 }}>
                    {[1, 2, 3].map(i => (
                      <span key={i} style={{
                        fontSize: 8,
                        color: i <= (stars[ch.id] ?? 0) ? '#d4a017' : 'rgba(255,255,255,0.15)',
                        lineHeight: 1,
                      }}>★</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* ── Sardegna: Skibidi Toilet Bowl event pin (trophy-shaped SVG) ── */}
        {mapSize.w > 1 && (() => {
          const pos = PIN_POS['ch8'];
          if (!pos) return null;
          const { x, y } = pinPx(pos.top, pos.left);
          return (
            <button
              key="sardegna-event"
              onClick={() => {
                if (isDraggingRef.current) return;
                setSelected(null);
                setSkibidiOpen(o => !o);
                setPanOffset({ x: 0, y: 0 });
              }}
              style={{
                position: 'absolute',
                left: x, top: y,
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center center',
                scale: skibidiOpen ? '1.15' : '1',
                transition: 'scale 0.15s',
                zIndex: skibidiOpen ? 25 : 15,
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <style>{`
                @keyframes trophy-pulse {
                  0%,100% { filter: drop-shadow(0 0 5px rgba(212,160,23,0.55)) drop-shadow(0 2px 12px rgba(139,92,246,0.45)); }
                  50%     { filter: drop-shadow(0 0 14px rgba(212,160,23,1)) drop-shadow(0 2px 24px rgba(139,92,246,0.9)); }
                }
              `}</style>

              {/* Trophy image pin */}
              <img
                src="/ui/skibidi_trophy.png"
                alt="Skibidi Toilet Bowl"
                style={{
                  width: 88, height: 88,
                  objectFit: 'contain',
                  display: 'block',
                  animation: skibidiOk ? 'trophy-pulse 2.8s ease-in-out infinite' : 'none',
                  filter: skibidiOk ? undefined : 'brightness(0.25) saturate(0)',
                }}
              />

              {/* Label */}
              <div style={{
                marginTop: 3, textAlign: 'center',
                background: 'rgba(10,5,0,0.88)',
                backdropFilter: 'blur(4px)',
                borderRadius: 8, padding: '4px 10px',
                border: `1px solid ${skibidiOpen ? 'rgba(212,160,23,0.65)' : skibidiOk ? 'rgba(212,160,23,0.3)' : 'rgba(255,220,100,0.15)'}`,
              }}>
                <p style={{
                  fontFamily: "'Fredoka One', sans-serif",
                  fontSize: 7, letterSpacing: '0.06em',
                  color: skibidiOk ? '#d4a017' : 'rgba(255,255,255,0.3)',
                  whiteSpace: 'nowrap', textTransform: 'uppercase',
                }}>🚽 Skibidi Toilet Bowl</p>
              </div>
            </button>
          );
        })()}

        {/* ── Player character — walks along road segments, enters pin circle on arrival ── */}
        {mapSize.w > 1 && isMoving && walkPath.length > 0 && (() => {
          const N      = walkPath.length;
          const scaled = walkProgress * N;
          const segIdx = Math.min(Math.floor(scaled), N - 1);
          const t      = scaled - segIdx; // 0→1 within this segment
          const seg    = walkPath[segIdx];
          if (!PIN_POS[seg.fromId] || !PIN_POS[seg.toId]) return null;

          const from = pinPx(PIN_POS[seg.fromId].top, PIN_POS[seg.fromId].left);
          const to   = pinPx(PIN_POS[seg.toId].top,   PIN_POS[seg.toId].left);
          const pt   = bezierPt(t, from, to);

          // Smooth facing: use derivative of bezier at t to get travel direction
          const dt   = Math.min(t + 0.01, 1);
          const ptDt = bezierPt(dt, from, to);
          const facingLeft = ptDt.x < pt.x;

          return (
            <div style={{
              position: 'absolute',
              left: pt.x, top: pt.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', zIndex: 30,
            }}>
              <img
                src={`/Characters/8bit/${playerChar}.png`}
                alt="player"
                draggable={false}
                className="animate-boxer"
                style={{
                  height: 44, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated', display: 'block',
                  transform: facingLeft ? 'scaleX(-1)' : 'none',
                }}
              />
            </div>
          );
        })()}
      </div>{/* end inner zoom div */}

      {/* Dark overlay sits OUTSIDE the zoom div so it always covers full screen — no banner mismatch */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(160deg, rgba(30,15,0,0.35) 0%, rgba(10,5,0,0.18) 50%, rgba(30,15,0,0.38) 100%)',
      }} />
      </div>{/* end outer mapRef div */}

      {/* ── Top bar ── */}
      <header className="relative z-30 flex items-center justify-between px-4 h-12 flex-none"
              style={{ background: 'rgba(10,5,0,0.7)', borderBottom: '1px solid rgba(255,210,80,0.2)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1.2rem' }}>🍕</span>
          <span className="text-xs uppercase tracking-[0.2em]"
                style={{ color: '#f7941d', fontFamily: "'Fredoka One', sans-serif" }}>
            Capital BrainRot
          </span>
          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(212,160,23,0.2)', color: '#d4a017', fontFamily: "'Fredoka One', sans-serif", border: '1px solid rgba(212,160,23,0.3)' }}>
            {completed.size}/{CHAPTERS.length} Conquered
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <button onClick={() => router.push('/characters')}
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,220,150,0.6)', fontFamily: "'Fredoka One', sans-serif" }}>
            Collection
          </button>
          <button onClick={() => router.push('/leaderboard')}
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,220,150,0.6)', fontFamily: "'Fredoka One', sans-serif" }}>
            Leaderboard
          </button>
          {user ? (
            <button onClick={() => router.push('/account')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border"
                    style={{ borderColor: 'rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.1)' }}>
              {profile?.favorite_operator && (
                <img src={`/Characters/8bit/${profile.favorite_operator}.png`} alt=""
                     style={{ width: 18, height: 18, objectFit: 'contain', imageRendering: 'pixelated' }} />
              )}
              <span className="text-[10px] uppercase tracking-widest"
                    style={{ color: '#d4a017', fontFamily: "'Fredoka One', sans-serif" }}>
                {profile?.username ?? '...'}
              </span>
              {levelInfo && (
                <span className="text-[8px] px-1 rounded"
                      style={{ background: 'rgba(212,160,23,0.2)', color: '#d4a017', fontFamily: "'Fredoka One', sans-serif" }}>
                  LV{levelInfo.level}
                </span>
              )}
            </button>
          ) : (
            <div className="relative">
              <button onClick={() => router.push('/login')}
                      className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-xl border"
                      style={{ color: '#f7941d', borderColor: 'rgba(247,148,29,0.4)', fontFamily: "'Fredoka One', sans-serif" }}>
                Log In
              </button>
              {/* Save-progress nudge */}
              <div className="absolute right-0 top-full mt-2 z-50 pointer-events-none"
                   style={{ animation: 'nudge 2s ease-in-out infinite' }}>
                {/* Arrow pointing up-right toward button */}
                <div style={{
                  position: 'absolute', top: -8, right: 10,
                  width: 0, height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: '8px solid rgba(247,148,29,0.9)',
                }} />
                <div style={{
                  background: 'rgba(20,10,0,0.92)',
                  border: '1.5px solid rgba(247,148,29,0.6)',
                  borderRadius: 10,
                  padding: '6px 10px',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(247,148,29,0.2)',
                }}>
                  <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 10, color: '#f7941d', letterSpacing: '0.05em' }}>
                    🍕 Save your progress!
                  </p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 9, color: 'rgba(255,220,150,0.75)', marginTop: 1 }}>
                    Create an account to track wins
                  </p>
                </div>
              </div>
              <style>{`
                @keyframes nudge {
                  0%, 100% { transform: translateY(0); opacity: 1; }
                  50%       { transform: translateY(-4px); opacity: 0.85; }
                }
              `}</style>
            </div>
          )}
        </nav>
      </header>

      {/* ── Zoom toggle ── */}
      <button
        onClick={() => { setZoomed(z => !z); setPanOffset({ x: 0, y: 0 }); }}
        className="fixed bottom-16 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
        style={{
          background: 'rgba(10,5,0,0.82)',
          border: '1px solid rgba(255,220,100,0.3)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,220,120,0.9)',
          fontFamily: "'Fredoka One', sans-serif",
          fontSize: 11,
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {zoomed ? '🗺 Full Map' : '🎯 Focus'}
      </button>

      {/* ── Daily + Ranked quick buttons ── */}
      {!selected && (
        <div className="fixed bottom-6 right-4 z-30 flex flex-col gap-2 items-end">
          {rankedOk && (
            <button onClick={handleRanked} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider"
                    style={{ background: 'rgba(212,160,23,0.9)', color: 'white', border: '2px solid rgba(255,220,100,0.4)', boxShadow: '0 4px 20px rgba(212,160,23,0.5)', fontFamily: "'Fredoka One', sans-serif", cursor: 'pointer' }}>
              👑 RANKED
            </button>
          )}
          <button
            onClick={dailyDone ? undefined : handleDaily}
            disabled={!!dailyDone}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider"
            style={{
              background: dailyDone ? 'rgba(0,140,69,0.8)' : 'rgba(206,43,55,0.9)',
              color: 'white',
              border: `2px solid ${dailyDone ? 'rgba(0,200,120,0.4)' : 'rgba(255,100,80,0.4)'}`,
              boxShadow: dailyDone ? 'none' : '0 4px 20px rgba(206,43,55,0.5)',
              fontFamily: "'Fredoka One', sans-serif",
              cursor: dailyDone ? 'default' : 'pointer',
            }}>
            {dailyDone ? `✓ Daily ${Math.round((dailyDone.score / dailyDone.total) * 100)}%` : '🔥 DAILY'}
          </button>
        </div>
      )}

      {/* ── Chapter briefing drawer ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        transform: selected ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        background: 'rgba(12,7,2,0.97)',
        borderTop: `2px solid ${selected?.accentColor ?? '#d4a017'}`,
        boxShadow: `0 -8px 40px ${selected?.accentColor ?? '#d4a017'}33`,
        borderRadius: '24px 24px 0 0',
        padding: '16px 20px 32px',
        backdropFilter: 'blur(20px)',
        maxHeight: '65vh', overflowY: 'auto',
      }}>
        {selected && (
          <>
            {/* Drag handle */}
            <div className="flex justify-center mb-4">
              <div style={{ width: 40, height: 3, borderRadius: 2, background: 'rgba(255,220,100,0.3)' }} />
            </div>

            {/* Chapter header */}
            <div className="flex items-center gap-4 mb-4">
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={`/Characters/8bit/${selected.bossId}.png`} alt={selected.bossName}
                     style={{
                       height: 88, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated',
                       filter: selectedState === 'locked' ? 'grayscale(1) brightness(0.3)' : 'drop-shadow(0 4px 16px rgba(0,0,0,0.9))',
                     }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.3em', color: selected.accentColor, textTransform: 'uppercase', marginBottom: 2 }}>
                  Chapter {selected.number} · {selected.region}
                </p>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 20, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 6 }}>
                  {selected.name}
                </p>
                {/* Star rating in drawer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {[1,2,3].map(i => (
                    <span key={i} style={{ fontSize: 16, color: i <= (stars[selected.id] ?? 0) ? '#d4a017' : 'rgba(255,255,255,0.12)' }}>★</span>
                  ))}
                  {selectedState === 'completed' && (
                    <span style={{ fontSize: 9, color: '#00c878', fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Conquered</span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,220,150,0.5)', fontFamily: "'Fredoka One', sans-serif" }}>
                  Boss: <span style={{ color: 'rgba(255,220,150,0.85)' }}>{selected.bossName}</span>
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                      style={{ color: 'rgba(255,255,255,0.25)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}>✕</button>
            </div>

            {/* Topic card */}
            {selectedState !== 'locked' && (
              <div style={{
                background: `${selected.accentColor}18`,
                border: `1px solid ${selected.accentColor}40`,
                borderRadius: 12, padding: '10px 14px', marginBottom: 14,
              }}>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: selected.accentColor, textTransform: 'uppercase', marginBottom: 4 }}>
                  📚 Topic — {selected.topic}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,220,150,0.65)', fontFamily: "'Nunito', sans-serif" }}>
                  {selected.topicHints}
                </p>
              </div>
            )}

            {selectedState === 'locked' ? (
              <div className="text-center py-6">
                <p style={{ color: 'rgba(255,220,150,0.4)', fontFamily: "'Fredoka One', sans-serif", fontSize: 14 }}>
                  🔒 Complete Chapter {CHAPTERS[CHAPTERS.findIndex(c => c.id === selected.id) - 1]?.number ?? '?'} to unlock
                </p>
              </div>
            ) : (
              <>
                {/* Mission mode toggle */}
                <div className="mb-5">
                  <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,220,150,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Mission type
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['snippet', 'full'] as const).map(mode => (
                      <button key={mode} onClick={() => setMissionMode(mode)}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 12,
                          border: `2px solid ${missionMode === mode ? selected.accentColor : 'rgba(255,220,100,0.15)'}`,
                          background: missionMode === mode ? `${selected.accentColor}25` : 'rgba(255,255,255,0.04)',
                          color: missionMode === mode ? 'white' : 'rgba(255,220,150,0.4)',
                          fontFamily: "'Fredoka One', sans-serif", fontSize: 12,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        {mode === 'snippet' ? '✂ Snippet  ·  10 Qs' : '📚 Full Mission'}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 9, color: 'rgba(255,220,150,0.3)', fontFamily: "'Nunito', sans-serif", marginTop: 5 }}>
                    {missionMode === 'snippet' ? '10 random questions from this chapter\'s bank' : 'Every question in this chapter\'s bank, shuffled'}
                  </p>
                </div>

                {/* Character picker */}
                <div className="mb-5">
                  <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,220,150,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Play as
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {unlockedArr.map(id => (
                      <button key={id}
                        onClick={() => { setPlayerChar(id); localStorage.setItem('rts-player-operator', id); }}
                        style={{
                          padding: 6, borderRadius: 12,
                          border: `2px solid ${playerChar === id ? selected.accentColor : 'rgba(255,220,100,0.15)'}`,
                          background: playerChar === id ? `${selected.accentColor}25` : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer', transition: 'all 0.1s',
                        }}>
                        <img src={`/Characters/8bit/${id}.png`} alt={id}
                             style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Play button */}
                <button
                  onClick={() => handlePlay(selected)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '15px',
                    borderRadius: 18, border: `2px solid ${selected.accentColor}99`,
                    background: `linear-gradient(135deg, ${selected.accentColor}ee, ${selected.accentColor}99)`,
                    color: 'white', fontFamily: "'Fredoka One', sans-serif",
                    fontSize: 18, fontWeight: 900, letterSpacing: '0.15em',
                    textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer',
                    boxShadow: `0 6px 30px ${selected.accentColor}55`,
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? '...' : selectedState === 'completed' ? `⚔ Replay CH${selected.number}` : `⚔ Siege ${selected.region}!`}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Click outside chapter drawer to close */}
      {selected && (
        <div className="fixed inset-0" style={{ zIndex: 35 }} onClick={() => setSelected(null)} />
      )}

      {/* ── Skibidi Toilet Bowl drawer ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        transform: skibidiOpen ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        background: 'rgba(10,3,20,0.97)',
        borderTop: '2px solid rgba(139,92,246,0.8)',
        boxShadow: '0 -8px 40px rgba(139,92,246,0.35)',
        borderRadius: '24px 24px 0 0',
        padding: '16px 20px 32px',
        backdropFilter: 'blur(20px)',
        maxHeight: '65vh', overflowY: 'auto',
      }}>
        {skibidiOpen && (
          <>
            <div className="flex justify-center mb-4">
              <div style={{ width: 40, height: 3, borderRadius: 2, background: 'rgba(139,92,246,0.4)' }} />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src="/Characters/8bit/mrskib.png"
                  alt="Mr. Skib"
                  style={{
                    height: 88, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated',
                    filter: skibidiOk
                      ? 'drop-shadow(0 4px 16px rgba(139,92,246,0.9))'
                      : 'grayscale(1) brightness(0.3)',
                  }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.fontSize = '3rem'; (e.currentTarget as HTMLImageElement).alt = '🚽'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.3em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 2 }}>
                  Special Event · Sardegna
                </p>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 20, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 6 }}>
                  🚽 Skibidi Toilet Bowl
                </p>
                <p style={{ fontSize: 10, color: 'rgba(167,139,250,0.6)', fontFamily: "'Fredoka One', sans-serif" }}>
                  Boss: <span style={{ color: 'rgba(167,139,250,0.9)' }}>Mr. Skib</span>
                </p>
              </div>
              <button onClick={() => setSkibidiOpen(false)}
                      style={{ color: 'rgba(255,255,255,0.25)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}>✕</button>
            </div>

            {/* Event description */}
            <div style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 12, padding: '10px 14px', marginBottom: 14,
            }}>
              <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 4 }}>
                📋 25-Question Gauntlet — All Chapters
              </p>
              <p style={{ fontSize: 11, color: 'rgba(167,139,250,0.7)', fontFamily: "'Nunito', sans-serif", lineHeight: 1.5 }}>
                CH1 (×3) · CH2 (×4) · CH3 (×4) · CH12 (×5) · CH13 (×5) · CH15 (×4) · CH17 (×4)
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif", marginTop: 4 }}>
                Questions drawn randomly from every chapter. No second chances.
              </p>
            </div>

            {!skibidiOk ? (
              <div className="text-center py-6">
                <p style={{ color: 'rgba(167,139,250,0.45)', fontFamily: "'Fredoka One', sans-serif", fontSize: 14 }}>
                  🔒 Complete 3 chapters to unlock
                </p>
                <p style={{ color: 'rgba(167,139,250,0.25)', fontFamily: "'Nunito', sans-serif", fontSize: 11, marginTop: 4 }}>
                  {completed.size}/3 chapters done
                </p>
              </div>
            ) : (
              <>
                {/* Character picker */}
                <div className="mb-5">
                  <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Play as
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {unlockedArr.map(id => (
                      <button key={id}
                        onClick={() => { setPlayerChar(id); localStorage.setItem('rts-player-operator', id); }}
                        style={{
                          padding: 6, borderRadius: 12,
                          border: `2px solid ${playerChar === id ? '#a78bfa' : 'rgba(139,92,246,0.2)'}`,
                          background: playerChar === id ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer', transition: 'all 0.1s',
                        }}>
                        <img src={`/Characters/8bit/${id}.png`} alt={id}
                             style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSkibidi}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '15px',
                    borderRadius: 18, border: '2px solid rgba(139,92,246,0.6)',
                    background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                    color: 'white', fontFamily: "'Fredoka One', sans-serif",
                    fontSize: 18, fontWeight: 900, letterSpacing: '0.15em',
                    textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer',
                    boxShadow: '0 6px 30px rgba(139,92,246,0.55)',
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? '...' : '🚽 Enter the Toilet Bowl'}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Click outside Skibidi drawer to close */}
      {skibidiOpen && (
        <div className="fixed inset-0" style={{ zIndex: 35 }} onClick={() => setSkibidiOpen(false)} />
      )}
    </div>
  );
}
