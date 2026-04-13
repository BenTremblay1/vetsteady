'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Clock, Tag, Plus, Trash2, Plug, Stethoscope, UserPlus, Link, Copy, Check } from 'lucide-react';
import { AppointmentType, PracticeSettings, Staff, StaffInvite } from '@/types';
import dynamic from 'next/dynamic';

// ─── Settings Page ───────────────────────────────────────────────────────────
// Allows admins to configure: reminder timing, appointment types, practice info.

// Lazy-load the integrations panel (avoids SSR for API calls)
const IntegrationsSettings = dynamic(() => import('@/components/settings/IntegrationsSettings'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded" />
      <div className="h-4 w-72 bg-gray-100 rounded" />
    </div>
  ),
});

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'reminders' | 'types' | 'practice' | 'staff' | 'integrations'>('reminders');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your practice preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'reminders',     label: '🔔 Reminders' },
          { id: 'types',         label: '📋 Appt Types' },
          { id: 'practice',      label: '🏥 Practice' },
          { id: 'staff',          label: '👥 Staff' },
          { id: 'integrations',  label: '🔌 Integrations' },
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
      {activeTab === 'staff' && <StaffSettings />}
      {activeTab === 'integrations' && <IntegrationsSettings />}
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [practice, setPractice] = useState<{
    id: string;
    name: string;
    slug: string;
    phone: string;
    email: string;
    timezone: string;
    allow_online_booking: boolean;
  } | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    timezone: 'America/New_York',
    allow_online_booking: true,
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

  // Load practice data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/practice');
        const json = await res.json();
        if (json.data) {
          setPractice(json.data);
          setForm({
            name: json.data.name ?? '',
            phone: json.data.phone ?? '',
            email: json.data.email ?? '',
            timezone: json.data.timezone ?? 'America/New_York',
            allow_online_booking: json.data.allow_online_booking ?? true,
          });
        }
      } catch (e) {
        console.error('[PracticeInfoSettings] load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/practice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.data) {
        setPractice(json.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(json.error ?? 'Failed to save');
      }
    } catch (e) {
      setError('Failed to save practice info');
    } finally {
      setSaving(false);
    }
  };

  const bookingUrl = practice?.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${practice.slug}`
    : null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">Practice Information</h2>
        <p className="text-xs text-gray-500 mt-0.5">Update your clinic's contact details</p>
      </div>

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

      {/* Public Booking URL — highlighted section */}
      {bookingUrl && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-800 mb-1">Public Booking URL</p>
              <p className="text-sm text-emerald-700 font-mono break-all">{bookingUrl}</p>
              <p className="text-xs text-emerald-600 mt-1">
                Share this link with your clients so they can book appointments online.
              </p>
            </div>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0D7377' }}
            >
              Open ↗
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#0D7377' }}
        >
          <Save size={14} />
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

// ─── Staff Settings ───────────────────────────────────────────────────────────

function StaffSettings() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Staff['role']>('vet');

  // Invites
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [inviteRole, setInviteRole] = useState<'vet' | 'receptionist' | 'admin'>('vet');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadInvites = async () => {
    try {
      const res = await fetch('/api/v1/staff/invite');
      if (res.ok) {
        const json = await res.json();
        setInvites(json.data ?? []);
      }
    } catch (e) {
      console.error('[staff invites] load failed', e);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    setNewInviteUrl(null);
    try {
      const res = await fetch('/api/v1/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate invite');
      setNewInviteUrl(json.data.invite_url);
      await loadInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopy = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/staff');
      const json = await res.json();
      setStaff(json.data ?? []);
    } catch (e) {
      console.error('[staff settings] load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); loadInvites(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), role: newRole, is_bookable: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to add staff member');
      setStaff((prev) => [...prev, json.data]);
      setNewName('');
      setNewRole('vet');
      setShowAdd(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBookable(s: Staff) {
    try {
      const res = await fetch('/api/v1/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, is_bookable: !s.is_bookable }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update');
      setStaff((prev) => prev.map((st) => st.id === s.id ? { ...st, is_bookable: !st.is_bookable } : st));
    } catch (e: any) {
      console.error('[staff settings] toggle failed', e);
    }
  }

  async function handleDelete(s: Staff) {
    if (!confirm(`Remove ${s.name} from the practice?`)) return;
    try {
      const res = await fetch('/api/v1/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to remove');
      setStaff((prev) => prev.filter((st) => st.id !== s.id));
    } catch (e: any) {
      console.error('[staff settings] delete failed', e);
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin', vet: 'Veterinarian', vet_tech: 'Vet Tech', receptionist: 'Receptionist',
  };
  const ROLE_ICONS: Record<string, string> = {
    admin: '🛡️', vet: '🩺', vet_tech: '💉', receptionist: '📋',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Stethoscope size={16} className="text-[#0D7377]" />
            Staff Members
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0D7377' }}
        >
          <UserPlus size={14} />
          Add Staff
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input required value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as Staff['role'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
                style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}>
                <option value="vet">Veterinarian</option>
                <option value="vet_tech">Vet Tech</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowAdd(false); setError(null); }}
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: '#0D7377' }}>
              {saving ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading staff…</div>
      ) : staff.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">No staff yet. Add your first team member above.</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: '#0D7377' }}>{s.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                <p className="text-xs text-gray-400">{ROLE_ICONS[s.role] ?? '👤'} {ROLE_LABELS[s.role] ?? s.role}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <span className="text-xs text-gray-500">Bookable</span>
                <div onClick={() => handleToggleBookable(s)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${s.is_bookable ? 'bg-[#0D7377]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.is_bookable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
              <button onClick={() => handleDelete(s)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Remove staff member"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ── Team Invites ── */}
      <div className="border-t border-gray-100 px-6 py-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={14} className="text-[#0D7377]" />
            Invite Team Member
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Generate a one-time link to invite staff to your practice.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': '#0D7377' } as React.CSSProperties}
            >
              <option value="vet">Veterinarian</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={handleGenerateInvite}
            disabled={generatingInvite}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white mt-4 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#0D7377' }}
          >
            <Link size={13} />
            {generatingInvite ? 'Generating…' : 'Generate Invite Link'}
          </button>
        </div>

        {newInviteUrl && (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            <span className="flex-1 text-xs font-mono text-teal-800 truncate">{newInviteUrl}</span>
            <button
              onClick={() => handleCopy(newInviteUrl, 'new')}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              {copiedToken === 'new' ? <Check size={13} /> : <Copy size={13} />}
              {copiedToken === 'new' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {invites.filter((inv) => !inv.used).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Invites</p>
            {invites.filter((inv) => !inv.used).map((inv) => {
              const invUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inv.token}`;
              return (
                <div key={inv.token} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 capitalize">{ROLE_LABELS[inv.role] ?? inv.role}</span>
                  <span className="flex-1 text-xs font-mono text-gray-400 truncate">{invUrl}</span>
                  <button
                    onClick={() => handleCopy(invUrl, inv.token)}
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    {copiedToken === inv.token ? <Check size={13} /> : <Copy size={13} />}
                    {copiedToken === inv.token ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
