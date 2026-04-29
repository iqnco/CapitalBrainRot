'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { loadXP, getLevel } from '@/lib/progression';

const ALL_CHARS = [
  'tralalero', 'bombardilocrocodilo', 'bombardinigusini', 'capuccinoasesino',
  'tungtungsahur', 'lirililarila', 'brrprrpatapim', 'trippitroppi',
  'chimpanzinibananini', 'lavacasaturnosaturnita', 'mrskib',
];

// Positions on the roman_ruins_map.png (1024×1024 square)
const BATTLE_SITES = [
  { id: 'ps1',       label: 'Problem Set 1', codename: 'FORUM PRIMA',   icon: '📝', color: '#CE2B37', top: 30, left: 20 },
  { id: 'ps2',       label: 'Problem Set 2', codename: 'FORUM SECONDA', icon: '📝', color: '#f7941d', top: 58, left: 38 },
  { id: 'ps3',       label: 'Problem Set 3', codename: 'ARENA TERTIA',  icon: '📝', color: '#008C45', top: 48, left: 73 },
  { id: 'mock-exam', label: 'Mock Exam',     codename: 'TRIAL OF ROME', icon: '⚔️', color: '#d4a017', top: 20, left: 50 },
] as const;

type SiteId = typeof BATTLE_SITES[number]['id'];
type Site = typeof BATTLE_SITES[number];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RomanRuinsPage() {
  const router               = useRouter();
  const { user, profile }    = useAuth();
  const mapRef               = useRef<HTMLDivElement>(null);

  const [opponents,   setOpponents]   = useState<Record<SiteId, string>>({} as Record<SiteId, string>);
  const [playerChar,  setPlayerChar]  = useState('tralalero');
  const [selected,    setSelected]    = useState<Site | null>(null);
  const [missionMode, setMissionMode] = useState<'snippet' | 'full'>('snippet');
  const [loading,     setLoading]     = useState(false);
  const [levelInfo,   setLevelInfo]   = useState<ReturnType<typeof getLevel> | null>(null);
  const [mapSize,     setMapSize]     = useState({ w: 1, h: 1 });

  useEffect(() => {
    const chars = shuffle(ALL_CHARS);
    const opps = {} as Record<SiteId, string>;
    BATTLE_SITES.forEach((site, i) => { opps[site.id] = chars[i % chars.length]; });
    setOpponents(opps);
    setPlayerChar(localStorage.getItem('rts-player-operator') ?? 'tralalero');
    setLevelInfo(getLevel(loadXP()));
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setMapSize({ w: width, h: height });
    });
    obs.observe(mapRef.current);
    return () => obs.disconnect();
  }, []);

  // Pin pixel coords accounting for square map contained in arbitrary box
  function pinPx(top: number, left: number) {
    const boxAspect = mapSize.w / mapSize.h;
    let imgW: number, imgH: number, offX: number, offY: number;
    if (boxAspect > 1) {
      imgH = mapSize.h; imgW = mapSize.h;
      offX = (mapSize.w - imgW) / 2; offY = 0;
    } else {
      imgW = mapSize.w; imgH = mapSize.w;
      offX = 0; offY = (mapSize.h - imgH) / 2;
    }
    return { x: offX + (left / 100) * imgW, y: offY + (top / 100) * imgH };
  }

  const handleSiege = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/ruins-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: selected.id, full: missionMode === 'full' }),
      });
      const data = await res.json() as { questions?: unknown[]; subject?: string; error?: string };
      if (!res.ok || !data.questions) { setLoading(false); return; }

      const qCount     = data.questions.length;
      const opponentId = opponents[selected.id] ?? 'tralalero';

      localStorage.setItem('rts-questions',      JSON.stringify(data.questions));
      localStorage.setItem('rts-subject',         data.subject ?? selected.label);
      localStorage.setItem('rts-chapter-id',      'roman-ruins');
      localStorage.setItem('rts-player-operator', playerChar);
      localStorage.setItem('rts-operator-ids',    JSON.stringify(Array(qCount).fill(opponentId)));
      localStorage.setItem('rts-max-hp',          String(Math.max(5, Math.floor(qCount * 0.4))));
      localStorage.removeItem('rts-daily-mode');

      router.push(`/quiz?subject=${encodeURIComponent(data.subject ?? selected.label)}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#feedce' }}>

      {/* ── Map background ── */}
      <div ref={mapRef} className="absolute inset-0" style={{ background: '#feedce', overflow: 'hidden' }}>
        <img
          src="/regions/roman_ruins_map.png"
          alt="Roman Ruins"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain', objectPosition: 'center',
            opacity: 0.9,
          }}
        />
        {/* Warm vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(10,5,0,0.65) 100%)',
        }} />

        {/* ── Battle markers ── */}
        {mapSize.w > 1 && BATTLE_SITES.map(site => {
          const { x, y } = pinPx(site.top, site.left);
          const opId     = opponents[site.id];
          const isSel    = selected?.id === site.id;

          return (
            <button
              key={site.id}
              onClick={() => setSelected(isSel ? null : site)}
              style={{
                position: 'absolute', left: x, top: y,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                zIndex: isSel ? 25 : 10,
              }}
            >
              {/* Glow ring behind pin when selected */}
              {isSel && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -68%)',
                  width: 80, height: 80, borderRadius: '50%',
                  background: `radial-gradient(circle, ${site.color}55 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Pin circle */}
              <div style={{
                width: isSel ? 62 : 50, height: isSel ? 62 : 50,
                borderRadius: '50%',
                background: `radial-gradient(circle at 38% 32%, ${site.color}dd, ${site.color}88)`,
                border: `3px solid ${isSel ? '#FFF9F0' : site.color}99`,
                boxShadow: isSel
                  ? `0 0 0 5px ${site.color}33, 0 0 28px ${site.color}`
                  : `0 3px 16px ${site.color}77`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                overflow: 'hidden',
              }}>
                {opId ? (
                  <img
                    src={`/Characters/8bit/${opId}.png`}
                    alt=""
                    style={{
                      width: isSel ? 50 : 40, height: isSel ? 50 : 40,
                      objectFit: 'contain', imageRendering: 'pixelated',
                    }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                  />
                ) : (
                  <span style={{ fontSize: 20 }}>{site.icon}</span>
                )}
              </div>

              {/* Label tag */}
              <div style={{
                background: 'rgba(10,5,0,0.88)', backdropFilter: 'blur(4px)',
                border: `1px solid ${isSel ? site.color : 'rgba(255,220,100,0.2)'}`,
                borderRadius: 6, padding: '2px 7px',
              }}>
                <p style={{
                  fontFamily: "'Fredoka One', sans-serif",
                  fontSize: 8, color: isSel ? site.color : 'rgba(255,249,240,0.85)',
                  whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {site.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Left side — back to Italia tab ── */}
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed', left: 0, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 30,
          writingMode: 'vertical-rl',
          padding: '20px 10px',
          background: 'rgba(10,5,0,0.88)',
          border: '1px solid rgba(212,160,23,0.45)',
          borderLeft: 'none',
          borderRadius: '0 12px 12px 0',
          color: '#d4a017',
          fontFamily: "'Fredoka One', sans-serif",
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '4px 0 20px rgba(212,160,23,0.18)',
        }}
      >
        🍕 Back to Italia
      </button>

      {/* ── Header ── */}
      <header className="relative z-30 flex items-center justify-between px-4 h-12 flex-none"
              style={{ background: 'rgba(10,5,0,0.7)', borderBottom: '1px solid rgba(255,210,80,0.2)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2">
          <span style={{ background: 'rgba(212,160,23,0.18)', color: '#d4a017', fontFamily: "'Fredoka One', sans-serif",
                         fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                         padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(212,160,23,0.3)' }}>
            🏛 Roman Ruins
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <button onClick={() => router.push('/leaderboard')}
                  style={{ color: 'rgba(255,220,150,0.55)', fontFamily: "'Fredoka One', sans-serif", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
            Leaderboard
          </button>
          {user ? (
            <button onClick={() => router.push('/account')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 12,
                             border: '1px solid rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.1)', cursor: 'pointer' }}>
              {profile?.favorite_operator && (
                <img src={`/Characters/8bit/${profile.favorite_operator}.png`} alt=""
                     style={{ width: 18, height: 18, objectFit: 'contain', imageRendering: 'pixelated' }} />
              )}
              <span style={{ color: '#d4a017', fontFamily: "'Fredoka One', sans-serif", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {profile?.username ?? '...'}
              </span>
              {levelInfo && (
                <span style={{ background: 'rgba(212,160,23,0.2)', color: '#d4a017', fontFamily: "'Fredoka One', sans-serif", fontSize: 8, padding: '1px 4px', borderRadius: 4 }}>
                  LV{levelInfo.level}
                </span>
              )}
            </button>
          ) : (
            <button onClick={() => router.push('/login')}
                    style={{ color: '#f7941d', border: '1px solid rgba(247,148,29,0.4)', fontFamily: "'Fredoka One', sans-serif",
                             fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                             borderRadius: 12, padding: '4px 10px', background: 'none', cursor: 'pointer' }}>
              Log In
            </button>
          )}
        </nav>
      </header>

      {/* ── Battle briefing drawer ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        transform: selected ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        background: 'rgba(12,7,2,0.97)',
        borderTop: `2px solid ${selected?.color ?? '#d4a017'}`,
        boxShadow: `0 -8px 40px ${selected?.color ?? '#d4a017'}33`,
        borderRadius: '24px 24px 0 0',
        padding: '16px 20px 36px',
        backdropFilter: 'blur(20px)',
        maxHeight: '65vh', overflowY: 'auto',
      }}>
        {selected && (
          <>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 3, borderRadius: 2, background: 'rgba(255,220,100,0.3)' }} />
            </div>

            {/* Mission header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ flexShrink: 0 }}>
                <img
                  src={`/Characters/8bit/${opponents[selected.id]}.png`}
                  alt=""
                  style={{
                    height: 88, width: 'auto', objectFit: 'contain', imageRendering: 'pixelated',
                    filter: `drop-shadow(0 4px 20px ${selected.color}99)`,
                  }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.3em', color: selected.color, textTransform: 'uppercase', marginBottom: 3 }}>
                  🏛 Roman Ruins · {selected.codename}
                </p>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 22, fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 6 }}>
                  {selected.label}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,220,150,0.45)', fontFamily: "'Fredoka One', sans-serif" }}>
                  Opponent: <span style={{ color: 'rgba(255,220,150,0.85)', textTransform: 'uppercase' }}>
                    {opponents[selected.id]}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ color: 'rgba(255,255,255,0.25)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}
              >✕</button>
            </div>

            {/* Mission type toggle */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,220,150,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                Mission type
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['snippet', 'full'] as const).map(mode => (
                  <button key={mode} onClick={() => setMissionMode(mode)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 12,
                      border: `2px solid ${missionMode === mode ? selected.color : 'rgba(255,220,100,0.15)'}`,
                      background: missionMode === mode ? `${selected.color}25` : 'rgba(255,255,255,0.04)',
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
                {missionMode === 'snippet' ? '10 random questions from this bank' : 'Every question in this bank, shuffled'}
              </p>
            </div>

            {/* Play as */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,220,150,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>
                Play as
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_CHARS.map(id => (
                  <button
                    key={id}
                    onClick={() => { setPlayerChar(id); localStorage.setItem('rts-player-operator', id); }}
                    style={{
                      padding: 6, borderRadius: 12, cursor: 'pointer', transition: 'all 0.1s',
                      border: `2px solid ${playerChar === id ? selected.color : 'rgba(255,220,100,0.15)'}`,
                      background: playerChar === id ? `${selected.color}25` : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <img
                      src={`/Characters/8bit/${id}.png`}
                      alt={id}
                      style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Siege button */}
            <button
              onClick={handleSiege}
              disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 18,
                border: `2px solid ${selected.color}99`,
                background: `linear-gradient(135deg, ${selected.color}ee, ${selected.color}99)`,
                color: 'white', fontFamily: "'Fredoka One', sans-serif",
                fontSize: 18, fontWeight: 900, letterSpacing: '0.15em',
                textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer',
                boxShadow: `0 6px 30px ${selected.color}55`,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '⏳ Loading...' : `⚔ Siege the ${selected.label}!`}
            </button>
          </>
        )}
      </div>

      {/* Click outside drawer to close */}
      {selected && (
        <div className="fixed inset-0" style={{ zIndex: 35 }} onClick={() => setSelected(null)} />
      )}
    </div>
  );
}
