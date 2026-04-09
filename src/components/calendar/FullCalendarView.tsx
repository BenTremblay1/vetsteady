'use client';

import { useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment, AppointmentStatus } from '@/types';
import type { EventClickArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';

// Status → colour mapping (matches VetSteady brand)
const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  scheduled:  { bg: '#FEF9C3', border: '#F59E0B', text: '#92400E' }, // amber — pending
  confirmed:  { bg: '#DCFCE7', border: '#22C55E', text: '#166534' }, // green — confirmed
  completed:  { bg: '#F0FDF4', border: '#86EFAC', text: '#4B5563' }, // muted green — done
  no_show:    { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }, // red — no-show
  cancelled:  { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280' }, // grey — cancelled
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_show: 'No-show',
  cancelled: 'Cancelled',
};

interface FullCalendarViewProps {
  appointments: Appointment[];
  practiceTimezone?: string;
  loading?: boolean;
  onNewAppointment?: (date: Date, hour: number) => void;
  onAppointmentClick?: (appt: Appointment) => void;
}

function renderEventContent(arg: EventContentArg) {
  const { event } = arg;
  const appt = event.extendedProps.appointment as Appointment;
  const colors = STATUS_COLORS[appt.status];
  const clientName = appt.client
    ? `${appt.client.first_name} ${appt.client.last_name}`
    : 'Unknown client';
  const petName = appt.pet?.name ?? '';
  const typeName = appt.appointment_type?.name ?? '';

  return (
    <div
      className="h-full w-full px-1.5 py-1 overflow-hidden rounded text-[11px] leading-tight flex flex-col gap-0.5 cursor-pointer select-none"
      style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}`, color: colors.text }}
    >
      <span className="font-semibold truncate">{clientName}</span>
      {petName && <span className="truncate opacity-80">{petName}</span>}
      {typeName && <span className="truncate opacity-70">{typeName}</span>}
      <span
        className="mt-auto text-[9px] font-medium px-1 py-0.5 rounded self-start"
        style={{ backgroundColor: colors.border + '33', color: colors.text }}
      >
        {STATUS_LABEL[appt.status]}
      </span>
    </div>
  );
}

export default function FullCalendarView({
  appointments,
  loading = false,
  onNewAppointment,
  onAppointmentClick,
}: FullCalendarViewProps) {
  const calRef = useRef<FullCalendar>(null);
  const isFirstRender = useRef(true);

  // ── Dynamic scrollTime: scroll to current time only when viewing THIS week.
  // Navigating to a past/future week should start at 7am (morning), not the
  // current clock time, which is the most useful default for non-today weeks.
  const getScrollTime = () => {
    const now = new Date();
    const todayStr = now.toDateString();
    // We'll evaluate the visible range in the datesSet handler below.
    return '07:00:00'; // default; will be corrected on first datesSet
  };

  const scrollTime = (() => {
    const now = new Date();
    const h = now.getHours();
    if (h >= 6 && h < 20) {
      const scrollH = Math.max(7, h - 1);
      return `${scrollH.toString().padStart(2, '0')}:00:00`;
    }
    return '07:00:00';
  })();

  // Convert appointments to FullCalendar events
  const events = appointments.map((appt) => {
    const colors = STATUS_COLORS[appt.status];
    return {
      id: appt.id,
      title: appt.client
        ? `${appt.client.first_name} ${appt.client.last_name}${appt.pet ? ` · ${appt.pet.name}` : ''}`
        : 'Appointment',
      start: appt.starts_at,
      end: appt.ends_at,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { appointment: appt },
    };
  });

  // ── datesSet: fires whenever the visible date range changes (navigate, prev/next, today)
  // Fix: if viewing a week that doesn't include today → scroll to 7am (morning hours),
  // not the current clock time. Current time scroll only makes sense for "today" week.
  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    if (!calRef.current) return;
    const calApi = calRef.current.getApi();
    const now = new Date();
    const todayStr = now.toDateString();
    const viewStart = arg.start;
    const viewEnd = arg.end;

    // Check if "today" falls within the currently displayed date range
    const todayInView =
      now >= viewStart && now < viewEnd;

    if (todayInView) {
      // Viewing this week: scroll to current time (default FullCalendar behaviour)
      const h = now.getHours();
      if (h >= 6 && h < 20) {
        const scrollH = Math.max(7, h - 1);
        calApi.scrollToTime(`${scrollH.toString().padStart(2, '0')}:00:00`);
      }
    } else {
      // Viewing a past or future week: scroll to morning (7am)
      // Only do this on user-initiated navigation (skip first render)
      if (!isFirstRender.current) {
        calApi.scrollToTime('07:00:00');
      }
    }
    isFirstRender.current = false;
  }, []);

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const appt = arg.event.extendedProps.appointment as Appointment;
      onAppointmentClick?.(appt);
    },
    [onAppointmentClick]
  );

  const handleDateSelect = useCallback(
    (arg: DateSelectArg) => {
      const date = arg.start;
      const hour = date.getHours();
      onNewAppointment?.(date, hour);
      // Deselect
      calRef.current?.getApi().unselect();
    },
    [onNewAppointment]
  );

  return (
    <div className="relative flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-30 flex items-center justify-center">
          <div className="text-sm text-gray-400 animate-pulse">Loading appointments…</div>
        </div>
      )}

      {/* Status legend */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-2 border-b border-gray-100 flex-wrap">
        {(Object.keys(STATUS_COLORS) as AppointmentStatus[]).map((status) => {
          const c = STATUS_COLORS[status];
          return (
            <div key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: c.border }}
              />
              {STATUS_LABEL[status]}
            </div>
          );
        })}
      </div>

      {/* FullCalendar */}
      <div className="flex-1 min-h-0 p-2 fc-wrapper">
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'Today',
            week: 'Week',
            day: 'Day',
          }}
          height="100%"
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          slotMinTime="07:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          weekends={true}
          nowIndicator={true}
          scrollTime={scrollTime}
          allDaySlot={false}
          expandRows={true}
          stickyHeaderDates={true}
          titleFormat={{ month: 'long', year: 'numeric' }}
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true } as any}
          slotMaxTime="20:00:00"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '18:00',
          }}
          // Style today's column
          dayCellClassNames={({ date }) =>
            date.toDateString() === new Date().toDateString()
              ? ['fc-today-custom']
              : []
          }
          datesSet={handleDatesSet}
        />
      </div>
    </div>
  );
}
