import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/onboarding/magic-link
 * Sends a Supabase magic-link email to the provided address.
 * The redirect URL takes users back to /onboarding after they click.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Determine the base URL for the redirect
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      request.headers.get('origin') ??
      'http://localhost:3000';

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('[onboarding/magic-link] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[onboarding/magic-link] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
