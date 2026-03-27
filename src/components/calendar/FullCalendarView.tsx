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
            right: 'timeGridWeek,timeGridDay',
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
          slotMaxTime="19:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          weekends={true}
          nowIndicator={true}
          allDaySlot={false}
          expandRows={true}
          stickyHeaderDates={true}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
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
        />
      </div>
    </div>
  );
}
