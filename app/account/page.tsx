'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, OPERATORS, COUNTRIES, flagEmoji } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { syncChapterToRemote } from '@/lib/chapter-sync';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [operator, setOperator] = useState('tralalero');
  const [country, setCountry]   = useState('US');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncing, setSyncing]     = useState(false);
  const [syncDone, setSyncDone]   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setOperator(profile.favorite_operator ?? 'tralalero');
      setCountry(profile.country ?? 'US');
    }
  }, [profile]);

  const handleSyncProgress = async () => {
    setSyncing(true);
    const completed: string[] = JSON.parse(localStorage.getItem('rts-chapters-complete') ?? '[]');
    const stars: Record<string, number> = JSON.parse(localStorage.getItem('rts-chapter-stars') ?? '{}');
    const allIds = new Set([...completed, ...Object.keys(stars)]);
    for (const chapterId of allIds) {
      await syncChapterToRemote(chapterId, stars[chapterId] ?? 0, completed.includes(chapterId));
    }
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 3000);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);

    const res = await fetch('/api/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        username: profile?.username ?? user.email?.split('@')[0] ?? user.id.slice(0, 8),
        favorite_operator: operator,
        country,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setSaveError(json.error ?? 'Save failed');
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || !user) {
    return (
      <main className="h-screen siege-bg flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
             style={{ borderColor: '#008C45', borderTopColor: 'transparent' }} />
      </main>
    );
  }

  const labelStyle: React.CSSProperties = {
    color: '#7A7A8C',
    fontFamily: "'Fredoka One', sans-serif",
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
  };

  return (
    <main className="min-h-screen siege-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center px-5 h-14 border-b"
              style={{ background: 'rgba(255,249,240,0.95)', borderColor: '#E0CCB0', backdropFilter: 'blur(8px)' }}>
        <button onClick={() => router.push('/')}
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
          ← Lobby
        </button>
        <h1 className="flex-1 text-center text-base uppercase tracking-widest"
            style={{ color: '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
          Operator HQ
        </h1>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          className="text-sm transition-colors hover:opacity-70"
          style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
          Sign Out
        </button>
      </header>

      <div className="mx-auto max-w-md px-4 pt-8 space-y-8">

        {/* Identity */}
        <div className="op-card px-5 py-4">
          <p className="mb-1" style={labelStyle}>Callsign</p>
          <p className="font-black text-xl uppercase tracking-widest" style={{ color: '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
            {profile?.username ?? '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#B0A090', fontFamily: "'Nunito', sans-serif" }}>{user.email}</p>
        </div>

        {/* Operator picker */}
        <div>
          <p className="mb-3" style={labelStyle}>Favourite Character</p>
          <div className="grid grid-cols-5 gap-2">
            {OPERATORS.map(op => {
              const active = operator === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperator(op.id)}
                  className="flex flex-col items-center gap-1 py-2 px-1 transition-all rounded-xl"
                  style={{
                    background: active ? 'rgba(0,140,69,0.1)' : 'rgba(255,255,255,0.7)',
                    border: `2px solid ${active ? '#008C45' : '#E0CCB0'}`,
                    boxShadow: active ? '0 0 0 3px rgba(0,140,69,0.15)' : 'none',
                  }}
                >
                  <img
                    src={`/Characters/8bit/${op.id}.png`}
                    alt={op.name}
                    style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                  />
                  <span className="text-[8px] uppercase tracking-wide text-center leading-tight"
                        style={{ color: active ? '#008C45' : '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
                    {op.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country picker */}
        <div>
          <p className="mb-2" style={labelStyle}>Country</p>
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontSize: '1.8rem' }}>{flagEmoji(country)}</span>
            <span className="text-sm" style={{ color: '#1A1A2E', fontFamily: "'Nunito', sans-serif" }}>
              {COUNTRIES.find(c => c.code === country)?.name}
            </span>
          </div>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.8)',
              border: '2px solid #E0CCB0',
              color: '#1A1A2E',
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Sync progress */}
        <button
          onClick={handleSyncProgress}
          disabled={syncing}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 16, border: '1px solid rgba(212,160,23,0.35)',
            background: syncDone ? 'rgba(34,197,94,0.1)' : 'rgba(212,160,23,0.08)',
            color: syncDone ? '#22c55e' : '#d4a017',
            fontFamily: "'Fredoka One', sans-serif",
            fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: syncing ? 'wait' : 'pointer',
            opacity: syncing ? 0.7 : 1,
          }}
        >
          {syncDone ? '✓ Progress Synced!' : syncing ? 'Syncing...' : '☁ Sync Progress to Cloud'}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full siege-btn-primary"
        >
          {saved ? '✓ Salvato!' : saving ? 'Saving...' : '🍕 Save Changes'}
        </button>

        {saveError && (
          <p className="text-center text-sm" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
            ⚠ {saveError}
          </p>
        )}
      </div>
    </main>
  );
}
