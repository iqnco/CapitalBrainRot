'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, OPERATORS, COUNTRIES, flagEmoji } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [operator, setOperator] = useState('ash');
  const [country, setCountry]   = useState('US');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setOperator(profile.favorite_operator ?? 'ash');
      setCountry(profile.country ?? 'US');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ favorite_operator: operator, country }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || !user) {
    return (
      <main className="h-screen siege-bg flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
             style={{ borderColor: '#f7941d', borderTopColor: 'transparent' }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen siege-bg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)' }}>
        <button onClick={() => router.push('/')}
                className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
                style={{ color: '#6b7090' }}>
          ← LOBBY
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-mono uppercase tracking-[0.3em]"
                style={{ color: 'rgba(232,0,26,0.75)' }}>// Operator HQ</span>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-8 space-y-8">

        {/* Identity */}
        <div className="op-card px-5 py-4">
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#3d4560' }}>Callsign</p>
          <p className="font-black text-xl uppercase tracking-widest" style={{ color: '#e8eaf2' }}>
            {profile?.username}
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: '#6b7090' }}>{user.email}</p>
        </div>

        {/* Operator picker */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#6b7090' }}>
            Favorite Operator
          </p>
          <div className="grid grid-cols-3 gap-2">
            {OPERATORS.map(op => {
              const active = operator === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperator(op.id)}
                  className="flex flex-col items-center gap-1 py-2 px-1 transition-all"
                  style={{
                    background: active ? 'rgba(247,148,29,0.12)' : 'rgba(13,13,20,0.6)',
                    border: `1px solid ${active ? 'rgba(247,148,29,0.7)' : 'rgba(255,255,255,0.07)'}`,
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  }}
                >
                  <img
                    src={`/chibis/${op.id}.png`}
                    alt={op.name}
                    style={{ width: 52, height: 52, objectFit: 'contain', imageRendering: 'pixelated' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                  />
                  <span className="text-[9px] font-mono uppercase tracking-widest"
                        style={{ color: active ? '#f7941d' : '#6b7090' }}>
                    {op.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country picker */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#6b7090' }}>Country</p>
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontSize: '2rem' }}>{flagEmoji(country)}</span>
            <span className="text-sm font-mono" style={{ color: '#e8eaf2' }}>
              {COUNTRIES.find(c => c.code === country)?.name}
            </span>
          </div>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-4 py-3 text-sm font-mono outline-none"
            style={{
              background: 'rgba(13,13,20,0.8)',
              border: '1px solid rgba(247,148,29,0.3)',
              color: '#e8eaf2',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: '#0d0d14' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full siege-btn-primary"
        >
          {saved ? '✓ SAVED' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </main>
  );
}
