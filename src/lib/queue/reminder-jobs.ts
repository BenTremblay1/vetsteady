/**
 * Reminder Job Types & Scheduling
 *
 * Called immediately after an appointment is created (or updated).
 * Schedules up to 4 reminder jobs:
 *   - booking_confirm  → send now
 *   - 2_week           → 14 days before
 *   - 4_day            → 4 days before
 *   - 2_day            → 2 days before
 *
 * Each job carries the minimum data needed — we re-fetch the full appointment
 * at execution time to ensure we have fresh status (avoids sending reminders
 * for cancelled appointments).
 */

import { getBoss } from './boss';
import { subDays } from 'date-fns';
import { ReminderType } from '@/types';

export const REMINDER_QUEUE = 'vetsteady.reminders';

export interface ReminderJobData {
  appointmentId: string;
  practiceId: string;
  reminderType: ReminderType;
}

/**
 * Cancel any existing reminder jobs for this appointment, then schedule fresh ones.
 * Pass `reminderConfig` from practice.settings.reminder_timing (optional — defaults all on).
 */
export async function scheduleRemindersForAppointment(
  appointmentId: string,
  practiceId: string,
  startsAt: string, // ISO string (UTC)
  reminderConfig?: {
    two_week?: boolean;
    four_day?: boolean;
    two_day?: boolean;
    same_day?: boolean;
  }
): Promise<void> {
  const boss = await getBoss();
  const apptDate = new Date(startsAt);
  const now = new Date();

  const config = {
    two_week: true,
    four_day: true,
    two_day: true,
    same_day: false, // same-day off by default (can be noisy)
    ...reminderConfig,
  };

  const jobsToSchedule: Array<{ type: ReminderType; sendAt: Date }> = [
    // Booking confirmation: always send immediately
    { type: 'booking_confirm', sendAt: now },
  ];

  const twoWeekBefore = subDays(apptDate, 14);
  const fourDayBefore = subDays(apptDate, 4);
  const twoDayBefore = subDays(apptDate, 2);

  if (config.two_week && twoWeekBefore > now) {
    jobsToSchedule.push({ type: '2_week', sendAt: twoWeekBefore });
  }
  if (config.four_day && fourDayBefore > now) {
    jobsToSchedule.push({ type: '4_day', sendAt: fourDayBefore });
  }
  if (config.two_day && twoDayBefore > now) {
    jobsToSchedule.push({ type: '2_day', sendAt: twoDayBefore });
  }

  await Promise.all(
    jobsToSchedule.map(({ type, sendAt }) => {
      const data: ReminderJobData = {
        appointmentId,
        practiceId,
        reminderType: type,
      };

      // Use a stable job key so duplicates are skipped (idempotent)
      const jobKey = `reminder-${appointmentId}-${type}`;

      if (type === 'booking_confirm') {
        // Send immediately (no startAfter)
        return boss.send(REMINDER_QUEUE, data, {
          singletonKey: jobKey,
        });
      }

      return boss.send(REMINDER_QUEUE, data, {
        startAfter: sendAt.toISOString(),
        singletonKey: jobKey,
      });
    })
  );

  console.log(
    `[reminders] Scheduled ${jobsToSchedule.length} jobs for appointment ${appointmentId}`
  );
}

/**
 * Cancel all pending reminder jobs for a cancelled appointment.
 */
export async function cancelRemindersForAppointment(
  appointmentId: string
): Promise<void> {
  const boss = await getBoss();

  const types: ReminderType[] = ['booking_confirm', '2_week', '4_day', '2_day', 'same_day'];
  await Promise.all(
    types.map((type) =>
      boss.cancel(`reminder-${appointmentId}-${type}`)
        .catch(() => {
          // Ignore errors — job may already be completed or not exist
        })
    )
  );

  console.log(`[reminders] Cancelled pending jobs for appointment ${appointmentId}`);
}
