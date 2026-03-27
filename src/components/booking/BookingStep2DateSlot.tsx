'use client';

import { useEffect, useState, useCallback } from 'react';
import type { BookingSelections } from '@/app/book/[slug]/page';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  // "YYYY-MM-DD" → "Monday, March 25"
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  slug: string;
  selections: BookingSelections;
  timezone: string;
  onNext: (date: string, slot: string) => void;
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function BookingStep2DateSlot({ slug, selections, timezone, onNext, onBack }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(selections.date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selections.slot);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const duration = selections.appointmentType?.duration_minutes ?? 30;
  const staffId = selections.staffMember?.id === 'any' ? null : selections.staffMember?.id;

  // Build week days (Mon–Sat)
  const weekDays = DAY_LABELS.map((_, i) => addDays(weekStart, i));

  // Fetch slots when date or staff changes
  const fetchSlots = useCallback(async (date: string) => {
    if (!staffId) {
      // "Any" staff — we'd need to aggregate; for now show a simplified message
      setSlots([]);
      setSlotsError('Please go back and select a specific vet to view available slots.');
      return;
    }
    setLoadingSlots(true);
    setSlotsError(null);
    setSlots([]);
    try {
      const res = await fetch(
        `/api/book/${slug}/slots?date=${date}&staff_id=${staffId}&duration=${duration}`
      );
      if (!res.ok) throw new Error('Could not load available times.');
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch (e: any) {
      setSlotsError(e.message ?? 'Failed to load slots.');
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, staffId, duration]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
      setSelectedSlot(null);
    }
  }, [selectedDate, fetchSlots]);

  function handlePrevWeek() {
    const prev = addDays(weekStart, -7);
    if (prev < today) {
      setWeekStart(getMonday(today));
    } else {
      setWeekStart(prev);
    }
  }

  function handleNextWeek() {
    setWeekStart(addDays(weekStart, 7));
  }

  function handleDateSelect(d: Date) {
    if (d < today) return;
    if (d.getDay() === 0) return; // no Sundays
    setSelectedDate(toDateString(d));
  }

  function handleNext() {
    if (selectedDate && selectedSlot) {
      onNext(selectedDate, selectedSlot);
    }
  }

  const weekEnd = addDays(weekStart, 6);
  const monthLabel = weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pick a date</h2>
            <p className="text-sm text-gray-500">{monthLabel}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {weekDays.map((d, i) => {
            const dateStr = toDateString(d);
            const isPast = d < today;
            const isSunday = d.getDay() === 0;
            const isDisabled = isPast || isSunday;
            const isSelected = dateStr === selectedDate;
            const isToday = toDateString(d) === toDateString(today);

            return (
              <button
                key={i}
                onClick={() => handleDateSelect(d)}
                disabled={isDisabled}
                className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all text-center
                  ${isDisabled
                    ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                    : isSelected
                      ? 'border-[#0D7377] bg-teal-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <span className="text-xs text-gray-500 font-medium">{DAY_LABELS[i]}</span>
                <span className={`text-sm font-bold mt-1 ${isSelected ? 'text-[#0D7377]' : isDisabled ? 'text-gray-300' : 'text-gray-800'}`}>
                  {d.getDate()}
                </span>
                {isToday && !isDisabled && (
                  <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-[#0D7377]' : 'bg-gray-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Available times
          </h2>
          <p className="text-sm text-gray-500 mb-4">{formatDate(selectedDate)}</p>

          {loadingSlots ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <div className="w-4 h-4 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
              Loading available times…
            </div>
          ) : slotsError ? (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
              {slotsError}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">😔</p>
              <p className="font-medium text-gray-700">No available slots</p>
              <p className="text-gray-500 mt-1">Try another date or vet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => {
                const isSelected = slot === selectedSlot;
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all
                      ${isSelected
                        ? 'border-[#0D7377] bg-teal-50 text-[#0D7377] shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                      }`}
                  >
                    {formatSlotTime(slot)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary pill */}
      {selectedDate && selectedSlot && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            <strong>{formatDate(selectedDate)}</strong> at <strong>{formatSlotTime(selectedSlot)}</strong>
            {' '}({duration} min)
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedDate || !selectedSlot}
          className={`flex-2 flex-1 py-3 rounded-xl font-semibold text-sm transition-all
            ${selectedDate && selectedSlot
              ? 'bg-[#0D7377] text-white hover:bg-teal-800 shadow-sm hover:shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          Enter your info →
        </button>
      </div>
    </div>
  );
}
