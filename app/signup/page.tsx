'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, OPERATORS, COUNTRIES } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [operator, setOperator] = useState('tralalero');
  const [country, setCountry]   = useState('US');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError('Username too short (min. 3 characters).'); return; }
    if (password.length < 6) { setError('Password too short (min. 6 characters).'); return; }
    setLoading(true);

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) { setError('Username already taken. Pick another!'); setLoading(false); return; }

    const { data: signupData, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signupErr) { setError(signupErr.message); setLoading(false); return; }

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

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.8)',
    border: '2px solid #E0CCB0',
    color: '#1A1A2E',
    borderRadius: '12px',
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    fontSize: '0.95rem',
    fontFamily: "'Nunito', sans-serif",
  };

  return (
    <main className="min-h-screen siege-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] mb-2"
             style={{ color: 'rgba(206,43,55,0.75)', fontFamily: "'Fredoka One', sans-serif" }}>
            🍕 New Player
          </p>
          <h1 className="text-3xl uppercase tracking-widest"
              style={{ color: '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
            Create Account
          </h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1"
                   style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="il_tuo_nome"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1"
                   style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tralalero@tralala.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1"
                   style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {/* Character picker */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2"
                   style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
              Favourite Character
            </label>
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
                          style={{ color: active ? '#008C45' : '#7A7A8C',
                                   fontFamily: "'Fredoka One', sans-serif" }}>
                      {op.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country picker */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1"
                   style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
              Country
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              style={{ ...inputStyle }}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
              🍕 {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="w-full siege-btn-primary mt-2">
            {loading ? 'Loading...' : '🍕 Let\'s Go!'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#B0A090' }}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')}
                  className="transition-colors hover:text-r6-red"
                  style={{ color: '#008C45', fontFamily: "'Fredoka One', sans-serif" }}>
            Log In
          </button>
        </p>
      </div>
    </main>
  );
}
