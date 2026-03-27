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

  // Get appointment type to compute end time
  const { data: apptType } = await supabase
    .from('appointment_types')
    .select('duration_minutes')
    .eq('id', body.appointment_type_id)
    .single();

  const endsAt = computeEndsAt(body.starts_at, apptType?.duration_minutes ?? 30);
  const confirmationToken = generateConfirmationToken();

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...body,
      ends_at: endsAt,
      confirmation_token: confirmationToken,
      status: 'scheduled',
    })
    .select('*, staff(*), client:clients(*), pet:pets(*), appointment_type:appointment_types(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Queue reminder jobs (non-blocking — don't fail the request if queue is unavailable)
  const practice = await supabase
    .from('practices')
    .select('settings')
    .eq('id', data.practice_id)
    .single();

  scheduleRemindersForAppointment(
    data.id,
    data.practice_id,
    data.starts_at,
    practice.data?.settings?.reminder_timing
  ).catch((err) => {
    console.error('[appointments] Failed to schedule reminders:', err?.message);
  });

  return NextResponse.json({ data }, { status: 201 });
}
