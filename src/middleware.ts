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

  // Public routes — always accessible without auth
  const publicRoutes = ['/', '/login', '/onboarding', '/confirm', '/auth', '/api/stripe/webhooks', '/invite'];
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
