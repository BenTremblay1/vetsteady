'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); } else { setSent(true); }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@yourpractice.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading || !email} className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Sending link...' : 'Send magic link'}
      </button>
    </form>
  );
}
