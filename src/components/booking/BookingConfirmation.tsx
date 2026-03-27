'use client';

import type { BookingSelections, PracticeInfo, BookingResult } from '@/app/book/[slug]/page';

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
    year: 'numeric',
  });
}

interface Props {
  result: BookingResult;
  selections: BookingSelections;
  practice: PracticeInfo;
}

export default function BookingConfirmation({ result, selections, practice }: Props) {
  return (
    <div className="text-center space-y-6">
      {/* Big checkmark */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-[#0D7377] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">You're booked! 🎉</h1>
        <p className="text-gray-500 mt-2 text-sm">{result.message}</p>
      </div>

      {/* Appointment card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm text-left p-5 space-y-3">
        <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-center mb-3 text-gray-400">
          Appointment details
        </p>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg">🏥</span>
            <div>
              <p className="text-xs text-gray-400">Practice</p>
              <p className="font-medium text-gray-800">{practice.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg">📋</span>
            <div>
              <p className="text-xs text-gray-400">Service</p>
              <p className="font-medium text-gray-800">{selections.appointmentType?.name}</p>
            </div>
          </div>
          {selections.date && selections.slot && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">🗓️</span>
              <div>
                <p className="text-xs text-gray-400">Date & time</p>
                <p className="font-medium text-gray-800">
                  {formatDate(selections.date)} at {formatSlotTime(selections.slot)}
                </p>
              </div>
            </div>
          )}
          {selections.staffMember && selections.staffMember.id !== 'any' && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">👨‍⚕️</span>
              <div>
                <p className="text-xs text-gray-400">Veterinarian</p>
                <p className="font-medium text-gray-800">{selections.staffMember.name}</p>
              </div>
            </div>
          )}
          {selections.appointmentType && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">⏱️</span>
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="font-medium text-gray-800">{selections.appointmentType.duration_minutes} minutes</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Confirmation #{result.confirmationToken.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Reminders note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">📱 Reminders are on their way</p>
        <p>You'll receive SMS/email confirmations and reminders before your appointment.</p>
      </div>

      {/* Contact info */}
      {(practice.phone || practice.email) && (
        <div className="text-sm text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">Need to reschedule or have questions?</p>
          {practice.phone && (
            <p>
              Call us:{' '}
              <a href={`tel:${practice.phone}`} className="text-[#0D7377] font-medium underline">
                {practice.phone}
              </a>
            </p>
          )}
          {practice.email && (
            <p>
              Email:{' '}
              <a href={`mailto:${practice.email}`} className="text-[#0D7377] font-medium underline">
                {practice.email}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Brand footer */}
      <p className="text-xs text-gray-400 pt-4">
        Scheduled with{' '}
        <span className="font-semibold text-[#0D7377]">VetSteady</span>
        {' '}— keeping your practice running.
      </p>
    </div>
  );
}
