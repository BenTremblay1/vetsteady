'use client';

import { useState } from 'react';
import type { BookingSelections, PracticeInfo, BookingResult } from '@/app/book/[slug]/page';
import type { PublicBookingInput } from '@/app/api/book/[slug]/appointment/route';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function InputField({
  label,
  id,
  required,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  id: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent transition-shadow
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  slug: string;
  selections: BookingSelections;
  practice: PracticeInfo;
  onSuccess: (result: BookingResult) => void;
  onBack: () => void;
}

// ── State ─────────────────────────────────────────────────────────────────

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  preferredContact: 'sms' | 'email' | 'both';
  petName: string;
  petSpecies: 'dog' | 'cat' | 'bird' | 'other';
  petBreed: string;
  notes: string;
}

const SPECIES_OPTIONS: Array<{ value: string; label: string; emoji: string }> = [
  { value: 'dog', label: 'Dog', emoji: '🐕' },
  { value: 'cat', label: 'Cat', emoji: '🐈' },
  { value: 'bird', label: 'Bird', emoji: '🦜' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function BookingStep3ClientInfo({ slug, selections, practice, onSuccess, onBack }: Props) {
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    preferredContact: 'sms',
    petName: '',
    petSpecies: 'dog',
    petBreed: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.phone.trim() && !form.email.trim()) {
      newErrors.phone = 'At least one contact method is required';
      newErrors.email = 'At least one contact method is required';
    }
    if (form.phone && !/^\+?[\d\s\-().]{7,}$/.test(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.petName.trim()) newErrors.petName = "Pet's name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!selections.appointmentType || !selections.staffMember || !selections.slot) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload: PublicBookingInput = {
      staff_id: selections.staffMember.id === 'any'
        ? '' // should not happen if UX is correct
        : selections.staffMember.id,
      appointment_type_id: selections.appointmentType.id,
      starts_at: selections.slot,
      client_first_name: form.firstName.trim(),
      client_last_name: form.lastName.trim(),
      client_phone: form.phone.trim() || undefined,
      client_email: form.email.trim() || undefined,
      preferred_contact: form.preferredContact,
      pet_name: form.petName.trim(),
      pet_species: form.petSpecies,
      pet_breed: form.petBreed.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      const res = await fetch(`/api/book/${slug}/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      onSuccess({
        appointmentId: data.appointmentId,
        confirmationToken: data.confirmationToken,
        message: data.message,
      });
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Booking summary */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm space-y-1.5">
        <p className="font-semibold text-teal-900 text-base">Your appointment</p>
        <div className="text-teal-700 space-y-1 mt-2">
          <p>📋 <strong>{selections.appointmentType?.name}</strong></p>
          <p>🕐 {selections.date ? formatDate(selections.date) : ''} at{' '}
            <strong>{selections.slot ? formatSlotTime(selections.slot) : ''}</strong>
          </p>
          <p>👨‍⚕️ {selections.staffMember?.name || 'Any available vet'}</p>
        </div>
      </div>

      {/* Client info */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your information</h2>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="First name" id="firstName" required
            value={form.firstName} onChange={(v) => set('firstName', v)}
            placeholder="Jane" error={errors.firstName}
          />
          <InputField
            label="Last name" id="lastName" required
            value={form.lastName} onChange={(v) => set('lastName', v)}
            placeholder="Smith" error={errors.lastName}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <InputField
            label="Phone number" id="phone" type="tel"
            value={form.phone} onChange={(v) => set('phone', v)}
            placeholder="+1 555 000 0000" error={errors.phone}
          />
          <InputField
            label="Email address" id="email" type="email"
            value={form.email} onChange={(v) => set('email', v)}
            placeholder="jane@example.com" error={errors.email}
          />
        </div>

        {/* Preferred contact */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred reminder method
          </label>
          <div className="flex gap-2">
            {(['sms', 'email', 'both'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set('preferredContact', opt)}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium capitalize transition-all
                  ${form.preferredContact === opt
                    ? 'border-[#0D7377] bg-teal-50 text-[#0D7377]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {opt === 'sms' ? '📱 SMS' : opt === 'email' ? '📧 Email' : '📱📧 Both'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pet info */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your pet</h2>

        {/* Species picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
          <div className="grid grid-cols-4 gap-2">
            {SPECIES_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('petSpecies', s.value as FormState['petSpecies'])}
                className={`flex flex-col items-center py-2.5 rounded-xl border-2 text-sm transition-all
                  ${form.petSpecies === s.value
                    ? 'border-[#0D7377] bg-teal-50 text-[#0D7377]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-xs font-medium mt-1">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Pet's name" id="petName" required
            value={form.petName} onChange={(v) => set('petName', v)}
            placeholder="Buddy" error={errors.petName}
          />
          <InputField
            label="Breed (optional)" id="petBreed"
            value={form.petBreed} onChange={(v) => set('petBreed', v)}
            placeholder="Golden Retriever"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Anything we should know about your pet's visit…"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent resize-none"
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-[#0D7377] text-white font-semibold text-sm hover:bg-teal-800 shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Booking…
            </>
          ) : (
            'Confirm booking'
          )}
        </button>
      </div>
    </form>
  );
}
