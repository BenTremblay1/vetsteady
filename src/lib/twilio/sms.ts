import twilio from 'twilio';
import { Appointment } from '@/types';
import { format } from 'date-fns';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vetsteady.com';

/** Build SMS text. No PHI — name + time only. */
export function buildReminderMessage(appointment: Appointment & {
  client?: { first_name: string };
  pet?: { name: string };
  appointment_type?: { name: string };
  practice?: { name: string; timezone: string };
}, reminderType: string): string {
  const firstName = appointment.client?.first_name ?? 'there';
  const petName = appointment.pet?.name ?? 'your pet';
  const apptTypeName = appointment.appointment_type?.name ?? 'appointment';
  const practiceName = appointment.practice?.name ?? 'the clinic';
  const confirmUrl = `${APP_URL}/confirm/${appointment.confirmation_token}`;

  const date = new Date(appointment.starts_at);
  const dateStr = format(date, 'EEEE, MMMM d');
  const timeStr = format(date, 'h:mm a');

  if (reminderType === 'booking_confirm') {
    return `Hi ${firstName}! ${petName}'s ${apptTypeName} at ${practiceName} is booked for ${dateStr} at ${timeStr}.\n\nTap to confirm: ${confirmUrl}\n\nReply CANCEL to cancel.`;
  }

  return `Hi ${firstName}! Reminder: ${petName}'s ${apptTypeName} at ${practiceName} is ${dateStr} at ${timeStr}.\n\nReply CONFIRM to confirm or CANCEL to cancel.\nOr tap: ${confirmUrl}`;
}

/** Send SMS via Twilio. Returns Twilio SID on success. */
export async function sendSmsReminder(
  toPhone: string,
  messageBody: string
): Promise<{ sid: string; success: true } | { success: false; error: string }> {
  try {
    const message = await client.messages.create({
      body: messageBody,
      from: FROM_NUMBER,
      to: toPhone,
    });
    return { success: true, sid: message.sid };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown Twilio error' };
  }
}
