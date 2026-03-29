import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { computeEndsAt } from '@/lib/utils/dates';
import { generateConfirmationToken } from '@/lib/utils/tokens';
import { CreateAppointmentInput } from '@/types';
import { scheduleRemindersForAppointment } from '@/lib/queue/reminder-jobs';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  let query = supabase
    .from('appointments')
    .select('*, staff(*), client:clients(*), pet:pets(*), appointment_type:appointment_types(*)')
    .order('starts_at', { ascending: true });

  if (startDate) query = query.gte('starts_at', startDate);
  if (endDate) query = query.lte('starts_at', endDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: CreateAppointmentInput = await request.json();

  // Verify appointment type exists and get duration
  const { data: apptType } = await supabase
    .from('appointment_types')
    .select('duration_minutes')
    .eq('id', body.appointment_type_id)
    .single();

  const endsAt = computeEndsAt(body.starts_at, apptType?.duration_minutes ?? 30);
  const confirmationToken = generateConfirmationToken();

  // Use service role client to bypass RLS circular dependency during insert
  const admin = createServiceClient();
  const { data, error } = await admin.rpc('insert_appointment', {
    p_practice_id: body.practice_id,
    p_staff_id: body.staff_id,
    p_client_id: body.client_id,
    p_pet_id: body.pet_id,
    p_appointment_type_id: body.appointment_type_id,
    p_starts_at: body.starts_at,
    p_ends_at: endsAt,
    p_status: 'scheduled',
    p_confirmation_token: confirmationToken,
    p_notes: body.notes ?? null,
    p_deposit_paid: false,
  });

  if (error) {
    console.error('[appointments] Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Queue reminder jobs (non-blocking — don't fail the request if queue is unavailable)
  const { data: practice } = await supabase
    .from('practices')
    .select('settings')
    .eq('id', data.practice_id)
    .single();

  scheduleRemindersForAppointment(
    data.id,
    data.practice_id,
    data.starts_at,
    practice?.settings?.reminder_timing
  ).catch((err) => {
    console.error('[appointments] Failed to schedule reminders:', err?.message);
  });

  return NextResponse.json({ data }, { status: 201 });
}
