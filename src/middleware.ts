import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options as any));
        },
      },
    }
  );

  // ── Handle expired/invalid magic links ──────────────────────────────────────
  // Supabase redirects to Site URL with ?error=access_denied&error_code=otp_expired
  // when a magic link expires. Catch this and redirect to /login with a friendly message.
  const errorCode = request.nextUrl.searchParams.get('error_code');
  if (errorCode === 'otp_expired' || request.nextUrl.searchParams.get('error') === 'access_denied') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'link_expired');
    return NextResponse.redirect(loginUrl);
  }

  // Public routes — always accessible without auth
  const publicRoutes = [
    '/',
    '/login',
    '/onboarding',
    '/confirm',       // appointment confirm/cancel links (sent via SMS)
    '/auth',          // Supabase OAuth callback
    '/api/stripe/webhooks',
    '/invite',        // staff invite accept page
    '/book',          // public client-facing booking page
    '/legal',         // terms / privacy
    '/ref',           // referral landing pages
    '/compare',       // comparison pages (SEO)
  ];
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.some((r) => pathname === r || pathname.startsWith(r));

  // If on /login, check auth first — redirect authenticated users to /dashboard
  if (pathname === '/login') {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Supabase unreachable — let them stay on login
    }
    return supabaseResponse;
  }

  // For other public routes, skip auth check to avoid unnecessary DB calls
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // For protected routes, try auth — but don't crash the whole site if Supabase is unreachable
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — let them through to login, don't crash the site
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
