/**
 * Waitlist Notifier
 *
 * When an appointment is cancelled, check the waitlist for matching entries
 * and SMS the first eligible client with a booking link.
 *
 * Uses the existing `waitlist` table (status: waiting → offered).
 */

import { createServiceClient } from '@/lib/supabase/service';
import { sendSmsReminder } from '@/lib/twilio/sms';
import { format } from 'date-fns';

export async function notifyWaitlistOnCancellation(params: {
  practiceId: string;
  appointmentTypeId: string;
  cancelledSlot: string;  // ISO UTC string
  practiceName: string;
  practiceSlug: string;
}): Promise<{ notified: boolean; clientName?: string }> {
  const { practiceId, appointmentTypeId, cancelledSlot, practiceName, practiceSlug } = params;
  const supabase = createServiceClient();

  const slotDate = new Date(cancelledSlot);
  const dateStr  = format(slotDate, 'EEEE, MMMM d');
  const timeStr  = format(slotDate, 'h:mm a');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vetsteady.com';
  const bookingUrl = `${appUrl}/book/${practiceSlug}`;

  // Find up to 5 waiting clients for this appointment type, oldest first
  const { data: entries } = await supabase
    .from('waitlist')
    .select(`
      id,
      client:clients(id, first_name, phone),
      pet:pets(name)
    `)
    .eq('practice_id', practiceId)
    .eq('appointment_type_id', appointmentTypeId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(5);

  if (!entries || entries.length === 0) {
    return { notified: false };
  }

  for (const entry of entries) {
    const client = entry.client as { id: string; first_name: string; phone: string | null } | null;
    const pet    = entry.pet    as { name: string } | null;

    if (!client?.phone) continue;

    const message =
      `Hi ${client.first_name}! A slot just opened at ${practiceName}: ` +
      `${dateStr} at ${timeStr} for ${pet?.name ?? 'your pet'}. ` +
      `Book it: ${bookingUrl}`;

    const result = await sendSmsReminder(client.phone, message);

    if (result.success) {
      await supabase
        .from('waitlist')
        .update({ status: 'offered', notified_at: new Date().toISOString() })
        .eq('id', entry.id);

      console.log(`[waitlist] Notified ${client.first_name} (${client.phone}) of opening`);
      return { notified: true, clientName: client.first_name };
    }
  }

  return { notified: false };
}
