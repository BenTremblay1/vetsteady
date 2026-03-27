'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Clock, Tag, Plus, Trash2 } from 'lucide-react';
import { AppointmentType, PracticeSettings } from '@/types';

// ─── Settings Page ───────────────────────────────────────────────────────────
// Allows admins to configure: reminder timing, appointment types, practice info.

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'reminders' | 'types' | 'practice'>('reminders');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your practice preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'reminders', label: '🔔 Reminders' },
          { id: 'types',     label: '📋 Appt Types' },
          { id: 'practice',  label: '🏥 Practice' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reminders' && <ReminderSettings />}
      {activeTab === 'types' && <AppointmentTypesSettings />}
      {activeTab === 'practice' && <PracticeInfoSettings />}
    </div>
  );
}

// ─── Reminder Settings ────────────────────────────────────────────────────────

function ReminderSettings() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<PracticeSettings['reminder_timing']>({
    booking_confirm: true,
    two_week: true,
    four_day: true,
    two_day: true,
    same_day: false,
  });

  const handleSave = async () => {
    setSaving(true);
    // In production: PATCH /api/v1/practice { settings: { reminder_timing: settings } }
    await new Promise((r) => setTimeout(r, 600)); // simulate save
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const reminders: Array<{ key: keyof NonNullable<PracticeSettings['reminder_timing']>; label: string; desc: string }> = [
    { key: 'booking_confirm', label: 'Booking Confirmation',  desc: 'Sent immediately when appointment is created' },
    { key: 'two_week',        label: '2-Week Reminder',       desc: '14 days before the appointment' },
    { key: 'four_day',        label: '4-Day Reminder',        desc: '4 days before the appointment' },
    { key: 'two_day',         label: '2-Day Reminder',        desc: '2 days before — highest impact' },
    { key: 'same_day',        label: 'Same-Day Reminder',     desc: 'Morning of the appointment (use sparingly)' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
      <div className="p-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bell size={16} className="text-gray-400" />
          SMS Reminder Schedule
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose which reminders fire automatically for every appointment.
        </p>
      </div>

      {reminders.map((r) => (
        <div key={r.key} className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-gray-900">{r.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings?.[r.key] ?? false}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev!, [r.key]: e.target.checked }))
              }
              disabled={r.key === 'booking_confirm'} // always on
            />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-disabled:opacity-50" style={{ '--tw-bg-opacity': '1' } as React.CSSProperties} />
          </label>
        </div>
      ))}

      <div className="p-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: '#0D7377' }}
        >
          <Save size={14} />
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ─── Appointment Types Settings ───────────────────────────────────────────────

function AppointmentTypesSettings() {
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newColor, setNewColor] = useState('#10B981');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/appointment-types');
      const json = await res.json();
      setTypes(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/appointment-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          duration_minutes: newDuration,
          color: newColor,
          allow_online_booking: true,
          requires_deposit: false,
          deposit_amount_cents: 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setNewName('');
      setNewDuration(30);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const colorOptions = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#0D7377', '#EC4899'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
      <div className="p-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Tag size={16} className="text-gray-400" />
          Appointment Types
        </h2>
        <p className="text-sm text-gray-500 mt-1">Define visit types with durations and colors.</p>
      </div>

      {/* Existing types */}
      {loading ? (
        <div className="p-5 text-sm text-gray-400">Loading…</div>
      ) : types.length === 0 ? (
        <div className="p-5 text-sm text-gray-400">No appointment types yet. Add one below.</div>
      ) : (
        types.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-sm font-medium text-gray-900">{t.name}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} />{t.duration_minutes} min
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {t.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))
      )}

      {/* Add new */}
      <div className="p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add Type</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Wellness Exam"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 w-40"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
            <input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(parseInt(e.target.value) || 30)}
              min={5}
              step={5}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 w-24"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
            <div className="flex gap-1.5">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#0D7377' }}
          >
            <Plus size={14} />
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}

// ─── Practice Info Settings ───────────────────────────────────────────────────

function PracticeInfoSettings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    timezone: 'America/New_York',
  });

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Vancouver',
  ];

  const handleSave = async () => {
    // In production: PATCH /api/v1/practice
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Practice Information</h2>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Practice Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Happy Paws Veterinary"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 max-w-sm"
          style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="max-w-xs">
        <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
        <select
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
          style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0D7377' }}
        >
          <Save size={14} />
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
