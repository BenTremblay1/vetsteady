'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Appointment } from '@/types';
import DayColumn, { START_HOUR, END_HOUR, HOUR_HEIGHT_PX } from './DayColumn';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDayNum(date: Date): string {
  return date.getDate().toString();
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

interface WeekCalendarProps {
  appointments: Appointment[];
  onNewAppointment?: (date: Date, hour: number) => void;
  onAppointmentClick?: (appt: Appointment) => void;
  loading?: boolean;
}

export default function WeekCalendar({
  appointments,
  onNewAppointment,
  onAppointmentClick,
  loading = false,
}: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const totalHeight = HOUR_HEIGHT_PX * (END_HOUR - START_HOUR);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday  = () => setWeekStart(getWeekStart(new Date()));

  const handleSlotClick = useCallback((date: Date, hour: number) => {
    onNewAppointment?.(date, hour);
  }, [onNewAppointment]);

  const isThisWeek = weekStart.toDateString() === getWeekStart(new Date()).toDateString();

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">
            {formatMonthYear(weekStart)}
          </h2>
          {!isThisWeek && (
            <button
              onClick={goToday}
              className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <button
              onClick={prevWeek}
              className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextWeek}
              className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => onNewAppointment?.(new Date(), new Date().getHours())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#0D7377' }}
          >
            <Plus size={15} />
            New
          </button>
        </div>
      </div>

      {/* ── Day headers ── */}
      <div className="flex border-b border-gray-200">
        {/* Time gutter spacer */}
        <div className="w-14 flex-shrink-0" />
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className="flex-1 text-center py-2 text-xs font-medium"
            >
              <div className={`text-gray-500 uppercase tracking-wide`}>
                {DAY_LABELS[day.getDay()]}
              </div>
              <div
                className={`text-lg font-semibold mt-0.5 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
                  isToday ? 'text-white' : 'text-gray-800'
                }`}
                style={isToday ? { backgroundColor: '#0D7377' } : undefined}
              >
                {formatDayNum(day)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scrollable grid ── */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
            <div className="text-sm text-gray-400 animate-pulse">Loading…</div>
          </div>
        )}

        <div className="flex" style={{ height: totalHeight }}>
          {/* Time gutter */}
          <div className="w-14 flex-shrink-0 relative">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div
                key={i}
                className="absolute right-2 text-[10px] text-gray-400 leading-none"
                style={{ top: i * HOUR_HEIGHT_PX - 6 }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, i) => (
            <DayColumn
              key={i}
              date={day}
              appointments={appointments}
              onAppointmentClick={onAppointmentClick}
              onSlotClick={handleSlotClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
