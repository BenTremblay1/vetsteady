/**
 * Shared slot generation logic used by both the public booking API
 * and the AI front desk reschedule flow.
 */

import { getTimezoneOffsetMinutes } from './timezone';
import { createServiceClient } from '@/lib/supabase/service';

const BUSINESS_START_HOUR = 8;   // 8:00 AM practice local time
const BUSINESS_END_HOUR   = 18;  // 6:00 PM practice local time
const SLOT_INTERVAL_MIN   = 30;

/**
 * Generate available ISO slot strings for a single date.
 */
export function generateSlots(
  dateStr: string,           // "YYYY-MM-DD"
  durationMin: number,
  bookedRanges: Array<{ start: Date; end: Date }>,
  tzOffsetMinutes: number,   // practice UTC offset in minutes (negative for west)
): string[] {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dayOfWeek = utcMidnight.getUTCDay(); // 0=Sun, 6=Sat
  if (dayOfWeek === 0) return []; // no Sundays

  const slots: string[] = [];
  const now = new Date();

  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_INTERVAL_MIN) {
      const utcHour = hour - tzOffsetMinutes / 60;
      const slotStart = new Date(Date.UTC(year, month - 1, day, utcHour, min, 0, 0));
      const slotEnd   = new Date(slotStart.getTime() + durationMin * 60_000);

      // Don't bleed past business end in local time
      const localEndHour = utcHour + tzOffsetMinutes / 60 + durationMin / 60;
      if (localEndHour > BUSINESS_END_HOUR) continue;

      // Skip past slots
      if (slotStart <= now) continue;

      // Skip if overlaps an existing booking
      const overlaps = bookedRanges.some(r => slotStart < r.end && slotEnd > r.start);
      if (overlaps) continue;

      slots.push(slotStart.toISOString());
    }
  }

  return slots;
}

/**
 * Return the next N available slots for a given staff member + appointment type,
 * searching up to `searchDays` days ahead.
 */
export async function getNextAvailableSlots(params: {
  practiceId: string;
  staffId: string;
  durationMin: number;
  timezone: string;
  count: number;
  searchDays?: number;
}): Promise<string[]> {
  const { practiceId, staffId, durationMin, timezone, count, searchDays = 14 } = params;
  const supabase = createServiceClient();
  const collected: string[] = [];

  const today = new Date();

  for (let d = 1; d <= searchDays && collected.length < count; d++) {
    const target = new Date(today);
    target.setUTCDate(today.getUTCDate() + d);
    const dateStr = target.toISOString().slice(0, 10);

    const dayDate = new Date(Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      12, 0, 0
    ));
    const tzOffsetMinutes = getTimezoneOffsetMinutes(timezone, dayDate);

    // Fetch existing bookings for this staff/date
    const dayStart = dateStr + 'T00:00:00.000Z';
    const dayEnd   = dateStr + 'T23:59:59.999Z';
    const { data: existing } = await supabase
      .from('appointments')
      .select('starts_at, ends_at')
      .eq('practice_id', practiceId)
      .eq('staff_id', staffId)
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .neq('status', 'cancelled');

    const bookedRanges = (existing ?? []).map(a => ({
      start: new Date(a.starts_at),
      end:   new Date(a.ends_at),
    }));

    const daySlots = generateSlots(dateStr, durationMin, bookedRanges, tzOffsetMinutes);

    for (const slot of daySlots) {
      if (collected.length >= count) break;
      collected.push(slot);
    }
  }

  return collected;
}
