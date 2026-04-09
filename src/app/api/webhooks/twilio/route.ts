/**
 * Twilio Inbound SMS Webhook — AI Front Desk
 *
 * Handles ALL SMS replies from clients using Claude as the AI dispatcher.
 *
 * Supported flows:
 *   CONFIRM     → confirm appointment
 *   CANCEL      → cancel + trigger waitlist notification
 *   RESCHEDULE  → show 3 available slots, client picks 1/2/3
 *   LATE        → flag appointment, SMS the practice phone
 *   QUESTION    → AI answers contextually
 *   ESCALATE    → forward message to practice phone + reply gracefully
 *
 *   "1" / "2" / "3" → slot selection (multi-turn reschedule flow)
 *
 * Security: Twilio HMAC-SHA1 signature validation on every request.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { cancelRemindersForAppointment, scheduleRemindersForAppointment } from '@/lib/queue/reminder-jobs';
import { classifyInboundSms } from '@/lib/ai/front-desk';
import { notifyWaitlistOnCancellation } from '@/lib/ai/waitlist-notifier';
import { getNextAvailableSlots } from '@/lib/utils/slots';
import { sendSmsReminder } from '@/lib/twilio/sms';
import { computeEndsAt } from '@/lib/utils/dates';
import { generateConfirmationToken } from '@/lib/utils/tokens';
import twilio from 'twilio';
import { format } from 'date-fns';

export const runtime = 'nodejs';

// Session TTL: 30 minutes
const SESSION_TTL_MS = 30 * 60 * 1000;

interface RescheduleSession {
  action: 'reschedule_pending';
  appointmentId: string;
  practiceId: string;
  staffId: string;
  appointmentTypeId: string;
  durationMin: number;
  slots: string[]; // up to 3 ISO UTC strings
}

function twiml(message: string): Response {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message>${safe}</Message>\n</Response>`;
  return new Response(xml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

function formatSlotLocal(isoUtc: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(isoUtc));
  } catch {
    return format(new Date(isoUtc), 'EEE MMM d, h:mm a');
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // ── Validate Twilio signature ──────────────────────────────────────────────
  const twilioSignature = request.headers.get('x-twilio-signature') ?? '';
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    twilioSignature,
    webhookUrl,
    Object.fromEntries(new URLSearchParams(rawBody))
  );
  if (!isValid) {
    console.warn('[webhook/twilio] Invalid signature');
    return new Response('Forbidden', { status: 403 });
  }

  const params      = new URLSearchParams(rawBody);
  const fromNumber  = params.get('From') ?? '';
  const messageText = (params.get('Body') ?? '').trim();
  const keyword     = messageText.toUpperCase();

  const supabase = createServiceClient();

  // ── Look up client + upcoming appointment ─────────────────────────────────
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, practice_id')
    .eq('phone', fromNumber)
    .limit(5);

  if (!clients || clients.length === 0) {
    return twiml("We couldn't find your record. Please call the clinic directly.");
  }

  const clientIds = clients.map(c => c.id);

  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      id, status, practice_id, client_id, staff_id, appointment_type_id,
      starts_at, ends_at, confirmation_token,
      pet:pets(name),
      client:clients(first_name),
      appointment_type:appointment_types(name, duration_minutes),
      practice:practices(name, slug, phone, timezone)
    `)
    .in('client_id', clientIds)
    .in('status', ['scheduled', 'confirmed'])
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .single();

  if (!appointment) {
    return twiml("We couldn't find an upcoming appointment for your number. Please call the clinic.");
  }

  const petName       = (appointment.pet              as any)?.name             ?? 'your pet';
  const firstName     = (appointment.client            as any)?.first_name       ?? 'there';
  const apptType      = (appointment.appointment_type  as any)?.name             ?? 'appointment';
  const durationMin   = (appointment.appointment_type  as any)?.duration_minutes ?? 30;
  const practiceName  = (appointment.practice          as any)?.name             ?? 'the clinic';
  const practiceSlug  = (appointment.practice          as any)?.slug             ?? '';
  const practicePhone = (appointment.practice          as any)?.phone            ?? null;
  const timezone      = (appointment.practice          as any)?.timezone         ?? 'UTC';

  const apptDate = formatSlotLocal(appointment.starts_at, timezone).split(' at ')[0];
  const apptTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(appointment.starts_at));

  // ── Check for active reschedule session (slot selection: 1 / 2 / 3) ───────
  const slotChoice = ['1', '2', '3'].indexOf(keyword.trim());
  if (slotChoice !== -1) {
    try {
      const { data: session } = await supabase
        .from('sms_sessions')
        .select('state, expires_at')
        .eq('phone', fromNumber)
        .single();

      if (session && new Date(session.expires_at) > new Date()) {
        const state = session.state as RescheduleSession;
        if (state.action === 'reschedule_pending' && state.slots[slotChoice]) {
          return handleSlotConfirmation({
            supabase, fromNumber, state, slotChoice,
            firstName, petName, apptType, practiceName, timezone,
          });
        }
      }
    } catch {
      // sms_sessions table may not exist yet — fall through to AI
    }
  }

  // ── Fast-path exact keywords (skip AI call, reduce latency + cost) ─────────
  if (keyword === 'CONFIRM') {
    return handleConfirm({ supabase, appointment, petName });
  }
  if (keyword === 'CANCEL') {
    return handleCancel({
      supabase, appointment, petName,
      practiceId: appointment.practice_id,
      appointmentTypeId: appointment.appointment_type_id,
      practiceName, practiceSlug,
    });
  }

  // ── AI classification for all natural-language replies ────────────────────
  let classified;
  try {
    classified = await classifyInboundSms({
      messageText,
      clientFirstName: firstName,
      petName,
      appointmentType: apptType,
      appointmentDate: apptDate,
      appointmentTime: apptTime,
      practiceName,
    });
  } catch (err) {
    console.error('[webhook/twilio] AI classification failed:', err);
    classified = { intent: 'escalate' as const, reply: "We'll have our team follow up shortly." };
  }

  console.log(`[webhook/twilio] ${firstName} (${fromNumber}) → intent: ${classified.intent} | msg: "${messageText}"`);

  switch (classified.intent) {
    case 'confirm':
      return handleConfirm({ supabase, appointment, petName });

    case 'cancel':
      return handleCancel({
        supabase, appointment, petName,
        practiceId: appointment.practice_id,
        appointmentTypeId: appointment.appointment_type_id,
        practiceName, practiceSlug,
      });

    case 'reschedule':
      return handleReschedule({
        supabase, fromNumber, appointment,
        firstName, petName, apptType, timezone,
        practiceId: appointment.practice_id,
        staffId: appointment.staff_id,
        durationMin,
      });

    case 'late':
      return handleLate({
        firstName, petName, apptType, apptTime,
        practicePhone, practiceName, messageText,
      });

    case 'question':
      return twiml(classified.reply);

    case 'escalate':
    default:
      return handleEscalate({
        fromNumber, firstName, petName, apptType, apptDate, apptTime,
        messageText, practicePhone, practiceName,
      });
  }
}

// ── Action Handlers ───────────────────────────────────────────────────────────

async function handleConfirm({ supabase, appointment, petName }: {
  supabase: ReturnType<typeof createServiceClient>;
  appointment: any;
  petName: string;
}) {
  await supabase
    .from('appointments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', appointment.id);

  return twiml(`✅ Confirmed! We'll see ${petName} at the scheduled time. Reply CANCEL if plans change.`);
}

async function handleCancel({ supabase, appointment, petName, practiceId, appointmentTypeId, practiceName, practiceSlug }: {
  supabase: ReturnType<typeof createServiceClient>;
  appointment: any;
  petName: string;
  practiceId: string;
  appointmentTypeId: string;
  practiceName: string;
  practiceSlug: string;
}) {
  await supabase
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', appointment.id);

  await cancelRemindersForAppointment(appointment.id);

  // Notify waitlist (non-blocking)
  notifyWaitlistOnCancellation({
    practiceId,
    appointmentTypeId,
    cancelledSlot: appointment.starts_at,
    practiceName,
    practiceSlug,
  }).catch(err => console.error('[waitlist] Notification failed:', err));

  return twiml(
    `Appointment cancelled for ${petName}. We've opened that slot to our waitlist. ` +
    `To rebook, visit our booking page or call the clinic.`
  );
}

async function handleReschedule({ supabase, fromNumber, appointment, firstName, petName, apptType, timezone, practiceId, staffId, durationMin }: {
  supabase: ReturnType<typeof createServiceClient>;
  fromNumber: string;
  appointment: any;
  firstName: string;
  petName: string;
  apptType: string;
  timezone: string;
  practiceId: string;
  staffId: string;
  durationMin: number;
}) {
  let slots: string[] = [];
  try {
    slots = await getNextAvailableSlots({ practiceId, staffId, durationMin, timezone, count: 3, searchDays: 14 });
  } catch (err) {
    console.error('[reschedule] Slot fetch failed:', err);
  }

  if (slots.length === 0) {
    return twiml(
      `Hi ${firstName}! We couldn't find open slots automatically. ` +
      `Please call the clinic to reschedule — we'll find something that works. 🐾`
    );
  }

  const labels = slots.map((s, i) => `${i + 1}. ${formatSlotLocal(s, timezone)}`).join('\n');

  const state: RescheduleSession = {
    action: 'reschedule_pending',
    appointmentId: appointment.id,
    practiceId,
    staffId,
    appointmentTypeId: appointment.appointment_type_id,
    durationMin,
    slots,
  };
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  try {
    await supabase
      .from('sms_sessions')
      .upsert({ phone: fromNumber, state, expires_at: expiresAt, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('[reschedule] Could not save session (table may not exist yet):', err);
    // Still show slots even if we can't save state — client can call to confirm
  }

  return twiml(
    `Hi ${firstName}! Here are 3 open slots for ${petName}'s ${apptType}:\n\n` +
    `${labels}\n\nReply 1, 2, or 3 to book. (Expires in 30 min.)`
  );
}

async function handleSlotConfirmation({ supabase, fromNumber, state, slotChoice, firstName, petName, apptType, practiceName, timezone }: {
  supabase: ReturnType<typeof createServiceClient>;
  fromNumber: string;
  state: RescheduleSession;
  slotChoice: number;
  firstName: string;
  petName: string;
  apptType: string;
  practiceName: string;
  timezone: string;
}): Promise<Response> {
  const newSlot  = state.slots[slotChoice];
  const endsAt   = computeEndsAt(newSlot, state.durationMin);
  const newToken = generateConfirmationToken();

  // Cancel old appointment + reminders
  await supabase
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', state.appointmentId);
  await cancelRemindersForAppointment(state.appointmentId);

  // Get client + pet from old appointment
  const { data: oldAppt } = await supabase
    .from('appointments')
    .select('client_id, pet_id')
    .eq('id', state.appointmentId)
    .single();

  if (!oldAppt) {
    return twiml("Something went wrong. Please call the clinic to complete your reschedule.");
  }

  // Create new appointment
  const { data: newAppt, error } = await supabase
    .from('appointments')
    .insert({
      practice_id:          state.practiceId,
      staff_id:             state.staffId,
      client_id:            oldAppt.client_id,
      pet_id:               oldAppt.pet_id,
      appointment_type_id:  state.appointmentTypeId,
      starts_at:            newSlot,
      ends_at:              endsAt,
      status:               'scheduled',
      confirmation_token:   newToken,
      deposit_paid:         false,
    })
    .select()
    .single();

  if (error || !newAppt) {
    console.error('[reschedule] Insert failed:', error);
    return twiml("Couldn't complete the reschedule. Please call the clinic.");
  }

  // Schedule fresh reminders
  scheduleRemindersForAppointment(newAppt.id, state.practiceId, newSlot)
    .catch(err => console.error('[reschedule] Reminder scheduling failed:', err));

  // Clear session
  try { await supabase.from('sms_sessions').delete().eq('phone', fromNumber); } catch { /* ignore */ }

  const label = formatSlotLocal(newSlot, timezone);
  return twiml(
    `✅ Rescheduled! ${petName}'s ${apptType} is now set for ${label} at ${practiceName}. ` +
    `Reply CANCEL if plans change.`
  );
}

async function handleLate({ firstName, petName, apptType, apptTime, practicePhone, practiceName, messageText }: {
  firstName: string;
  petName: string;
  apptType: string;
  apptTime: string;
  practicePhone: string | null;
  practiceName: string;
  messageText: string;
}) {
  if (practicePhone) {
    const alert = `⚠️ Running late: ${firstName} (${petName}'s ${apptType} at ${apptTime}). They said: "${messageText}"`;
    sendSmsReminder(practicePhone, alert)
      .catch(err => console.error('[late] Staff SMS failed:', err));
  }

  return twiml(
    `Got it, ${firstName}! We've let the team know you're on your way. See you soon 🐾`
  );
}

async function handleEscalate({ fromNumber, firstName, petName, apptType, apptDate, apptTime, messageText, practicePhone, practiceName }: {
  fromNumber: string;
  firstName: string;
  petName: string;
  apptType: string;
  apptDate: string;
  apptTime: string;
  messageText: string;
  practicePhone: string | null;
  practiceName: string;
}) {
  if (practicePhone) {
    const alert =
      `📨 SMS from ${firstName} (${fromNumber}) re: ${petName}'s ${apptType} on ${apptDate} at ${apptTime}:\n"${messageText}"`;
    sendSmsReminder(practicePhone, alert)
      .catch(err => console.error('[escalate] Forward SMS failed:', err));
  }

  return twiml(
    `Thanks ${firstName}! A team member at ${practiceName} will follow up with you shortly. 🐾`
  );
}
