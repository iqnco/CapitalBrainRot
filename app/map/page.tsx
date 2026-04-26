'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadXP, getLevel } from '@/lib/progression';
import { REGIONS, getUnlockedRegions, type Region } from '@/lib/regions';

// Approximate pin positions on the italy_map.png (portrait, ~1024×1536 source)
const PIN_POS: Record<string, { top: string; left: string }> = {
  lazio:     { top: '46%', left: '40%' },
  campania:  { top: '60%', left: '52%' },
  sicily:    { top: '82%', left: '44%' },
  tuscany:   { top: '31%', left: '27%' },
  lombardy:  { top: '9%',  left: '30%' },
  veneto:    { top: '12%', left: '50%' },
  piedmont:  { top: '13%', left: '14%' },
  sardinia:  { top: '54%', left: '6%'  },
};

type RevealStage = 'idle' | 'blackout' | 'spotlight' | 'burst' | 'celebrate' | 'done';

function Shockwave({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', zIndex: 10,
      width: 80, height: 80, borderRadius: '50%',
      border: `3px solid ${color}`,
      animation: 'shockwave 0.7s ease-out forwards',
      pointerEvents: 'none',
    }} />
  );
}

function FloatingEmoji({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', fontSize: 28, zIndex: 20,
      animation: 'floatUp 1.2s ease-out forwards',
      pointerEvents: 'none',
      ...style,
    }}>{emoji}</div>
  );
}

function MapContent() {
  const router     = useRouter();
  const params     = useSearchParams();
  const revealId   = params.get('reveal');

  const [xp, setXp]               = useState(0);
  const [selected, setSelected]   = useState<Region | null>(null);
  const [stage, setStage]         = useState<RevealStage>(revealId ? 'blackout' : 'idle');
  const [revealRegion, setRevealRegion] = useState<Region | null>(null);
  const [shockwaves, setShockwaves]     = useState<number[]>([]);
  const [floaters, setFloaters]         = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
  const [pinAnimating, setPinAnimating] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() { timerRef.current.forEach(clearTimeout); timerRef.current = []; }
  function after(ms: number, fn: () => void) {
    const t = setTimeout(fn, ms); timerRef.current.push(t); return t;
  }

  useEffect(() => {
    const currentXP = loadXP();
    setXp(currentXP);

    if (revealId) {
      const region = REGIONS.find(r => r.id === revealId);
      if (!region) { setStage('idle'); return; }
      setRevealRegion(region);
      setPinAnimating(revealId);

      // Stage timeline
      after(400,  () => setStage('spotlight'));
      after(1400, () => setStage('burst'));
      after(1450, () => setShockwaves(w => [...w, Date.now()]));
      after(1700, () => {
        const emojis = ['🍕','🇮🇹','⚔️','🎉','🔥','👑'];
        const items = emojis.map((emoji, i) => ({
          id: Date.now() + i, emoji,
          x: 30 + Math.random() * 40,
          y: 30 + Math.random() * 40,
        }));
        setFloaters(items);
      });
      after(2000, () => setStage('celebrate'));
      after(4200, () => {
        setStage('done');
        setPinAnimating(null);
        after(600, () => setStage('idle'));
      });
    }

    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedIds  = new Set(getUnlockedRegions(xp).map(r => r.id));
  const lvlInfo      = getLevel(xp);
  const nextLocked   = REGIONS.find(r => !unlockedIds.has(r.id));
  const totalPct     = Math.round((unlockedIds.size / REGIONS.length) * 100);

  const isBlackout   = stage === 'blackout' || stage === 'spotlight';
  const isBurst      = stage === 'burst' || stage === 'celebrate';

  function handlePinClick(region: Region) {
    if (!unlockedIds.has(region.id) || stage !== 'idle') return;
    setSelected(prev => prev?.id === region.id ? null : region);
  }

  function handleSiege() {
    if (!selected) return;
    localStorage.setItem('rts-region', selected.id);
    router.push('/');
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ background: '#0e0e1a', overflowX: 'hidden' }}>

      {/* ── Full-screen cinematic overlay ── */}
      {isBlackout && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: '#000',
          animation: 'darkOverlayFadeIn 0.4s ease forwards',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {stage === 'spotlight' && revealRegion && (
            <div style={{ textAlign: 'center', animation: 'spotlightExpand 0.9s cubic-bezier(0.22,1,0.36,1) forwards' }}>
              <p className="text-xs uppercase tracking-[0.5em] mb-4"
                 style={{ color: revealRegion.accentColor, fontFamily: "'Fredoka One', sans-serif", opacity: 0.8 }}>
                Territorio Conquistato
              </p>
              <img
                src={`/Characters/8bit/${revealRegion.characterId}.png`}
                alt=""
                style={{ width: 80, height: 80, imageRendering: 'pixelated', objectFit: 'contain',
                         animation: 'characterRevealDrop 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Burst / celebrate overlay ── */}
      {isBurst && revealRegion && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12,
        }}>
          {/* Shockwaves */}
          <div style={{ position: 'absolute', top: '50%', left: '50%' }}>
            {shockwaves.map(id => <Shockwave key={id} color={revealRegion.accentColor} />)}
          </div>

          {/* Floating emojis */}
          {floaters.map(f => (
            <FloatingEmoji key={f.id} emoji={f.emoji} style={{ left: `${f.x}%`, top: `${f.y}%` }} />
          ))}

          {/* Region backdrop preview */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${revealRegion.bgImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.25,
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '0 24px' }}>
            <p className="text-xs uppercase tracking-[0.6em] mb-3"
               style={{ color: revealRegion.accentColor, fontFamily: "'Fredoka One', sans-serif" }}>
              🔓 Regione Sbloccata
            </p>

            <img
              src={`/Characters/8bit/${revealRegion.characterId}.png`}
              alt=""
              style={{
                width: 100, height: 100, imageRendering: 'pixelated', objectFit: 'contain',
                marginBottom: 12,
                animation: 'characterRevealDrop 0.6s cubic-bezier(0.22,1,0.36,1) both',
                filter: `drop-shadow(0 0 20px ${revealRegion.accentColor})`,
              }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
            />

            <p style={{
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: 'clamp(2.4rem, 10vw, 4rem)',
              color: '#FFF9F0',
              lineHeight: 1,
              textShadow: `0 0 40px ${revealRegion.accentColor}`,
              animation: 'regionNameSlam 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {revealRegion.name}
            </p>

            <p style={{
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: '1rem',
              color: revealRegion.accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              marginTop: 6,
            }}>
              {revealRegion.city}
            </p>

            <p style={{
              marginTop: 12,
              color: 'rgba(255,249,240,0.6)',
              fontSize: '0.85rem',
              fontFamily: "'Fredoka One', sans-serif",
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              {revealRegion.characterName} joins the battle
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="w-full flex items-center justify-between px-5 pt-5 pb-3 z-10" style={{ maxWidth: 480 }}>
        <button onClick={() => router.push('/')}
                className="text-xs uppercase tracking-widest"
                style={{ color: 'rgba(255,249,240,0.5)', fontFamily: "'Fredoka One', sans-serif" }}>
          ← Home
        </button>
        <p className="text-xs uppercase tracking-[0.4em]"
           style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
          ⚔ Italia Campaign
        </p>
        <div className="px-2 py-0.5 rounded-lg"
             style={{ background: 'rgba(206,43,55,0.2)', color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif", fontSize: 11, fontWeight: 'bold' }}>
          LV.{lvlInfo.level} — {lvlInfo.name}
        </div>
      </div>

      {/* ── Italy Map with pins ── */}
      <div className="relative w-full z-10" style={{ maxWidth: 420, padding: '0 16px' }}>
        {/* Map image — grayscale base, gets "lit up" by unlocked region glows */}
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden',
                      boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}>
          <img
            src="/regions/italy_map.png"
            alt="Map of Italy"
            style={{
              width: '100%', display: 'block',
              filter: `grayscale(${Math.max(0, 1 - unlockedIds.size * 0.13)}) brightness(${0.35 + unlockedIds.size * 0.08})`,
              transition: 'filter 1.2s ease',
            }}
          />
          {/* Colored overlay for each unlocked region — creates the "lit up" effect */}
          {REGIONS.map(region => {
            const isUnlocked = unlockedIds.has(region.id);
            const pos = PIN_POS[region.id];
            if (!pos) return null;
            return (
              <div key={region.id + '-glow'} style={{
                position: 'absolute',
                top: pos.top, left: pos.left,
                transform: 'translate(-50%, -50%)',
                width: 90, height: 90,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${region.accentColor}55 0%, transparent 70%)`,
                opacity: isUnlocked ? 1 : 0,
                transition: 'opacity 1.4s ease',
                pointerEvents: 'none',
              }} />
            );
          })}
        </div>

        {/* Region pins */}
        {REGIONS.map(region => {
          const isUnlocked  = unlockedIds.has(region.id);
          const isSelected  = selected?.id === region.id;
          const isAnimating = pinAnimating === region.id;
          const pos         = PIN_POS[region.id] ?? { top: '50%', left: '50%' };

          return (
            <button
              key={region.id}
              onClick={() => handlePinClick(region)}
              style={{
                position: 'absolute',
                top: pos.top, left: pos.left,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: 0, background: 'none', border: 'none',
                cursor: isUnlocked && stage === 'idle' ? 'pointer' : 'default',
                zIndex: isSelected ? 20 : 10,
                animation: isAnimating ? 'mapPinBounce 0.8s cubic-bezier(0.22,1,0.36,1) 1.5s both' : 'none',
              }}
            >
              {/* Pin circle */}
              <div style={{
                width: isSelected ? 54 : 42,
                height: isSelected ? 54 : 42,
                borderRadius: '50%',
                background: isUnlocked ? region.accentColor : '#2a2a3a',
                border: `3px solid ${isSelected ? '#FFF9F0' : isUnlocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isSelected
                  ? `0 0 0 4px ${region.accentColor}66, 0 0 20px ${region.accentColor}`
                  : isUnlocked
                  ? `0 2px 12px ${region.accentColor}66`
                  : 'none',
                transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {isUnlocked ? (
                  <img
                    src={`/Characters/8bit/${region.characterId}.png`}
                    alt=""
                    style={{
                      width: isSelected ? 40 : 30, height: isSelected ? 40 : 30,
                      objectFit: 'contain', imageRendering: 'pixelated',
                      filter: 'none',
                    }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                  />
                ) : (
                  <span style={{ fontSize: 14, opacity: 0.4 }}>🔒</span>
                )}
              </div>

              {/* Region name tag */}
              <div style={{
                background: isUnlocked ? region.accentColor : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isUnlocked ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6, padding: '1px 5px',
                opacity: isUnlocked ? 1 : 0.3,
              }}>
                <p style={{
                  fontFamily: "'Fredoka One', sans-serif",
                  fontSize: 7, color: '#fff', whiteSpace: 'nowrap',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {region.name}
                </p>
              </div>

              {/* "Level X" badge on locked pins */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#CE2B37', borderRadius: 8,
                  padding: '1px 4px',
                  fontSize: 7, color: '#fff',
                  fontFamily: "'Fredoka One', sans-serif",
                  whiteSpace: 'nowrap',
                }}>
                  LV{region.levelRequired}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Selected region card ── */}
      <div style={{
        width: '100%', maxWidth: 420, padding: '0 16px',
        marginTop: 16, zIndex: 10,
        minHeight: selected ? 'auto' : 0,
        transition: 'all 0.3s ease',
      }}>
        {selected && (
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: `2px solid ${selected.accentColor}55`,
            boxShadow: `0 4px 24px ${selected.accentColor}33`,
            animation: 'regionColorReveal 0.4s ease both',
          }}>
            {/* Backdrop strip */}
            <div style={{ position: 'relative', height: 110, overflow: 'hidden' }}>
              <img src={selected.bgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(14,14,26,1) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 14 }}>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, color: selected.accentColor, letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                  {selected.city}
                </p>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 22, color: '#FFF9F0', lineHeight: 1, textTransform: 'uppercase', fontWeight: 900 }}>
                  {selected.name}
                </p>
              </div>
            </div>

            {/* Character + siege button */}
            <div style={{ background: '#16162a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={`/Characters/8bit/${selected.characterId}.png`}
                alt=""
                style={{ width: 52, height: 52, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0,
                         filter: `drop-shadow(0 0 8px ${selected.accentColor})` }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, color: 'rgba(255,249,240,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                  Region Boss
                </p>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 13, color: '#FFF9F0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selected.characterName}
                </p>
              </div>
              <button
                onClick={handleSiege}
                style={{
                  background: selected.accentColor,
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '10px 20px',
                  fontFamily: "'Fredoka One', sans-serif",
                  fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${selected.accentColor}66`,
                }}
              >
                SIEGE →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ width: '100%', maxWidth: 420, padding: '16px 16px 100px', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, color: 'rgba(255,249,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            Italia Conquistata
          </p>
          <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, color: '#CE2B37', fontWeight: 'bold' }}>
            {unlockedIds.size} / {REGIONS.length} — {totalPct}%
          </p>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            width: `${totalPct}%`,
            background: 'linear-gradient(90deg, #CE2B37, #f7941d)',
            transition: 'width 1s ease',
          }} />
        </div>
        {nextLocked && (
          <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 9, color: 'rgba(255,249,240,0.3)', marginTop: 5, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Reach Level {nextLocked.levelRequired} → Unlock {nextLocked.name}
          </p>
        )}
      </div>

    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense>
      <MapContent />
    </Suspense>
  );
}
