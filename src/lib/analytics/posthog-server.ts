/**
 * Server-side analytics helper (Node.js / Edge runtime compatible).
 *
 * Uses PostHog's HTTP capture API directly — no npm package required.
 * Only fires when NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Docs: https://posthog.com/docs/api/post-only-endpoints#capture
 */

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
const POSTHOG_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY;

interface ServerEventProperties {
  [key: string]: unknown;
}

/**
 * Fire a server-side PostHog event.
 * `distinctId` should be the practice_id or user email.
 * Non-blocking — errors are swallowed so they never break core flows.
 */
export async function serverCapture(
  distinctId: string,
  event: string,
  properties: ServerEventProperties = {},
): Promise<void> {
  if (!POSTHOG_KEY) return;

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: {
          $lib: 'vetsteady-server',
          ...properties,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Never throw — analytics must never break core flows
  }
}

// ─── Typed server event helpers ───────────────────────────────────────────────

/** Track when a reminder is sent (called from the queue processor) */
export async function serverTrackReminderSent(props: {
  practice_id: string;
  appointment_id: string;
  reminder_type: string;   // e.g. 'two_day', 'booking_confirm'
  channel: string;          // 'sms' | 'email'
  is_first?: boolean;       // optional — set by caller if it knows
}) {
  await serverCapture(props.practice_id, 'reminder_sent', props);

  if (props.is_first) {
    await serverCapture(props.practice_id, 'first_reminder_sent', props);
  }
}
