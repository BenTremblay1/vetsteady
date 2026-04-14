// GET /api/v1/practice — get current user's practice info
// PATCH /api/v1/practice — update practice info

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get practice_id from staff record
    const { data: staff } = await supabase
      .from('staff')
      .select('practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!staff?.practice_id) {
      return NextResponse.json({ error: 'No practice found' }, { status: 404 });
    }

    const { data: practice, error } = await supabase
      .from('practices')
      .select('id, name, slug, phone, email, timezone, allow_online_booking, booking_advance_days, subscription_status, stripe_customer_id, settings')
      .eq('id', staff.practice_id)
      .single();

    if (error || !practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    return NextResponse.json({ data: practice });
  } catch (err) {
    console.error('[api/v1/practice] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get practice_id from staff record
    const { data: staff } = await supabase
      .from('staff')
      .select('practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!staff?.practice_id) {
      return NextResponse.json({ error: 'No practice found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, phone, email, timezone, allow_online_booking, booking_advance_days } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (timezone !== undefined) updates.timezone = timezone;
    if (allow_online_booking !== undefined) updates.allow_online_booking = allow_online_booking;
    if (booking_advance_days !== undefined) updates.booking_advance_days = booking_advance_days;

    const { data: practice, error } = await supabase
      .from('practices')
      .update(updates)
      .eq('id', staff.practice_id)
      .select('id, name, slug, phone, email, timezone, allow_online_booking, booking_advance_days')
      .single();

    if (error) {
      console.error('[api/v1/practice] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update practice' }, { status: 500 });
    }

    return NextResponse.json({ data: practice });
  } catch (err) {
    console.error('[api/v1/practice] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
