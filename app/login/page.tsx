'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/');
  };

  return (
    <main className="min-h-screen siege-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(232,0,26,0.75)' }}>
            // Authentication
          </p>
          <h1 className="text-3xl font-black uppercase tracking-widest" style={{ color: '#e8eaf2' }}>
            Sign In
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <button type="submit" disabled={loading} className="w-full siege-btn-primary mt-2">
            {loading ? 'Authenticating...' : 'Enter Base'}
          </button>
        </form>

        <p className="text-center text-xs font-mono mt-6" style={{ color: '#3d4560' }}>
          No account?{' '}
          <button onClick={() => router.push('/signup')}
                  className="hover:text-white transition-colors" style={{ color: '#f7941d' }}>
            Create one
          </button>
        </p>
      </div>
    </main>
  );
}
