'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BookingStep1TypeStaff from '@/components/booking/BookingStep1TypeStaff';
import BookingStep2DateSlot from '@/components/booking/BookingStep2DateSlot';
import BookingStep3ClientInfo from '@/components/booking/BookingStep3ClientInfo';
import BookingConfirmation from '@/components/booking/BookingConfirmation';
import BookingErrorState from '@/components/booking/BookingErrorState';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PracticeInfo {
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  timezone: string;
}

export interface PublicAppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  color: string;
  requires_deposit: boolean;
  deposit_amount_cents: number;
}

export interface PublicStaffMember {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface PortalData {
  practice: PracticeInfo;
  appointmentTypes: PublicAppointmentType[];
  staff: PublicStaffMember[];
}

export interface BookingSelections {
  appointmentType: PublicAppointmentType | null;
  staffMember: PublicStaffMember | null;
  date: string | null;          // "YYYY-MM-DD"
  slot: string | null;          // ISO string
}

export interface BookingResult {
  appointmentId: string;
  confirmationToken: string;
  message: string;
}

// ─── Step Indicator ────────────────────────────────────────────────────────

const STEPS = ['Service & Vet', 'Date & Time', 'Your Info', 'Confirmed'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isConfirm = stepNum === 4;
        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                  ${isCompleted ? 'bg-[#0D7377] text-white' :
                    isActive ? 'bg-[#0D7377] text-white ring-4 ring-teal-100' :
                    'bg-gray-100 text-gray-400'}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium hidden sm:block
                  ${isActive ? 'text-[#0D7377]' : isCompleted ? 'text-gray-500' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-10 sm:w-16 mx-1 transition-colors
                  ${stepNum < currentStep ? 'bg-[#0D7377]' : 'bg-gray-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function BookingPortalPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<BookingSelections>({
    appointmentType: null,
    staffMember: null,
    date: null,
    slot: null,
  });
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // ── Fetch portal data on mount
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/book/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${res.status}`);
        }
        return res.json();
      })
      .then((data: PortalData) => {
        setPortalData(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  // ─────────────────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading booking page…</p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return <BookingErrorState message={error ?? 'Could not load booking page.'} />;
  }

  const { practice, appointmentTypes, staff } = portalData;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {/* Logo circle */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ background: '#0D7377' }}
          >
            {practice.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{practice.name}</p>
            <p className="text-xs text-gray-500">Online Appointment Booking</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {step < 4 && <StepIndicator currentStep={step} />}

        {step === 1 && (
          <BookingStep1TypeStaff
            appointmentTypes={appointmentTypes}
            staff={staff}
            selections={selections}
            onNext={(apptType, staffMember) => {
              setSelections((prev) => ({ ...prev, appointmentType: apptType, staffMember: staffMember }));
              setStep(2);
            }}
          />
        )}

        {step === 2 && selections.appointmentType && selections.staffMember && (
          <BookingStep2DateSlot
            slug={slug}
            selections={selections}
            timezone={practice.timezone}
            onNext={(date, slot) => {
              setSelections((prev) => ({ ...prev, date, slot }));
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <BookingStep3ClientInfo
            slug={slug}
            selections={selections}
            practice={practice}
            onSuccess={(result) => {
              setBookingResult(result);
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && bookingResult && (
          <BookingConfirmation
            result={bookingResult}
            selections={selections}
            practice={practice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Powered by{' '}
        <span className="font-semibold text-[#0D7377]">VetSteady</span>
        {practice.phone && (
          <> · Questions? Call{' '}
            <a href={`tel:${practice.phone}`} className="underline">{practice.phone}</a>
          </>
        )}
      </footer>
    </div>
  );
}
