'use client';

import { Appointment } from '@/types';
import { cn } from '@/lib/utils/cn';

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-50 border-l-4 border-blue-400 text-blue-900',
  confirmed:  'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900',
  completed:  'bg-gray-50 border-l-4 border-gray-400 text-gray-600',
  no_show:    'bg-red-50 border-l-4 border-red-400 text-red-900',
  cancelled:  'bg-orange-50 border-l-4 border-orange-400 text-orange-900 opacity-60',
};

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-emerald-500',
  completed: 'bg-gray-400',
  no_show:   'bg-red-500',
  cancelled: 'bg-orange-400',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AppointmentBlock({ appointment, onClick }: AppointmentBlockProps) {
  const { status, pet, client, appointment_type, staff } = appointment;
  const styleKey = status ?? 'scheduled';

  return (
    <button
      onClick={() => onClick?.(appointment)}
      className={cn(
        'w-full text-left rounded-md px-2 py-1.5 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer group',
        STATUS_STYLES[styleKey] ?? STATUS_STYLES.scheduled,
      )}
      title={`${pet?.name} (${client?.first_name} ${client?.last_name}) — ${appointment_type?.name}`}
    >
      <div className="flex items-center gap-1 font-semibold truncate">
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[styleKey])}
        />
        <span className="truncate">{pet?.name ?? '—'}</span>
      </div>
      <div className="truncate text-[10px] mt-0.5 opacity-80">
        {client?.last_name}, {client?.first_name}
      </div>
      <div className="truncate text-[10px] opacity-70">
        {appointment_type?.name} · {formatTime(appointment.starts_at)}
      </div>
      {staff && (
        <div className="truncate text-[10px] mt-0.5 opacity-60">{staff.name}</div>
      )}
    </button>
  );
}
