'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);

    // Check username not taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) { setError('Username already taken.'); setLoading(false); return; }

    const { error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signupErr) { setError(signupErr.message); setLoading(false); return; }
    router.push('/');
  };

  return (
    <main className="min-h-screen siege-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(232,0,26,0.75)' }}>
            // New Operator
          </p>
          <h1 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#e8eaf2' }}>
            Create Account
          </h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="callsign"
              required
              className="w-full px-4 py-3 bg-transparent text-sm font-mono outline-none"
              style={{
                background: 'rgba(13,13,20,0.8)',
                border: '1px solid rgba(247,148,29,0.3)',
                color: '#e8eaf2',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@base.com"
              required
              className="w-full px-4 py-3 bg-transparent text-sm font-mono outline-none"
              style={{
                background: 'rgba(13,13,20,0.8)',
                border: '1px solid rgba(247,148,29,0.3)',
                color: '#e8eaf2',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#6b7090' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-transparent text-sm font-mono outline-none"
              style={{
                background: 'rgba(13,13,20,0.8)',
                border: '1px solid rgba(247,148,29,0.3)',
                color: '#e8eaf2',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            />
          </div>

          {error && (
            <p className="text-xs font-mono" style={{ color: '#e8001a' }}>⚠ {error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full siege-btn-primary mt-2"
          >
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
