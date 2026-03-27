// GET /api/book/[slug]/slots?date=YYYY-MM-DD&staff_id=xxx&duration=30
// Returns available 30-min (or custom) slots for a given date and staff member.
// No auth required.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// Business hours: 8am – 6pm Mon–Fri  (Saturday optional)
const BUSINESS_START_HOUR = 8;   // 8:00 AM
const BUSINESS_END_HOUR   = 18;  // 6:00 PM
const SLOT_INTERVAL_MIN   = 30;

function generateSlots(
  dateStr: string,       // "YYYY-MM-DD"
  durationMin: number,
  bookedRanges: Array<{ start: Date; end: Date }>
): string[] {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

  // No Sunday bookings; can optionally allow Saturday
  if (dayOfWeek === 0) return [];

  const slots: string[] = [];

  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_INTERVAL_MIN) {
      const slotStart = new Date(dateStr + 'T00:00:00');
      slotStart.setHours(hour, min, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

      // Don't offer slots that would bleed past business end
      if (slotEnd.getHours() > BUSINESS_END_HOUR ||
         (slotEnd.getHours() === BUSINESS_END_HOUR && slotEnd.getMinutes() > 0)) {
        continue;
      }

      // Don't offer past slots (today)
      const now = new Date();
      if (slotStart <= now) continue;

      // Check no overlap with existing appointments
      const overlaps = bookedRanges.some(
        (r) => slotStart < r.end && slotEnd > r.start
      );
      if (overlaps) continue;

      slots.push(slotStart.toISOString());
    }
  }

  return slots;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr   = searchParams.get('date');   // "YYYY-MM-DD"
    const staffId   = searchParams.get('staff_id');
    const durationStr = searchParams.get('duration') ?? '30';
    const durationMin = parseInt(durationStr, 10) || 30;

    if (!dateStr || !staffId) {
      return NextResponse.json({ error: 'date and staff_id are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify practice + staff belong together
    const { data: practice } = await supabase
      .from('practices')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    // Fetch existing appointments for the staff on that date
    const dayStart = dateStr + 'T00:00:00.000Z';
    const dayEnd   = dateStr + 'T23:59:59.999Z';

    const { data: existing } = await supabase
      .from('appointments')
      .select('starts_at, ends_at')
      .eq('practice_id', practice.id)
      .eq('staff_id', staffId)
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .neq('status', 'cancelled');

    const bookedRanges = (existing ?? []).map((a) => ({
      start: new Date(a.starts_at),
      end: new Date(a.ends_at),
    }));

    const slots = generateSlots(dateStr, durationMin, bookedRanges);

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error('[book/slug/slots] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
