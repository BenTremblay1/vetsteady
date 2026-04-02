// GET  /api/v1/reminders        — list reminders (practice-scoped)
// POST /api/v1/reminders/send   — manually trigger a reminder for an appointment

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendSmsReminder, buildReminderMessage } from '@/lib/twilio/sms';
import { sendEmailReminder } from '@/lib/resend/email';
import { Appointment } from '@/types';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: staff } = await serviceClient
      .from('staff')
      .select('practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!staff?.practice_id) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const status = searchParams.get('status');

    let query = serviceClient
      .from('reminders')
      .select(`
        id, appointment_id, channel, reminder_type, status,
        sent_at, error_message, created_at,
        appointment:appointments (
          id, starts_at, status, confirmation_token,
          client:clients ( first_name, last_name, phone, email ),
          pet:pets ( name, species ),
          appointment_type:appointment_types ( name )
        )
      `)
      .eq('practice_id', staff.practice_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: reminders, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ reminders: reminders ?? [], total: count ?? 0 });
  } catch (err: any) {
    console.error('[api/v1/reminders] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — manually send a reminder for an appointment
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: staff } = await serviceClient
      .from('staff')
      .select('practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!staff?.practice_id) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    const body = await req.json();
    const { appointmentId, channel = 'sms' } = body as {
      appointmentId: string;
      channel?: 'sms' | 'email';
    };

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 });
    }

    // Fetch appointment with all related data
    const { data: appt, error: apptError } = await serviceClient
      .from('appointments')
      .select(`
        id, starts_at, status, confirmation_token,
        client:clients ( first_name, last_name, phone, email ),
        pet:pets ( name, species ),
        appointment_type:appointment_types ( name ),
        practice:practices ( name, timezone )
      `)
      .eq('id', appointmentId)
      .eq('practice_id', staff.practice_id)
      .single();

    if (apptError || !appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const client = appt.client as any;
    const phone = client?.phone;
    const email = client?.email;

    if (channel === 'sms' && !phone) {
      return NextResponse.json({ error: 'No phone number on file for this client' }, { status: 422 });
    }
    if (channel === 'email' && !email) {
      return NextResponse.json({ error: 'No email on file for this client' }, { status: 422 });
    }

    // Build reminder_type label
    const reminderType = 'manual';
    let sid: string | undefined;
    let emailId: string | undefined;
    let errorMsg: string | undefined;

    if (channel === 'sms') {
      const apptForMsg = appt as unknown as Appointment & {
        client?: { first_name: string };
        pet?: { name: string };
        appointment_type?: { name: string };
        practice?: { name: string; timezone: string };
      };
      const message = buildReminderMessage(apptForMsg, reminderType);
      const result = await sendSmsReminder(phone!, message);
      if (!result.success) {
        errorMsg = result.error;
      } else {
        sid = result.sid;
      }
    } else {
      const firstName = client?.first_name ?? 'there';
      const petName = (appt.pet as any)?.name ?? 'your pet';
      const apptTypeName = (appt.appointment_type as any)?.name ?? 'appointment';
      const practiceName = (appt.practice as any)?.name ?? 'the clinic';
      const dateStr = format(new Date(appt.starts_at), 'EEEE, MMMM d');
      const timeStr = format(new Date(appt.starts_at), 'h:mm a');
      const subject = `Reminder: ${petName}'s appointment at ${practiceName}`;
      const body =
        `Hi ${firstName},\n\n` +
        `Just a reminder: ${petName}'s ${apptTypeName} at ${practiceName} is ${dateStr} at ${timeStr}.\n\n` +
        `Please reply to confirm or call us to reschedule.\n\n` +
        `— ${practiceName}`;

      const emailResult = await sendEmailReminder({ to: email!, subject, body });
      if (!emailResult.success) {
        errorMsg = emailResult.error;
      } else {
        emailId = emailResult.messageId;
      }
    }

    // Insert reminder log
    const { data: reminder, error: insertError } = await serviceClient
      .from('reminders')
      .insert({
        practice_id: staff.practice_id,
        appointment_id: appointmentId,
        channel,
        reminder_type: reminderType,
        status: errorMsg ? 'failed' : 'sent',
        sent_at: errorMsg ? null : new Date().toISOString(),
        error_message: errorMsg ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[api/v1/reminders] insert error:', insertError);
      return NextResponse.json({ error: 'Failed to log reminder' }, { status: 500 });
    }

    return NextResponse.json({
      reminder,
      sid,
      emailId,
      success: !errorMsg,
      error: errorMsg ?? null,
    });
  } catch (err: any) {
    console.error('[api/v1/reminders] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
