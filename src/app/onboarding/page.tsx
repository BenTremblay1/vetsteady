'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Building2, User, Stethoscope, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { friendlyAuthError } from '@/lib/utils/auth-errors';
import { trackOnboardingComplete, identify } from '@/lib/analytics/posthog';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { createClient } from '@/lib/supabase/client';

// ─── Onboarding Page ──────────────────────────────────────────────────────────
// New practices go through a 3-step wizard:
//   1. Create account (Supabase magic link email)
//   2. Practice details (name, timezone, phone)
//   3. First staff member (the logged-in admin)
//
// On submit: calls /api/v1/onboarding which runs the
// create_practice_with_admin() Postgres function + seeds default appointment types.

type Step = 'account' | 'practice' | 'staff';

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'account',  label: 'Account',  icon: <User size={16} /> },
  { id: 'practice', label: 'Practice', icon: <Building2 size={16} /> },
  { id: 'staff',    label: 'Your Info', icon: <Stethoscope size={16} /> },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#0D7377' }}>VetSteady</h1>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('account');
  const [submitting, setSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — account
  const [email, setEmail] = useState('');

  // Step 2 — practice
  const [practiceName, setPracticeName] = useState('');
  const [practicePhone, setPracticePhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');

  // Step 3 — staff
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'vet' | 'receptionist'>('admin');

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResendMagicLink() {
    if (resendCooldown > 0 || !email.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/v1/onboarding/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to resend');
      setResendCooldown(60);
    } catch (err: any) {
      setError(friendlyAuthError(err.message));
    }
  }

  // Auto-detect if user is already authenticated (e.g., came back from Google OAuth)
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is already authenticated — skip to practice details
        if (user.email) setEmail(user.email);
        setStep('practice');
      }
    }
    checkSession();
  }, []);

  // ─── Step 1: Send magic link ──────────────────────────────────────────────
  async function handleSendMagicLink() {
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/onboarding/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to send magic link');
      setMagicLinkSent(true);
      setResendCooldown(60);
    } catch (err: any) {
      setError(friendlyAuthError(err.message));
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Final submit ──────────────────────────────────────────────────────────
  async function handleFinish() {
    if (!practiceName.trim() || !staffName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_name: practiceName.trim(),
          practice_slug: slugify(practiceName),
          practice_phone: practicePhone.trim() || null,
          timezone,
          staff_name: staffName.trim(),
          staff_role: staffRole,
          referral_slug: searchParams.get('ref'),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Setup failed');

      // 📊 Analytics: identify user + fire onboarding_complete event
      if (json.practice_id) {
        identify(json.staff_id ?? email, {
          practice_id: json.practice_id,
          practice_name: practiceName,
          staff_role: staffRole,
          email,
        });
        trackOnboardingComplete({
          practice_id: json.practice_id,
          practice_name: practiceName,
          timezone,
          staff_role: staffRole,
        });
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#0D7377' }}>VetSteady</h1>
          <p className="mt-1 text-sm text-gray-500">Keep your practice running. Every appointment counts.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step indicator */}
          <div className="flex border-b border-gray-100">
            {STEPS.map((s, i) => {
              const isDone = i < stepIndex;
              const isActive = s.id === step;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-4 text-xs font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-teal-600 text-teal-700'
                      : isDone
                      ? 'border-teal-300 text-teal-500'
                      : 'border-transparent text-gray-400',
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors',
                      isActive ? 'bg-teal-600 text-white' :
                      isDone   ? 'bg-teal-100 text-teal-600' :
                                 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {isDone ? <Check size={13} /> : s.icon}
                  </div>
                  {s.label}
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="p-8">
            {/* ── Step 1: Account ── */}
            {step === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started in seconds — no password needed.
                  </p>
                </div>

                {!magicLinkSent ? (
                  <>
                    {/* Google OAuth — primary CTA */}
                    <GoogleAuthButton
                      redirectTo="/onboarding"
                      label="Continue with Google"
                    />

                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400">or use email</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>

                    {/* Email magic link — secondary option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Work email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMagicLink()}
                        placeholder="you@happypaws.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleSendMagicLink}
                      disabled={submitting || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#0D7377' }}
                    >
                      {submitting ? 'Sending…' : 'Send Magic Link'}
                      {!submitting && <ArrowRight size={16} />}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                      Already have an account?{' '}
                      <a href="/login" className="font-medium underline" style={{ color: '#0D7377' }}>
                        Sign in
                      </a>
                    </p>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-center">
                      <div className="text-3xl mb-2">📬</div>
                      <p className="text-sm font-medium text-teal-900">Check your inbox!</p>
                      <p className="text-xs text-teal-700 mt-1">
                        We sent a magic link to <strong>{email}</strong>
                      </p>
                      <p className="text-xs text-teal-600 mt-2">
                        Click the link, then come back here to continue setup.
                      </p>
                    </div>

                    <button
                      onClick={() => setStep('practice')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ backgroundColor: '#0D7377' }}
                    >
                      I clicked the link — Continue
                      <ArrowRight size={16} />
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      Didn't get it?{' '}
                      {resendCooldown > 0 ? (
                        <span className="text-gray-400">
                          Resend in {resendCooldown}s
                        </span>
                      ) : (
                        <button
                          onClick={handleResendMagicLink}
                          className="underline text-gray-500 hover:text-teal-700"
                        >
                          Resend magic link
                        </button>
                      )}
                      {' · '}
                      <button
                        onClick={() => { setMagicLinkSent(false); setError(null); setResendCooldown(0); }}
                        className="underline text-gray-500 hover:text-teal-700"
                      >
                        Use a different email
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Practice Details ── */}
            {step === 'practice' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Your practice</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Tell us a bit about your clinic.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Practice name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={practiceName}
                      onChange={(e) => setPracticeName(e.target.value)}
                      placeholder="Happy Paws Veterinary"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                      autoFocus
                    />
                    {practiceName && (
                      <p className="text-xs text-gray-400 mt-1">
                        Booking URL: vetsteady.com/book/<strong>{slugify(practiceName)}</strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={practicePhone}
                      onChange={(e) => setPracticePhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Timezone <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
                      style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz.replace('America/', '').replace('Pacific/', 'Pacific/').replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('account')}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!practiceName.trim()) return;
                      setStep('staff');
                    }}
                    disabled={!practiceName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#0D7377' }}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Your Info ── */}
            {step === 'staff' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">About you</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    You'll be the admin for <strong>{practiceName}</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your full name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Dr. Sarah Chen"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'admin',        label: 'Admin',        desc: 'Full access' },
                        { value: 'vet',          label: 'Veterinarian', desc: 'Bookable vet' },
                        { value: 'receptionist', label: 'Receptionist', desc: 'Front desk' },
                      ] as const).map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setStaffRole(r.value)}
                          className={cn(
                            'flex flex-col items-center gap-0.5 p-3 rounded-xl border text-sm transition-colors',
                            staffRole === r.value
                              ? 'border-teal-500 bg-teal-50 text-teal-800'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300',
                          )}
                        >
                          <span className="font-medium text-xs">{r.label}</span>
                          <span className="text-[10px] opacity-60">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Summary</p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Practice</span>
                    <span className="text-gray-900 font-medium">{practiceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Timezone</span>
                    <span className="text-gray-900">{timezone.split('/').pop()?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your name</span>
                    <span className="text-gray-900">{staffName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your role</span>
                    <span className="text-gray-900 capitalize">{staffRole}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('practice')}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={submitting || !staffName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#0D7377' }}
                  >
                    {submitting ? 'Setting up…' : 'Launch Dashboard'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to VetSteady's{' '}
          <a href="#" className="underline">Terms of Service</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
