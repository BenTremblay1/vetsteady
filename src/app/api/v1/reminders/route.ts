// GET /api/v1/reminders
// Returns reminders with joined appointment, client, pet, appointment_type data.
// Authenticated — practice-scoped via Supabase auth.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get practice for this staff member
    const serviceClient = createServiceClient();
    const { data: staff } = await serviceClient
      .from('staff')
      .select('practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!staff?.practice_id) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    // Query params
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const status = searchParams.get('status'); // optional filter

    // Build query
    let query = serviceClient
      .from('reminders')
      .select(`
        id,
        appointment_id,
        channel,
        reminder_type,
        status,
        sent_at,
        error_message,
        created_at,
        appointment:appointments (
          id,
          starts_at,
          status,
          client:clients ( first_name, last_name, phone, email ),
          pet:pets ( name, species ),
          appointment_type:appointment_types ( name )
        )
      `)
      .eq('practice_id', staff.practice_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reminders, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      reminders: reminders ?? [],
      total: count ?? (reminders?.length ?? 0),
    });
  } catch (err: any) {
    console.error('[api/v1/reminders] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
