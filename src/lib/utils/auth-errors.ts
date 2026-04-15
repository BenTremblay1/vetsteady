/**
 * Maps raw Supabase auth error messages to user-friendly messages.
 */
const ERROR_MAP: Record<string, string> = {
  'email rate limit exceeded':
    'Too many sign-in attempts. Please wait a few minutes and try again.',
  'rate limit exceeded':
    'Too many requests. Please wait a moment and try again.',
  'otp_expired':
    'Your sign-in link has expired. Please request a new one.',
  'user not found':
    'No account found with that email. Check the address or create a new account.',
  'invalid login credentials':
    'Incorrect email or password. Please try again.',
};

export function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return friendly;
  }
  return raw;
}
