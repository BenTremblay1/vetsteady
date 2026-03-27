/**
 * /api/appointments/[id] — Single appointment operations
 * GET, PATCH, DELETE
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cancelRemindersForAppointment, scheduleRemindersForAppointment } from '@/lib/queue/reminder-jobs';

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      staff(*),
      client:clients(*),
      pet:pets(*),
      appointment_type:appointment_types(*),
      reminders(*)
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowedFields = ['status', 'notes', 'staff_id', 'starts_at', 'ends_at', 'deposit_paid'];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) patch[field] = body[field];
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', params.id)
    .select('*, client:clients(*), pet:pets(*), appointment_type:appointment_types(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If cancelled, kill queued reminders
  if (body.status === 'cancelled') {
    cancelRemindersForAppointment(params.id).catch(console.error);
  }

  // If rescheduled (starts_at changed), reschedule reminders
  if (body.starts_at && data) {
    const practice = await supabase
      .from('practices')
      .select('settings')
      .eq('id', data.practice_id)
      .single();

    await cancelRemindersForAppointment(params.id);
    scheduleRemindersForAppointment(
      params.id,
      data.practice_id,
      body.starts_at,
      practice.data?.settings?.reminder_timing
    ).catch(console.error);
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Soft delete: set status to cancelled
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  cancelRemindersForAppointment(params.id).catch(console.error);

  return NextResponse.json({ message: 'Appointment cancelled' });
}
