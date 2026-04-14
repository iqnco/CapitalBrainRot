'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MISSIONS } from '@/lib/missions';
import { useAuth } from '@/components/AuthProvider';

const DIFF_STYLE: Record<string, { label: string; color: string }> = {
  ROOKIE:   { label: 'ROOKIE',   color: '#22c55e' },
  OPERATOR: { label: 'OPERATOR', color: '#f7941d' },
  ELITE:    { label: 'ELITE',    color: '#e8001a' },
};

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [selected, setSelected]       = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  const selectedMission = MISSIONS.find((m) => m.id === selected) ?? null;
  const canDeploy = selected !== null && (!selectedMission?.maps || selectedMap !== null);

  const handleDeploy = () => {
    if (!canDeploy || !selected) return;
    const selectedMissionObj = MISSIONS.find((m) => m.id === selected);
    const subject = selectedMissionObj
      ? selectedMap
        ? `${selectedMissionObj.name} — ${selectedMissionObj.maps?.find(m => m.id === selectedMap)?.name ?? ''}`
        : selectedMissionObj.name
      : '';
    const params = new URLSearchParams({ missionId: selected });
    if (selectedMap) params.set('mapId', selectedMap);
    if (subject)    params.set('subject', subject);
    router.push(`/chapters?${params.toString()}`);
  };

  return (
    <main className="min-h-screen siege-bg flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 h-12 border-b"
              style={{ background: 'rgba(5,5,10,0.9)', borderColor: 'rgba(232,0,26,0.2)' }}>
        <div className="flex items-center gap-2">
          {/* R6 six-point icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="none" stroke="#e8001a" strokeWidth="1.5"/>
            <polygon points="12,5 17.5,8.5 17.5,15.5 12,19 6.5,15.5 6.5,8.5" fill="#e8001a" opacity="0.3"/>
          </svg>
          <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: '#e8001a' }}>
            R6 SIEGE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/leaderboard')}
            className="text-xs font-mono uppercase tracking-widest transition-colors hover:text-white"
            style={{ color: '#6b7090' }}
          >
            Leaderboard
          </button>
          {user ? (
            <>
              <button
                onClick={() => router.push('/account')}
                className="flex items-center gap-2 px-3 py-1 border transition-colors hover:border-orange-400"
                style={{ borderColor: 'rgba(247,148,29,0.35)', background: 'rgba(247,148,29,0.06)' }}
              >
                {profile?.favorite_operator && (
                  <img
                    src={`/chibis/${profile.favorite_operator}.png`}
                    alt=""
                    style={{ width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                )}
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#f7941d' }}>
                  {profile?.username ?? user.email}
                </span>
              </button>
              <button
                onClick={() => signOut()}
                className="text-xs font-mono uppercase tracking-widest transition-colors hover:text-white"
                style={{ color: '#6b7090' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="text-xs font-mono uppercase tracking-widest transition-colors hover:text-white"
                style={{ color: '#6b7090' }}
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="text-xs font-mono uppercase tracking-widest px-3 py-1 border transition-colors hover:text-white"
                style={{ color: '#f7941d', borderColor: 'rgba(247,148,29,0.4)' }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Title block */}
        <div className="text-center mb-14 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-[0.5em] mb-5"
             style={{ color: 'rgba(232,0,26,0.8)' }}>
            // Tactical Study Simulation
          </p>

          <h1 className="text-glow-white leading-none mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                       fontSize: 'clamp(3rem, 10vw, 5.5rem)', letterSpacing: '0.06em',
                       color: '#ffffff', textTransform: 'uppercase' }}>
            RAINBOW
          </h1>
          <div className="siege-divider my-1 mx-auto" style={{ width: '70%' }} />
          <h1 className="text-glow-orange leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                       fontSize: 'clamp(3rem, 10vw, 5.5rem)', letterSpacing: '0.06em',
                       color: '#f7941d', textTransform: 'uppercase' }}>
            STUDY SIEGE
          </h1>
        </div>

        {/* ── Select Operation label ── */}
        <div className="w-full max-w-3xl mb-3 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(232,0,26,0.25)' }} />
          <p className="text-xs font-mono uppercase tracking-[0.35em]" style={{ color: '#6b7090' }}>
            Select Operation
          </p>
          <div className="flex-1 h-px" style={{ background: 'rgba(232,0,26,0.25)' }} />
        </div>

        {/* Mission list */}
        <div className="w-full max-w-3xl space-y-2 mb-6">
          {MISSIONS.map((m) => {
            const isSelected = selected === m.id;
            const diff = DIFF_STYLE[m.difficulty] ?? { label: m.difficulty, color: '#6b7090' };
            return (
              <button
                key={m.id}
                onClick={() => {
                  if (!m.available) return;
                  setSelected(m.id);
                  setSelectedMap(null);
                }}
                disabled={!m.available}
                className="w-full text-left p-5 transition-all duration-150 op-card"
                style={{
                  ...(isSelected && {
                    borderColor: '#f7941d',
                    background: 'rgba(247,148,29,0.07)',
                    boxShadow: '0 0 22px rgba(247,148,29,0.2)',
                  }),
                  opacity: m.available ? 1 : 0.4,
                  cursor: m.available ? 'pointer' : 'not-allowed',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono uppercase tracking-[0.3em] mb-0.5"
                       style={{ color: isSelected ? '#f7941d' : 'rgba(232,0,26,0.7)' }}>
                      {m.codename}
                    </p>
                    <p className="font-bold text-2xl uppercase tracking-wide leading-tight"
                       style={{ color: isSelected ? '#ffffff' : '#c8cad6' }}>
                      {m.name}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#6b7090' }}>{m.description}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                    <span className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 border"
                          style={{ color: diff.color, borderColor: `${diff.color}55`,
                                   background: `${diff.color}10`,
                                   clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                      {diff.label}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-mono tracking-widest" style={{ color: '#f7941d' }}>
                        ▶ SELECTED
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Map selection */}
        {selectedMission?.maps && (
          <div className="w-full max-w-3xl mb-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(232,0,26,0.25)' }} />
              <p className="text-xs font-mono uppercase tracking-[0.35em]" style={{ color: '#6b7090' }}>
                Choose Map
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(232,0,26,0.25)' }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selectedMission.maps.map((map) => {
                const isActive = selectedMap === map.id;
                const isLocked = map.available === false;
                return (
                  <button
                    key={map.id}
                    onClick={() => { if (!isLocked) setSelectedMap(map.id); }}
                    disabled={isLocked}
                    className="text-left p-4 transition-all duration-150 op-card"
                    style={{
                      ...(isActive && {
                        borderColor: '#f7941d',
                        background: 'rgba(247,148,29,0.07)',
                        boxShadow: '0 0 16px rgba(247,148,29,0.2)',
                      }),
                      opacity: isLocked ? 0.35 : 1,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] mb-0.5"
                       style={{ color: isActive ? '#f7941d' : 'rgba(232,0,26,0.6)' }}>
                      {map.codename}
                    </p>
                    <p className="font-bold text-base uppercase tracking-wide"
                       style={{ color: isActive ? '#ffffff' : '#c8cad6' }}>
                      {map.name}
                    </p>
                    {isLocked && (
                      <p className="text-[10px] font-mono mt-1 uppercase tracking-widest"
                         style={{ color: '#6b7090' }}>
                        [Classified]
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Deploy button */}
        <button
          onClick={handleDeploy}
          disabled={!canDeploy}
          className="siege-btn-primary mb-3"
          style={{ minWidth: '320px', fontSize: '1.2rem', padding: '1rem 2rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          DEPLOY
        </button>

        <p className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: '#3a3a50' }}>
          10 Objectives · 5 Lives
        </p>
      </div>
    </main>
  );
}
