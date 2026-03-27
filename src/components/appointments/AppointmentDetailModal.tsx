'use client';

import { X, Phone, Mail, Calendar, Dog, Stethoscope, User } from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils/cn';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled',  color: 'text-blue-700',    bg: 'bg-blue-100' },
  confirmed: { label: 'Confirmed',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  completed: { label: 'Completed',  color: 'text-gray-700',    bg: 'bg-gray-100' },
  no_show:   { label: 'No Show',    color: 'text-red-700',     bg: 'bg-red-100' },
  cancelled: { label: 'Cancelled',  color: 'text-orange-700',  bg: 'bg-orange-100' },
};

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  completed: [],
  no_show:   [],
  cancelled: ['scheduled'],
};

export default function AppointmentDetailModal({
  appointment, onClose, onStatusChange,
}: AppointmentDetailModalProps) {
  if (!appointment) return null;
  const { client, pet, staff, appointment_type, status, starts_at, ends_at, notes } = appointment;
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
  const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];
  const duration = Math.round((new Date(ends_at).getTime() - new Date(starts_at).getTime()) / 60000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', statusConfig.bg, statusConfig.color)}>
              {statusConfig.label}
            </span>
            <h2 className="text-base font-semibold text-gray-900">{pet?.name}&rsquo;s Appointment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <InfoRow icon={<Calendar size={15} className="text-teal-600" />} label="Date & Time">
            {new Date(starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            <br /><span className="text-gray-500 text-xs">
              {new Date(starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {' – '}{new Date(ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {' '}({duration} min)
            </span>
          </InfoRow>
          <InfoRow icon={<Stethoscope size={15} className="text-teal-600" />} label="Type">
            {appointment_type?.name ?? '—'}
          </InfoRow>
          <InfoRow icon={<User size={15} className="text-teal-600" />} label="Veterinarian">
            {staff?.name ?? '—'}
          </InfoRow>
          <hr className="border-gray-100" />
          <InfoRow icon={<User size={15} className="text-gray-400" />} label="Client">
            {client ? `${client.first_name} ${client.last_name}` : '—'}
            {(client?.no_show_count ?? 0) > 1 && (
              <span className="ml-2 text-xs text-red-600">⚠ {client!.no_show_count} no-shows</span>
            )}
          </InfoRow>
          {client?.phone && (
            <InfoRow icon={<Phone size={15} className="text-gray-400" />} label="Phone">
              <a href={`tel:${client.phone}`} className="text-teal-700 hover:underline">{client.phone}</a>
            </InfoRow>
          )}
          {client?.email && (
            <InfoRow icon={<Mail size={15} className="text-gray-400" />} label="Email">
              <a href={`mailto:${client.email}`} className="text-teal-700 hover:underline truncate block">{client.email}</a>
            </InfoRow>
          )}
          <InfoRow icon={<Dog size={15} className="text-gray-400" />} label="Pet">
            {pet ? `${pet.name} (${pet.breed ?? pet.species})` : '—'}
            {pet?.weight_kg && <span className="text-gray-400 text-xs ml-1">{pet.weight_kg} kg</span>}
          </InfoRow>
          {notes && (
            <div className="bg-amber-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-amber-900">{notes}</p>
            </div>
          )}
        </div>
        {nextStatuses.length > 0 && (
          <div className="px-6 pb-5 flex flex-wrap gap-2">
            {nextStatuses.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button key={s}
                  onClick={() => { onStatusChange?.(appointment.id, s); onClose(); }}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border-transparent hover:opacity-80', cfg.bg, cfg.color)}>
                  Mark as {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</div>
        <div className="text-sm text-gray-800 mt-0.5">{children}</div>
      </div>
    </div>
  );
}
