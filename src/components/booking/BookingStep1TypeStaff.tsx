'use client';

import { useState } from 'react';
import type { PublicAppointmentType, PublicStaffMember, BookingSelections } from '@/app/book/[slug]/page';

// ── Icon helpers ──────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Species emoji map ─────────────────────────────────────────────────────

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🦜',
  other: '🐾',
};

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  appointmentTypes: PublicAppointmentType[];
  staff: PublicStaffMember[];
  selections: BookingSelections;
  onNext: (apptType: PublicAppointmentType, staffMember: PublicStaffMember) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function BookingStep1TypeStaff({ appointmentTypes, staff, selections, onNext }: Props) {
  const [selectedType, setSelectedType] = useState<PublicAppointmentType | null>(
    selections.appointmentType
  );
  const [selectedStaff, setSelectedStaff] = useState<PublicStaffMember | null>(
    selections.staffMember
  );

  const canProceed = selectedType !== null && selectedStaff !== null;

  function handleNext() {
    if (selectedType && selectedStaff) {
      onNext(selectedType, selectedStaff);
    }
  }

  return (
    <div className="space-y-8">
      {/* Appointment Type */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Select appointment type</h2>
        <p className="text-sm text-gray-500 mb-4">What brings your pet in today?</p>

        {appointmentTypes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No appointment types available for online booking at this time.
          </div>
        ) : (
          <div className="grid gap-3">
            {appointmentTypes.map((type) => {
              const isSelected = selectedType?.id === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all
                    ${isSelected
                      ? 'border-[#0D7377] bg-teal-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Colour dot */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: type.color || '#0D7377' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isSelected ? 'text-[#0D7377]' : 'text-gray-900'}`}>
                        {type.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-gray-500 text-xs">
                        <ClockIcon />
                        <span>{type.duration_minutes} min</span>
                        {type.requires_deposit && type.deposit_amount_cents > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                            ${(type.deposit_amount_cents / 100).toFixed(0)} deposit
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-[#0D7377]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" clipRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff selection */}
      {selectedType && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose your vet</h2>
          <p className="text-sm text-gray-500 mb-4">Select a preferred veterinarian</p>

          <div className="grid gap-3">
            {/* "No preference" option */}
            {(() => {
              const noPreference = { id: 'any', name: 'No preference', role: '', color: '#9CA3AF' };
              const isSelected = selectedStaff?.id === 'any';
              return (
                <button
                  key="any"
                  onClick={() => setSelectedStaff(noPreference as PublicStaffMember)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all
                    ${isSelected
                      ? 'border-[#0D7377] bg-teal-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      🎲
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isSelected ? 'text-[#0D7377]' : 'text-gray-900'}`}>
                        No preference
                      </p>
                      <p className="text-xs text-gray-500">First available vet</p>
                    </div>
                    {isSelected && (
                      <div className="text-[#0D7377]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" clipRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })()}

            {staff.map((member) => {
              const isSelected = selectedStaff?.id === member.id;
              const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedStaff(member)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all
                    ${isSelected
                      ? 'border-[#0D7377] bg-teal-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ background: member.color || '#0D7377' }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isSelected ? 'text-[#0D7377]' : 'text-gray-900'}`}>
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                    {isSelected && (
                      <div className="text-[#0D7377]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" clipRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleNext}
        disabled={!canProceed}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
          ${canProceed
            ? 'bg-[#0D7377] text-white hover:bg-teal-800 shadow-sm hover:shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
      >
        Choose date & time
        <ChevronRightIcon />
      </button>
    </div>
  );
}
