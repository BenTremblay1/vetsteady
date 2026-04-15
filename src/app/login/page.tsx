import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign In' };

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'Your sign-in link has expired. Please request a new one below.',
  auth_failed: 'Authentication failed. Please try again.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#0D7377' }}>
            VetSteady
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Keep your practice running. Every appointment counts.
          </p>
        </div>

        <div className="card">
          {errorMessage && (
            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your practice</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          New practice?{' '}
          <a href="/onboarding" className="underline" style={{ color: '#0D7377' }}>
            Set up your account
          </a>
        </p>
      </div>
    </div>
  );
}
