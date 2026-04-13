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

  const body: Omit<CreateAppointmentInput, 'practice_id'> & { practice_id?: string } = await request.json();
  const admin = createServiceClient();

  // Resolve practice_id from the caller's staff record (modal doesn't send it)
  const { data: staffRecord, error: staffErr } = await admin
    .from('staff')
    .select('practice_id')
    .eq('auth_user_id', user.id)
    .single();

  if (staffErr || !staffRecord) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
  }
  const practiceId = staffRecord.practice_id;

  // Verify appointment type and get duration
  const { data: apptType } = await admin
    .from('appointment_types')
    .select('duration_minutes')
    .eq('id', body.appointment_type_id)
    .single();

  const endsAt = computeEndsAt(body.starts_at, apptType?.duration_minutes ?? 30);
  const confirmationToken = generateConfirmationToken();

  // Direct insert — service client bypasses RLS
  const { data, error } = await admin
    .from('appointments')
    .insert({
      practice_id: practiceId,
      staff_id: body.staff_id,
      client_id: body.client_id,
      pet_id: body.pet_id,
      appointment_type_id: body.appointment_type_id,
      starts_at: body.starts_at,
      ends_at: endsAt,
      status: 'scheduled',
      confirmation_token: confirmationToken,
      notes: body.notes ?? null,
      deposit_paid: false,
    })
    .select('*, staff(*), client:clients(*), pet:pets(*), appointment_type:appointment_types(*)')
    .single();

  if (error) {
    console.error('[appointments] Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Queue reminder jobs (non-blocking — don't fail the request if queue is unavailable)
  const { data: practice } = await admin
    .from('practices')
    .select('settings')
    .eq('id', practiceId)
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
