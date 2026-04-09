'use client';

import { useMemo } from 'react';
import { Appointment } from '@/types';
import AppointmentBlock from './AppointmentBlock';

const HOUR_HEIGHT_PX = 64; // height of one hour slot in px
const START_HOUR = 7;      // 7:00 AM (practice local time)
const END_HOUR = 19;       // 7:00 PM (practice local time)

interface DayColumnProps {
  date: Date;              // The calendar day in practice local time
  appointments: Appointment[];
  practiceTimezone?: string; // IANA timezone, e.g. "America/New_York"
  onAppointmentClick?: (appt: Appointment) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}

/**
 * Convert a UTC ISO string to the hour-of-day in a given IANA timezone.
 * Falls back to browser-local interpretation if timezone is unavailable.
 */
function getHourInTimezone(utcIsoString: string, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
      fractionalSecondDigits: undefined,
    });
    const parts = formatter.formatToParts(new Date(utcIsoString));
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    return hour + minute / 60;
  } catch {
    // Fallback to browser local time
    const d = new Date(utcIsoString);
    return d.getHours() + d.getMinutes() / 60;
  }
}

/**
 * Get appointment top position (% of visible day window) based on practice local time.
 */
function getTopPercent(startsAt: string, timezone: string): number {
  const hour = getHourInTimezone(startsAt, timezone);
  return ((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
}

/**
 * Get appointment height (% of visible day window) based on duration in practice local time.
 */
function getHeightPercent(startsAt: string, endsAt: string, timezone: string): number {
  const startHour = getHourInTimezone(startsAt, timezone);
  const endHour = getHourInTimezone(endsAt, timezone);
  const durationHours = Math.max(endHour - startHour, 0.25); // minimum 15 min
  return (durationHours / (END_HOUR - START_HOUR)) * 100;
}

export default function DayColumn({
  date,
  appointments,
  practiceTimezone = 'UTC',
  onAppointmentClick,
  onSlotClick,
}: DayColumnProps) {
  const totalHeight = HOUR_HEIGHT_PX * (END_HOUR - START_HOUR);

  // Filter appointments to this day (using practice timezone)
  const dayAppts = useMemo(() => {
    const dayStr = date.toLocaleDateString('en-US', { timeZone: practiceTimezone, weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });
    return appointments.filter((a) => {
      const apptDayStr = new Date(a.starts_at).toLocaleDateString('en-US', {
        timeZone: practiceTimezone,
        weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric',
      });
      return apptDayStr === dayStr;
    });
  }, [date, appointments, practiceTimezone]);

  const isToday = (() => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', {
      timeZone: practiceTimezone,
      weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric',
    });
    const dayStr = date.toLocaleDateString('en-US', {
      timeZone: practiceTimezone,
      weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric',
    });
    return todayStr === dayStr;
  })();

  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const hour = Math.floor((relY / totalHeight) * (END_HOUR - START_HOUR)) + START_HOUR;
    onSlotClick?.(date, hour);
  };

  return (
    <div className="relative flex-1 min-w-0" style={{ height: totalHeight }}>
      {/* Background hour lines */}
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-gray-100"
          style={{ top: i * HOUR_HEIGHT_PX }}
        />
      ))}

      {/* Half-hour dashed lines */}
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
        <div
          key={`half-${i}`}
          className="absolute left-0 right-0 border-t border-dashed border-gray-50"
          style={{ top: i * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2 }}
        />
      ))}

      {/* Today highlight */}
      {isToday && (
        <div className="absolute inset-0 bg-teal-50/20 pointer-events-none" />
      )}

      {/* Clickable background */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleSlotClick}
      />

      {/* Appointment blocks */}
      {dayAppts.map((appt) => (
        <div
          key={appt.id}
          className="absolute left-1 right-1 overflow-hidden z-10"
          style={{
            top: `${getTopPercent(appt.starts_at, practiceTimezone)}%`,
            height: `${Math.max(getHeightPercent(appt.starts_at, appt.ends_at, practiceTimezone), 2)}%`,
            minHeight: 40,
          }}
        >
          <AppointmentBlock
            appointment={appt}
            onClick={onAppointmentClick}
          />
        </div>
      ))}
    </div>
  );
}

export { START_HOUR, END_HOUR, HOUR_HEIGHT_PX };
