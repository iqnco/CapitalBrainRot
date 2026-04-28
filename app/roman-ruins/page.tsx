'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { loadXP, getLevel } from '@/lib/progression';

const MISSIONS = [
  { id: 'ps1',               label: 'Problem Set 1',     icon: '📝', color: '#CE2B37' },
  { id: 'ps2',               label: 'Problem Set 2',     icon: '📝', color: '#CE2B37' },
  { id: 'ps3',               label: 'Problem Set 3',     icon: '📝', color: '#CE2B37' },
  { id: 'mock-exam',         label: 'Mock Exam',         icon: '📋', color: '#d4a017' },
  { id: 'last-years-final',  label: "Last Year's Final", icon: '🏛', color: '#008C45' },
];

export default function RomanRuinsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [levelInfo, setLevelInfo] = useState<ReturnType<typeof getLevel> | null>(null);

  useEffect(() => {
    setLevelInfo(getLevel(loadXP()));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0500', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header className="relative z-30 flex items-center justify-between px-4 h-12 flex-none"
              style={{ background: 'rgba(10,5,0,0.9)', borderBottom: '1px solid rgba(255,210,80,0.2)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>🍕</span>
            <span className="text-xs uppercase tracking-[0.2em]"
                  style={{ color: '#f7941d', fontFamily: "'Fredoka One', sans-serif" }}>
              Capital BrainRot
            </span>
          </button>
          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017', fontFamily: "'Fredoka One', sans-serif", border: '1px solid rgba(212,160,23,0.25)' }}>
            🏛 Roman Ruins
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <button onClick={() => router.push('/characters')}
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,220,150,0.6)', fontFamily: "'Fredoka One', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}>
            Collection
          </button>
          <button onClick={() => router.push('/leaderboard')}
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,220,150,0.6)', fontFamily: "'Fredoka One', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}>
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
            <button onClick={() => router.push('/login')}
                    className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-xl border"
                    style={{ color: '#f7941d', borderColor: 'rgba(247,148,29,0.4)', fontFamily: "'Fredoka One', sans-serif", background: 'none', cursor: 'pointer' }}>
              Log In
            </button>
          )}
        </nav>
      </header>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px 100px' }}>

        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,160,23,0.55)', marginBottom: 10 }}>
            // Special Operations
          </p>
          <h1 style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 30, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.1, marginBottom: 10 }}>
            🏛 The Roman Ruins
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(255,220,150,0.35)' }}>
            Map coming soon · Drop in questions to activate missions
          </p>
        </div>

        {/* Mission list */}
        <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MISSIONS.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', borderRadius: 16,
              background: 'rgba(255,220,100,0.03)',
              border: `1px solid ${m.color}30`,
              opacity: 0.65,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 15, color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: 'rgba(255,220,150,0.3)', marginTop: 2 }}>
                  Add questions to content/roman-ruins/{m.id}/
                </p>
              </div>
              <span style={{ flexShrink: 0, fontSize: 9, fontFamily: "'Fredoka One', sans-serif", color: 'rgba(255,220,150,0.2)', letterSpacing: '0.1em' }}>
                🔒 SOON
              </span>
            </div>
          ))}
        </div>

        {/* Back */}
        <button onClick={() => router.push('/')}
                style={{ marginTop: 36, fontFamily: "'Fredoka One', sans-serif", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,220,150,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Campaign Map
        </button>
      </div>
    </div>
  );
}
