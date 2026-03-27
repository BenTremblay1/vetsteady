import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
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
