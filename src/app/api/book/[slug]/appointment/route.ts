// POST /api/book/[slug]/appointment
// Public endpoint — creates a client (or finds by phone), creates pet if new,
// then books an appointment. Triggers SMS confirmation via reminder engine.
// No auth required.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { scheduleRemindersForAppointment } from '@/lib/queue/reminder-jobs';
import crypto from 'crypto';

export interface PublicBookingInput {
  staff_id: string;
  appointment_type_id: string;
  starts_at: string;          // ISO string

  // Client info
  client_first_name: string;
  client_last_name: string;
  client_phone?: string;
  client_email?: string;
  preferred_contact: 'sms' | 'email' | 'both';

  // Pet info
  pet_name: string;
  pet_species: 'dog' | 'cat' | 'bird' | 'other';
  pet_breed?: string;

  notes?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = (await req.json()) as PublicBookingInput;
    const supabase = createServiceClient();

    // ── 1. Get practice ────────────────────────────────────────────────
    const { data: practice } = await supabase
      .from('practices')
      .select('id, name, timezone, subscription_status, settings')
      .eq('slug', params.slug)
      .single();

    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }
    if (!['trial', 'active'].includes(practice.subscription_status)) {
      return NextResponse.json({ error: 'Online booking not available' }, { status: 403 });
    }

    // ── 2. Get appointment type (to compute end time) ──────────────────
    const { data: apptType } = await supabase
      .from('appointment_types')
      .select('id, duration_minutes, allow_online_booking')
      .eq('id', body.appointment_type_id)
      .eq('practice_id', practice.id)
      .single();

    if (!apptType || !apptType.allow_online_booking) {
      return NextResponse.json({ error: 'Appointment type not available for online booking' }, { status: 400 });
    }

    // ── 3. Validate slot is still available ────────────────────────────
    const startsAt = new Date(body.starts_at);
    const endsAt   = new Date(startsAt.getTime() + apptType.duration_minutes * 60 * 1000);

    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('practice_id', practice.id)
      .eq('staff_id', body.staff_id)
      .lt('starts_at', endsAt.toISOString())
      .gt('ends_at', startsAt.toISOString())
      .neq('status', 'cancelled')
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another.' },
        { status: 409 }
      );
    }

    // ── 4. Find or create client (match by phone or email) ────────────
    let clientId: string;

    // Try to find by phone first, then email
    let existingClient = null;
    if (body.client_phone) {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('practice_id', practice.id)
        .eq('phone', body.client_phone)
        .single();
      existingClient = data;
    }
    if (!existingClient && body.client_email) {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('practice_id', practice.id)
        .eq('email', body.client_email)
        .single();
      existingClient = data;
    }

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create new client
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({
          practice_id: practice.id,
          first_name: body.client_first_name,
          last_name: body.client_last_name,
          phone: body.client_phone || null,
          email: body.client_email || null,
          preferred_contact: body.preferred_contact,
          no_show_count: 0,
          late_cancel_count: 0,
        })
        .select('id')
        .single();

      if (clientErr || !newClient) {
        throw new Error(`Failed to create client: ${clientErr?.message}`);
      }
      clientId = newClient.id;
    }

    // ── 5. Find or create pet ─────────────────────────────────────────
    let petId: string;

    const { data: existingPet } = await supabase
      .from('pets')
      .select('id')
      .eq('client_id', clientId)
      .ilike('name', body.pet_name.trim())
      .single();

    if (existingPet) {
      petId = existingPet.id;
    } else {
      const { data: newPet, error: petErr } = await supabase
        .from('pets')
        .insert({
          client_id: clientId,
          practice_id: practice.id,
          name: body.pet_name,
          species: body.pet_species,
          breed: body.pet_breed || null,
        })
        .select('id')
        .single();

      if (petErr || !newPet) {
        throw new Error(`Failed to create pet: ${petErr?.message}`);
      }
      petId = newPet.id;
    }

    // ── 6. Create appointment ─────────────────────────────────────────
    const confirmationToken = crypto.randomBytes(20).toString('hex');

    const { data: appointment, error: apptErr } = await supabase
      .from('appointments')
      .insert({
        practice_id: practice.id,
        staff_id: body.staff_id,
        client_id: clientId,
        pet_id: petId,
        appointment_type_id: body.appointment_type_id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'scheduled',
        confirmation_token: confirmationToken,
        notes: body.notes || null,
        deposit_paid: false,
      })
      .select('id, confirmation_token')
      .single();

    if (apptErr || !appointment) {
      throw new Error(`Failed to create appointment: ${apptErr?.message}`);
    }

    // ── 7. Queue booking confirmation + scheduled reminders via pg-boss ──
    // scheduleRemindersForAppointment enqueues booking_confirm (immediate)
    // plus 2-week / 4-day / 2-day reminders. The cron picks them up every 5 min.
    await scheduleRemindersForAppointment(
      appointment.id,
      practice.id,
      startsAt.toISOString(),
      practice.settings?.reminder_timing
    );

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      confirmationToken: appointment.confirmation_token,
      message: 'Appointment booked successfully. You will receive a confirmation shortly.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('[book/slug/appointment] POST error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
