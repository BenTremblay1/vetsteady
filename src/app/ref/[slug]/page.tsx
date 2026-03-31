'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (!slug) return;
    // Store referral slug so onboarding can pick it up
    try {
      sessionStorage.setItem('referral_slug', slug);
    } catch {
      // sessionStorage not available (SSR fallback)
    }
  }, [slug]);

  // Auto-redirect after a brief pause so user sees the personalised message
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/onboarding?ref=${slug}`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [router, slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-3xl font-bold" style={{ color: '#0D7377' }}>VetSteady</span>
        </div>

        {/* Referral badge */}
        <div className="inline-flex items-center gap-2 bg-teal-50 text-[#0D7377] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Referral invite
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
          You&apos;ve been invited to try VetSteady
        </h1>
        <p className="text-gray-500 mb-2 text-sm leading-relaxed">
          A vet practice owner you know is using VetSteady to cut their no-show rate.
        </p>
        <p className="text-gray-400 text-xs mb-10">
          Redirecting you to sign up — you&apos;ll get <strong>60 days free</strong> (vs the standard 14-day trial).
        </p>

        {/* Spinner */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full" />
            <div
              className="absolute inset-0 border-2 rounded-full"
              style={{
                borderColor: '#0D7377',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
          <p className="text-sm text-gray-400">Taking you to sign up…</p>
        </div>

        {/* Manual link */}
        <p className="text-xs text-gray-300 mt-6">
          Not redirected?{' '}
          <Link
            href={`/onboarding?ref=${slug}`}
            className="underline"
            style={{ color: '#0D7377' }}
          >
            Click here to continue
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
