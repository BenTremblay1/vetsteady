// GET /api/book/[slug]/slots?date=YYYY-MM-DD&staff_id=xxx&duration=30
// Returns available 30-min (or custom) slots for a given date and staff member.
// No auth required.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getTimezoneOffsetMinutes } from '@/lib/utils/timezone';

// Business hours: 8am – 6pm Mon–Fri  (Saturday optional)
const BUSINESS_START_HOUR = 8;   // 8:00 AM (practice local time)
const BUSINESS_END_HOUR   = 18;  // 6:00 PM (practice local time)
const SLOT_INTERVAL_MIN   = 30;

function generateSlots(
  dateStr: string,           // "YYYY-MM-DD"
  durationMin: number,
  bookedRanges: Array<{ start: Date; end: Date }>,
  tzOffsetMinutes: number,   // practice timezone offset from UTC in minutes
): string[] {
  // Build a date representing midnight in the PRACTICE timezone.
  // We construct it as UTC midnight then adjust.
  const [year, month, day] = dateStr.split('-').map(Number);
  // UTC midnight for the given date
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  const dayOfWeek = utcMidnight.getUTCDay(); // 0=Sun, 6=Sat

  // No Sunday bookings; can optionally allow Saturday
  if (dayOfWeek === 0) return [];

  const slots: string[] = [];

  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_INTERVAL_MIN) {
      // Convert practice-local hour → UTC
      // tzOffsetMinutes: minutes to ADD to local to get UTC
      // e.g. EDT (UTC-4): tzOffsetMinutes = -240 → add -240 to get UTC
      const utcHour = hour - tzOffsetMinutes / 60;
      const utcMinute = min;

      const slotStart = new Date(Date.UTC(year, month - 1, day, utcHour, utcMinute, 0, 0));
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

      // Don't offer slots that would bleed past business end
      // Check in practice local time
      const localEndHour = utcHour + tzOffsetMinutes / 60 + durationMin / 60;
      if (localEndHour > BUSINESS_END_HOUR ||
         (Math.abs(localEndHour - BUSINESS_END_HOUR) < 0.001 && utcMinute + durationMin > 0)) {
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

    // Verify practice + staff belong together, and get timezone
    const { data: practice } = await supabase
      .from('practices')
      .select('id, timezone')
      .eq('slug', params.slug)
      .single();

    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    const tz = practice.timezone ?? 'UTC';

    // Parse the date for timezone offset calculation
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // noon UTC → safe for DST
    const tzOffsetMinutes = getTimezoneOffsetMinutes(tz, dayDate);

    // Fetch existing appointments for the staff on that date (in UTC)
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

    const slots = generateSlots(dateStr, durationMin, bookedRanges, tzOffsetMinutes);

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error('[book/slug/slots] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
