'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, OPERATORS, COUNTRIES } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [operator, setOperator] = useState('ash');
  const [country, setCountry]   = useState('US');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) { setError('Username already taken.'); setLoading(false); return; }

    const { data: signupData, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signupErr) { setError(signupErr.message); setLoading(false); return; }

    // Upsert profile — handles both the trigger-created row and the race where trigger hasn't fired yet
    if (signupData.user) {
      await supabase.from('profiles').upsert({
        id: signupData.user.id,
        username,
        favorite_operator: operator,
        country,
      });
    }

    router.push('/');
  };

  const inputStyle = {
    background: 'rgba(13,13,20,0.8)',
    border: '1px solid rgba(247,148,29,0.3)',
    color: '#e8eaf2',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
  };

  return (
    <main className="min-h-screen siege-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(232,0,26,0.75)' }}>
            // New Operator
          </p>
          <h1 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#e8eaf2' }}>
            Create Account
          </h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="callsign"
              required
              className="w-full px-4 py-3 bg-transparent text-sm font-mono outline-none"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@base.com"
              required
              className="w-full px-4 py-3 bg-transparent text-sm font-mono outline-none"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-transparent text-sm font-mono outline-none"
              style={inputStyle}
            />
          </div>

          {/* Operator picker */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#6b7090' }}>
              Favorite Operator
            </label>
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
                      style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }}
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
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full px-4 py-3 text-sm font-mono outline-none"
              style={{ ...inputStyle, border: '1px solid rgba(247,148,29,0.3)' }}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code} style={{ background: '#0d0d14' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs font-mono" style={{ color: '#e8001a' }}>⚠ {error}</p>}

          <button type="submit" disabled={loading} className="w-full siege-btn-primary mt-2">
            {loading ? 'Deploying...' : 'Deploy Operator'}
          </button>
        </form>

        <p className="text-center text-xs font-mono mt-6" style={{ color: '#3d4560' }}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')}
                  className="hover:text-white transition-colors" style={{ color: '#f7941d' }}>
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}
