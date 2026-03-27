'use client';

/**
 * PostHogProvider — mounts once at the root layout (client-side only).
 *
 * Initialises PostHog after first render so it doesn't block SSR.
 * All child components can import `capture()` from `@/lib/analytics/posthog`
 * directly without needing React context.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, capture } from '@/lib/analytics/posthog';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialise once
  useEffect(() => {
    initPostHog();
  }, []);

  // Track page views on client-side navigation
  useEffect(() => {
    capture('$pageview', { $current_url: window.location.href });
  }, [pathname]);

  return <>{children}</>;
}
