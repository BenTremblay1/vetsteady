'use client';

import { useState, useEffect, Fragment } from 'react';
import { X, Calendar, Clock, User, Dog, Stethoscope, ChevronDown } from 'lucide-react';
import { Client, Pet, Staff, AppointmentType, CreateAppointmentInput } from '@/types';
import { cn } from '@/lib/utils/cn';
import { trackFirstAppointmentCreated } from '@/lib/analytics/posthog';

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Pre-fill date/hour when clicking a time slot */
  defaultDate?: Date;
  defaultHour?: number;
}

type Step = 'datetime' | 'client' | 'details' | 'confirm';

const STEPS: { id: Step; label: string }[] = [
  { id: 'datetime', label: 'Date & Time' },
  { id: 'client',   label: 'Client & Pet' },
  { id: 'details',  label: 'Details' },
  { id: 'confirm',  label: 'Confirm' },
];

function toLocalDatetimeValue(date: Date): string {
  // Returns "YYYY-MM-DDTHH:MM" for <input type="datetime-local">
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDatetime(val: string): string {
  // Convert local input value to ISO string
  return new Date(val).toISOString();
}

export default function NewAppointmentModal({
  open,
  onClose,
  onCreated,
  defaultDate,
  defaultHour,
}: NewAppointmentModalProps) {
  const [step, setStep] = useState<Step>('datetime');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data lists
  const [staff, setStaff]               = useState<Staff[]>([]);
  const [clients, setClients]           = useState<Client[]>([]);
  const [pets, setPets]                 = useState<Pet[]>([]);
  const [apptTypes, setApptTypes]       = useState<AppointmentType[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  // Form values
  const [startsAt, setStartsAt]                 = useState('');
  const [selectedStaffId, setSelectedStaffId]   = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPetId, setSelectedPetId]       = useState('');
  const [selectedTypeId, setSelectedTypeId]     = useState('');
  const [notes, setNotes]                       = useState('');

  // Derived
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientPets     = pets.filter((p) => p.client_id === selectedClientId);
  const selectedPet    = pets.find((p) => p.id === selectedPetId);
  const selectedType   = apptTypes.find((t) => t.id === selectedTypeId);
  const selectedStaff  = staff.find((s) => s.id === selectedStaffId);
  const filteredClients = clients.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.phone ?? ''} ${c.email ?? ''}`
      .toLowerCase()
      .includes(clientSearch.toLowerCase())
  );

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('datetime');
      setError(null);
      setSubmitting(false);
      setClientSearch('');
      setSelectedClientId('');
      setSelectedPetId('');
      setSelectedStaffId('');
      setSelectedTypeId('');
      setNotes('');

      const d = defaultDate ?? new Date();
      if (defaultHour !== undefined) d.setHours(defaultHour, 0, 0, 0);
      setStartsAt(toLocalDatetimeValue(d));

      // Load reference data
      loadRefData();
    }
  }, [open]);

  // When client changes, load their pets and clear pet selection
  useEffect(() => {
    setSelectedPetId('');
    if (selectedClientId) loadPets(selectedClientId);
  }, [selectedClientId]);

  async function loadRefData() {
    try {
      const [staffRes, clientsRes, typesRes] = await Promise.all([
        fetch('/api/v1/staff'),
        fetch('/api/v1/clients?limit=200'),
        fetch('/api/v1/appointment-types'),
      ]);
      const [staffData, clientsData, typesData] = await Promise.all([
        staffRes.json(),
        clientsRes.json(),
        typesRes.json(),
      ]);
      setStaff(staffData.data ?? []);
      setClients(clientsData.data ?? []);
      setApptTypes((typesData.data ?? []).filter((t: AppointmentType) => t.is_active));
    } catch (e) {
      console.error('[NewAppointmentModal] Failed to load ref data:', e);
    }
  }

  async function loadPets(clientId: string) {
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/pets`);
      const data = await res.json();
      setPets(data.data ?? []);
    } catch (e) {
      console.error('[NewAppointmentModal] Failed to load pets:', e);
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 'datetime': return !!startsAt && !!selectedStaffId;
      case 'client':   return !!selectedClientId && !!selectedPetId;
      case 'details':  return !!selectedTypeId;
      case 'confirm':  return true;
    }
  }

  function advance() {
    const order: Step[] = ['datetime', 'client', 'details', 'confirm'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  }

  function back() {
    const order: Step[] = ['datetime', 'client', 'details', 'confirm'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const body: CreateAppointmentInput = {
        staff_id: selectedStaffId,
        client_id: selectedClientId,
        pet_id: selectedPetId,
        appointment_type_id: selectedTypeId,
        starts_at: parseLocalDatetime(startsAt),
        notes: notes || undefined,
      };
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create appointment');

      // 📊 Analytics: track first appointment (PostHog deduplication handles "first only" logic)
      const appt = data.data;
      if (appt) {
        trackFirstAppointmentCreated({
          practice_id: appt.practice_id ?? '',
          appointment_type: appt.appointment_type?.name ?? selectedTypeId,
          starts_at: appt.starts_at,
          staff_id: appt.staff_id,
        });
      }

      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New Appointment</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i <= stepIndex ? 'bg-teal-600' : 'bg-gray-200',
                )}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 px-6 pt-1 pb-2">
          Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex].label}
        </p>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ─── Step 1: Date & Time ─── */}
          {step === 'datetime' && (
            <>
              <FormField label="Date & Time" icon={<Calendar size={15} />}>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="input w-full"
                />
              </FormField>

              <FormField label="Veterinarian / Staff" icon={<Stethoscope size={15} />}>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select staff member…</option>
                  {staff.filter((s) => s.is_bookable).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </FormField>

              {staff.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                  No staff found. Make sure your practice account is set up.
                </p>
              )}
            </>
          )}

          {/* ─── Step 2: Client & Pet ─── */}
          {step === 'client' && (
            <>
              <FormField label="Search Client" icon={<User size={15} />}>
                <input
                  type="text"
                  placeholder="Name, phone, or email…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="input w-full"
                  autoFocus
                />
              </FormField>

              {/* Client list */}
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredClients.length === 0 && (
                  <div className="p-4 text-sm text-gray-400 text-center">
                    {clients.length === 0 ? 'No clients yet. Add one first.' : 'No matches.'}
                  </div>
                )}
                {filteredClients.slice(0, 20).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left border-b border-gray-100 last:border-0 transition-colors',
                      c.id === selectedClientId
                        ? 'bg-teal-50 text-teal-900 font-medium'
                        : 'hover:bg-gray-50 text-gray-700',
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.first_name} {c.last_name}</div>
                      <div className="text-xs text-gray-400 truncate">{c.phone ?? c.email ?? 'No contact'}</div>
                    </div>
                    {c.no_show_count > 1 && (
                      <span className="ml-auto text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5 flex-shrink-0">
                        {c.no_show_count} no-shows
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Pet selector */}
              {selectedClientId && (
                <FormField label="Select Pet" icon={<Dog size={15} />}>
                  {clientPets.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No pets on file for this client.</p>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {clientPets.map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => setSelectedPetId(pet.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm border transition-colors',
                            pet.id === selectedPetId
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400',
                          )}
                        >
                          {pet.name}
                          <span className="ml-1 text-xs opacity-70">({pet.species})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </FormField>
              )}
            </>
          )}

          {/* ─── Step 3: Appointment Details ─── */}
          {step === 'details' && (
            <>
              <FormField label="Appointment Type" icon={<Stethoscope size={15} />}>
                <div className="grid grid-cols-2 gap-2">
                  {apptTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTypeId(type.id)}
                      className={cn(
                        'flex flex-col items-start p-3 rounded-xl border text-sm text-left transition-colors',
                        type.id === selectedTypeId
                          ? 'border-teal-500 bg-teal-50 text-teal-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700',
                      )}
                    >
                      <span className="font-medium truncate w-full">{type.name}</span>
                      <span className="text-xs opacity-60 mt-0.5">{type.duration_minutes} min</span>
                      {type.requires_deposit && (
                        <span className="text-xs text-amber-600 mt-0.5">
                          Deposit ${(type.deposit_amount_cents / 100).toFixed(0)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Notes (optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions…"
                  rows={3}
                  className="input w-full resize-none"
                />
              </FormField>
            </>
          )}

          {/* ─── Step 4: Confirm ─── */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <ConfirmRow label="Date & Time">
                {new Date(startsAt).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric',
                })} at {new Date(startsAt).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit',
                })}
              </ConfirmRow>
              <ConfirmRow label="Staff">{selectedStaff?.name ?? '—'}</ConfirmRow>
              <ConfirmRow label="Client">
                {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—'}
              </ConfirmRow>
              <ConfirmRow label="Pet">{selectedPet?.name ?? '—'} ({selectedPet?.species})</ConfirmRow>
              <ConfirmRow label="Type">
                {selectedType?.name ?? '—'} ({selectedType?.duration_minutes} min)
              </ConfirmRow>
              {notes && <ConfirmRow label="Notes">{notes}</ConfirmRow>}

              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-800">
                📱 A booking confirmation SMS will be sent to {selectedClient?.first_name} automatically.
              </div>

              {error && (
                <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={step === 'datetime' ? onClose : back}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {step === 'datetime' ? 'Cancel' : '← Back'}
          </button>

          {step === 'confirm' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#0D7377' }}
            >
              {submitting ? 'Booking…' : 'Book Appointment'}
            </button>
          ) : (
            <button
              onClick={advance}
              disabled={!canAdvance()}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#0D7377' }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function ConfirmRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 flex-shrink-0 font-medium">{label}</span>
      <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
  );
}
