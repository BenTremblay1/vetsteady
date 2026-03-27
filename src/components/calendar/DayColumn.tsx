'use client';

import { useMemo } from 'react';
import { Appointment } from '@/types';
import AppointmentBlock from './AppointmentBlock';

const HOUR_HEIGHT_PX = 64; // height of one hour slot in px
const START_HOUR = 7;      // 7:00 AM
const END_HOUR = 19;       // 7:00 PM

interface DayColumnProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appt: Appointment) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}

function getTopPercent(startsAt: string): number {
  const d = new Date(startsAt);
  const hour = d.getHours() + d.getMinutes() / 60;
  return ((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
}

function getHeightPercent(startsAt: string, endsAt: string): number {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const durationHours = (end.getTime() - start.getTime()) / 3600000;
  return (durationHours / (END_HOUR - START_HOUR)) * 100;
}

export default function DayColumn({ date, appointments, onAppointmentClick, onSlotClick }: DayColumnProps) {
  const totalHeight = HOUR_HEIGHT_PX * (END_HOUR - START_HOUR);

  // Filter appointments to this day and within visible range
  const dayAppts = useMemo(() => {
    const dateStr = date.toDateString();
    return appointments.filter((a) => {
      const d = new Date(a.starts_at);
      return d.toDateString() === dateStr &&
        d.getHours() >= START_HOUR && d.getHours() < END_HOUR;
    });
  }, [date, appointments]);

  const isToday = date.toDateString() === new Date().toDateString();

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
            top: `${getTopPercent(appt.starts_at)}%`,
            height: `${Math.max(getHeightPercent(appt.starts_at, appt.ends_at), 2)}%`,
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
