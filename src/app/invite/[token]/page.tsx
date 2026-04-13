'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ practice_name: string; role: string } | null>(null);

  // Check auth state on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setChecking(false);
    }
    checkAuth();
  }, []);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/staff/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to accept invite');
      setSuccess({ practice_name: json.data.practice_name, role: json.data.role });
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAccepting(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white font-bold text-lg"
            style={{ backgroundColor: '#0D7377' }}
          >
            VS
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            You&apos;ve been invited to join a practice
          </h1>
          <p className="text-sm text-gray-500">
            Accept this invite to join the team on VetSteady.
          </p>
        </div>

        {/* Success state */}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              Welcome! You&apos;ve joined {success.practice_name} as {success.role}.
            </p>
            <p className="text-xs text-green-600 mt-1">Redirecting to dashboard...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Authenticated: show accept button */}
        {!success && user && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0D7377' }}
            >
              {accepting ? 'Accepting...' : 'Accept Invite'}
            </button>
          </div>
        )}

        {/* Not authenticated: show Google sign-in */}
        {!success && !user && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Sign in to accept this invite and join the practice.
            </p>
            <GoogleAuthButton
              redirectTo={`/invite/${token}`}
              label="Sign in with Google to accept"
            />
          </div>
        )}
      </div>
    </div>
  );
}
