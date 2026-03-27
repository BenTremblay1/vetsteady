// GET /api/book/[slug]
// Public endpoint — returns practice info + active appointment types for the booking portal.
// No auth required; reads via Supabase service role.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServiceClient();

    // Look up practice by slug
    const { data: practice, error: practiceErr } = await supabase
      .from('practices')
      .select('id, name, slug, phone, email, timezone, subscription_status')
      .eq('slug', params.slug)
      .single();

    if (practiceErr || !practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    // Only show active subscription practices
    if (!['trial', 'active'].includes(practice.subscription_status)) {
      return NextResponse.json({ error: 'Online booking is not available for this practice' }, { status: 403 });
    }

    // Get active, bookable appointment types
    const { data: appointmentTypes, error: typesErr } = await supabase
      .from('appointment_types')
      .select('id, name, duration_minutes, color, requires_deposit, deposit_amount_cents')
      .eq('practice_id', practice.id)
      .eq('is_active', true)
      .eq('allow_online_booking', true)
      .order('name');

    if (typesErr) throw typesErr;

    // Get bookable staff
    const { data: staff, error: staffErr } = await supabase
      .from('staff')
      .select('id, name, role, color')
      .eq('practice_id', practice.id)
      .eq('is_bookable', true)
      .order('name');

    if (staffErr) throw staffErr;

    return NextResponse.json({
      practice: {
        name: practice.name,
        slug: practice.slug,
        phone: practice.phone,
        email: practice.email,
        timezone: practice.timezone,
      },
      appointmentTypes: appointmentTypes ?? [],
      staff: staff ?? [],
    });
  } catch (err: any) {
    console.error('[book/slug] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
