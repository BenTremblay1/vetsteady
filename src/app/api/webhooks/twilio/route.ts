/**
 * Twilio Inbound SMS Webhook
 *
 * Handles SMS replies from clients: CONFIRM and CANCEL.
 * Twilio sends a POST to this URL when a client replies to a reminder.
 *
 * Validation: Twilio signs each request with HMAC-SHA1 using TWILIO_AUTH_TOKEN.
 * We validate the signature to reject forged requests.
 *
 * Flow:
 *   Client replies "CONFIRM" → appointment.status = 'confirmed', reply "Confirmed! ✅"
 *   Client replies "CANCEL"  → appointment.status = 'cancelled', reply "Cancelled. 👋"
 *   Anything else           → reply with help text
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cancelRemindersForAppointment } from '@/lib/queue/reminder-jobs';
import twilio from 'twilio';

export const runtime = 'nodejs';

// Respond with TwiML (Twilio Markup Language)
function twimlResponse(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Validate Twilio signature
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

  // Parse form body
  const params = new URLSearchParams(rawBody);
  const fromNumber = params.get('From') ?? '';
  const bodyRaw = params.get('Body') ?? '';
  const keyword = bodyRaw.trim().toUpperCase();

  const supabase = createServiceClient();

  // Find the most recent non-terminal appointment for this phone number
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, practice_id')
    .eq('phone', fromNumber)
    .limit(5);

  if (!clients || clients.length === 0) {
    return twimlResponse("We couldn't find your record. Please call the clinic directly.");
  }

  // For multi-practice clients, find the most recent upcoming appointment
  const clientIds = clients.map((c) => c.id);
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, status, practice_id, client_id, pet:pets(name)')
    .in('client_id', clientIds)
    .in('status', ['scheduled', 'confirmed'])
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .single();

  if (!appointment) {
    return twimlResponse(
      "We couldn't find an upcoming appointment for your number. Please call the clinic."
    );
  }

  const petName = (appointment.pet as any)?.name ?? 'your pet';

  if (keyword === 'CONFIRM') {
    await supabase
      .from('appointments')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', appointment.id);

    return twimlResponse(
      `✅ Confirmed! We'll see ${petName} at the scheduled time. Reply CANCEL if plans change.`
    );
  }

  if (keyword === 'CANCEL') {
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', appointment.id);

    // Cancel queued reminder jobs
    await cancelRemindersForAppointment(appointment.id);

    return twimlResponse(
      `Appointment cancelled for ${petName}. To rebook, please call the clinic or visit our website.`
    );
  }

  // Unknown keyword
  return twimlResponse(
    'Reply CONFIRM to confirm your appointment, or CANCEL to cancel it. Questions? Call the clinic directly.'
  );
}
