/**
 * PostHog analytics — thin wrapper around the JS SDK.
 *
 * All tracking calls go through this file so we can:
 *   - Gate on NEXT_PUBLIC_POSTHOG_KEY being set
 *   - Add consistent property defaults (practice_id, etc.)
 *   - Easily swap PostHog out later
 *
 * Usage (client components only):
 *   import { capture } from '@/lib/analytics/posthog';
 *   capture('first_appointment_created', { practice_id, appointment_type });
 */

import posthog from 'posthog-js';

/** Lazily initialise PostHog once on the client */
let initialised = false;

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (initialised) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

  if (!key) {
    // Analytics disabled — just log in dev so we don't silently swallow events
    if (process.env.NODE_ENV === 'development') {
      console.info('[analytics] PostHog key not set — analytics disabled.');
    }
    return;
  }

  posthog.init(key, {
    api_host: host,
    // Don't auto-capture every click — we fire explicit events only
    autocapture: false,
    // Capture page views on route change (Next.js router handles this)
    capture_pageview: false,
    // Respect Do Not Track
    respect_dnt: true,
    // Disable session recording — Shepherd integration imports PHI (client names,
    // phone numbers, pet names) into the dashboard UI. Session recordings would
    // capture this. Re-enable only if a non-PHI dashboard is shipped upstream.
    disable_session_recording: true,
  });

  initialised = true;
}

/** Fire a named event with optional properties */
export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialised) return;
  posthog.capture(event, properties);
}

/** Identify the current user (call after login / onboarding) */
export function identify(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialised) return;
  posthog.identify(userId, properties);
}

/** Reset identity on logout */
export function reset() {
  if (typeof window === 'undefined') return;
  if (!initialised) return;
  posthog.reset();
}

// ─── Typed event helpers ──────────────────────────────────────────────────────

/** Track completion of the 3-step onboarding wizard */
export function trackOnboardingComplete(props: {
  practice_id: string;
  practice_name: string;
  timezone: string;
  staff_role: string;
}) {
  capture('onboarding_complete', props);
}

/** Track when the very first appointment is created in a practice */
export function trackFirstAppointmentCreated(props: {
  practice_id: string;
  appointment_type: string;
  starts_at: string;
  staff_id?: string;
}) {
  capture('first_appointment_created', props);
}

/** Track when the very first reminder is sent from a practice */
export function trackFirstReminderSent(props: {
  practice_id: string;
  reminder_type: string;   // e.g. 'two_day', 'booking_confirm'
  channel: string;          // 'sms' | 'email'
}) {
  capture('first_reminder_sent', props);
}
