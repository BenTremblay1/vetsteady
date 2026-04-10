'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import GoogleAuthButton from './GoogleAuthButton';

type Mode = 'magic-link' | 'password';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('password');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('')
  const supabase = createClient();

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      window.location.href = '/dashboard';
    }
    setLoading(false);
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">📬</div>
        <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
        <p className="mt-2 text-sm text-gray-600">We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleAuthButton redirectTo="/dashboard" label="Sign in with Google" />

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

    <form onSubmit={mode === 'password' ? handlePasswordSubmit : handleMagicLinkSubmit} className="space-y-4">
      {mode === 'password' ? (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@yourpractice.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-[#0D7377] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#0a5c60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@yourpractice.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[#0D7377] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#0a5c60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending link...' : 'Send magic link'}
          </button>
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => { setMode(mode === 'password' ? 'magic-link' : 'password'); setError(''); setSent(false); }}
          className="text-xs text-gray-500 hover:text-[#0D7377] transition-colors"
        >
          {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
        </button>
      </div>
    </form>
    </div>
  );
}
