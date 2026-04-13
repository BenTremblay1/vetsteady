'use client';

import { useState, useEffect, useCallback } from 'react';
import { Appointment, AppointmentStatus } from '@/types';
import DashboardStats from '@/components/dashboard/DashboardStats';
import FullCalendarView from '@/components/calendar/FullCalendarView';
import NewAppointmentModal from '@/components/appointments/NewAppointmentModal';
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newDefaultDate, setNewDefaultDate] = useState<Date | undefined>();
  const [newDefaultHour, setNewDefaultHour] = useState<number | undefined>();
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const today = new Date();

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      // Load 6 weeks around today (2 back, 4 forward)
      const start = new Date(today);
      start.setDate(start.getDate() - 14);
      const end = new Date(today);
      end.setDate(end.getDate() + 28);
      const res = await fetch(
        `/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      setAppointments(data.data ?? []);
    } catch (e) {
      console.error('[dashboard] Failed to load appointments:', e);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleNewSlot = (date: Date, hour: number) => {
    setNewDefaultDate(date);
    setNewDefaultHour(hour);
    setNewModalOpen(true);
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadAppointments();
    } catch (e) {
      console.error('[dashboard] Status update failed:', e);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Header ── */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {today.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => handleNewSlot(new Date(), new Date().getHours())}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0D7377' }}
          >
            + New Appointment
          </button>
        </div>

        {/* ── Stats Widgets ── */}
        <DashboardStats appointments={appointments} loading={loading} />
      </div>

      {/* ── Calendar ── */}
      <div className="h-[calc(100vh-280px)] min-h-[560px]">
        <FullCalendarView
          appointments={appointments}
          loading={loading}
          onNewAppointment={handleNewSlot}
          onAppointmentClick={(appt) => setSelectedAppt(appt)}
        />
      </div>

      {/* ── Modals ── */}
      <NewAppointmentModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={loadAppointments}
        defaultDate={newDefaultDate}
        defaultHour={newDefaultHour}
      />

      <AppointmentDetailModal
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
