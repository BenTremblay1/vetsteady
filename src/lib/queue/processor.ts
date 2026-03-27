/**
 * Reminder Job Processor
 *
 * Processes a single reminder job:
 *   1. Re-fetch appointment (bail if cancelled/completed)
 *   2. Determine channel (SMS preferred → email fallback)
 *   3. Render message
 *   4. Send via Twilio or Resend
 *   5. Log result to `reminders` table
 *
 * Called from /api/cron/process-reminders (Vercel Cron, every 5 min).
 */

import { createServiceClient } from '@/lib/supabase/service';
import { buildReminderMessage, sendSmsReminder } from '@/lib/twilio/sms';
import { sendEmailReminder } from '@/lib/resend/email';
import { ReminderJobData } from './reminder-jobs';
import { getBoss, } from './boss';
import { REMINDER_QUEUE } from './reminder-jobs';
import { serverTrackReminderSent } from '@/lib/analytics/posthog-server';

const PROCESS_BATCH_SIZE = 10; // jobs per cron tick

export async function processReminderBatch(): Promise<{
  processed: number;
  failed: number;
}> {
  const boss = await getBoss();
  const supabase = createServiceClient();

  const jobs = await boss.fetch<ReminderJobData>(REMINDER_QUEUE, PROCESS_BATCH_SIZE);
  if (!jobs || jobs.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    const { appointmentId, practiceId, reminderType } = job.data;

    try {
      // 1. Fetch appointment with all related data
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(first_name, last_name, email, phone, preferred_contact),
          pet:pets(name, species),
          appointment_type:appointment_types(name),
          practice:practices(name, timezone, settings)
        `)
        .eq('id', appointmentId)
        .single();

      if (apptError || !appointment) {
        console.error(`[processor] Appointment ${appointmentId} not found, skipping.`);
        await boss.complete(job.id);
        continue;
      }

      // 2. Skip if appointment is no longer active
      if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
        console.log(`[processor] Appointment ${appointmentId} is ${appointment.status}, skipping reminder.`);
        await boss.complete(job.id);
        continue;
      }

      // 3. Determine channel
      const client = appointment.client;
      const preferredContact = client?.preferred_contact ?? 'sms';
      const hasPhone = Boolean(client?.phone);
      const hasEmail = Boolean(client?.email);

      let channel: 'sms' | 'email' | null = null;
      if ((preferredContact === 'sms' || preferredContact === 'both') && hasPhone) {
        channel = 'sms';
      } else if (hasEmail) {
        channel = 'email';
      } else {
        console.warn(`[processor] Client ${client} has no contact info, skipping.`);
        await boss.complete(job.id);
        continue;
      }

      // 4. Build message
      const messageBody = buildReminderMessage(appointment as any, reminderType);

      // 5. Send
      let sendResult: { success: boolean; sid?: string; messageId?: string; error?: string };

      if (channel === 'sms') {
        const result = await sendSmsReminder(client.phone!, messageBody);
        sendResult = result.success
          ? { success: true, sid: result.sid }
          : { success: false, error: result.error };
      } else {
        const result = await sendEmailReminder({
          to: client.email!,
          subject: `Reminder: ${appointment.pet?.name}'s appointment`,
          body: messageBody,
        });
        sendResult = result.success
          ? { success: true, messageId: result.messageId }
          : { success: false, error: result.error };
      }

      // 6. Log to reminders table
      const { error: logError } = await supabase.from('reminders').insert({
        appointment_id: appointmentId,
        practice_id: practiceId,
        channel,
        reminder_type: reminderType,
        status: sendResult.success ? 'sent' : 'failed',
        provider_message_id: sendResult.sid ?? sendResult.messageId ?? null,
        sent_at: sendResult.success ? new Date().toISOString() : null,
        error_message: sendResult.error ?? null,
      });

      if (logError) {
        console.error(`[processor] Failed to log reminder:`, logError.message);
      }

      if (sendResult.success) {
        processed++;
        await boss.complete(job.id);
        console.log(`[processor] Sent ${reminderType} ${channel} for appt ${appointmentId}`);

        // 📊 Analytics: track reminder sent (non-blocking, fire-and-forget)
        const practiceId = appointment?.practice_id;
        if (practiceId) {
          // Check if this is the first ever reminder for this practice
          const { count } = await supabase
            .from('reminders')
            .select('id', { count: 'exact', head: true })
            .eq('practice_id', practiceId)
            .eq('status', 'sent');

          serverTrackReminderSent({
            practice_id: practiceId,
            appointment_id: appointmentId,
            reminder_type: reminderType,
            channel,
            is_first: (count ?? 0) <= 1, // <=1 because we just inserted this one
          }).catch(() => {}); // fire-and-forget, never block
        }
      } else {
        failed++;
        await boss.fail(job.id, new Error(sendResult.error ?? 'Send failed'));
        console.error(`[processor] Failed ${reminderType} for appt ${appointmentId}:`, sendResult.error);
      }
    } catch (err: any) {
      failed++;
      console.error(`[processor] Unexpected error for job ${job.id}:`, err?.message);
      await boss.fail(job.id, err);
    }
  }

  return { processed, failed };
}
