'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ReminderRow {
  id: string;
  appointment_id: string;
  channel: 'sms' | 'email';
  reminder_type: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  // Joined
  appointment: {
    id: string;
    starts_at: string;
    status: string;
    client: { first_name: string; last_name: string; phone: string | null; email: string | null } | null;
    pet: { name: string; species: string } | null;
    appointment_type: { name: string } | null;
  } | null;
}

interface StatsData {
  total: number;
  sent: number;
  delivered: number;
  pending: number;
  failed: number;
  confirmRate: string;
  atRiskCount: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const REMINDER_TYPE_LABELS: Record<string, string> = {
  booking_confirm: 'Booking Confirm',
  '2_week': '2 Week',
  '4_day': '4 Day',
  '2_day': '2 Day',
  same_day: 'Same Day',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  sent:      { label: 'Sent',      color: '#3B82F6', bg: '#EFF6FF', icon: MessageSquare },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  failed:    { label: 'Failed',    color: '#EF4444', bg: '#FEE2E2', icon: XCircle },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getRiskLevel(appt: ReminderRow['appointment'], reminders: ReminderRow[]): 'confirmed' | 'at-risk' | 'unknown' {
  if (!appt) return 'unknown';
  if (appt.status === 'confirmed') return 'confirmed';

  // Check if any reminder was delivered for this appointment
  const apptReminders = reminders.filter((r) => r.appointment_id === appt.id);
  const hasDelivered = apptReminders.some((r) => r.status === 'delivered');
  if (hasDelivered && appt.status === 'scheduled') return 'at-risk';
  return 'unknown';
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Appointment Risk Badge ─────────────────────────────────────────────────

function RiskBadge({ level }: { level: 'confirmed' | 'at-risk' | 'unknown' }) {
  if (level === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50">
        <CheckCircle size={10} /> Confirmed
      </span>
    );
  }
  if (level === 'at-risk') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-amber-700 bg-amber-50">
        <AlertTriangle size={10} /> At Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 bg-gray-100">
      <Clock size={10} /> Pending
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'delivered' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/reminders');
      if (!res.ok) throw new Error('Failed to load reminders');
      const data = await res.json();
      setReminders(data.reminders ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[reminders] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // ─── Derived stats ──────────────────────────────────────────────────────

  const stats: StatsData = {
    total: reminders.length,
    sent: reminders.filter((r) => r.status === 'sent').length,
    delivered: reminders.filter((r) => r.status === 'delivered').length,
    pending: reminders.filter((r) => r.status === 'pending').length,
    failed: reminders.filter((r) => r.status === 'failed').length,
    confirmRate: '—',
    atRiskCount: 0,
  };

  // "Confirmed" = appointment status confirmed (client replied YES)
  const confirmedAppts = new Set(
    reminders
      .filter((r) => r.appointment?.status === 'confirmed')
      .map((r) => r.appointment_id)
  );
  // "At risk" = reminder delivered but appointment still scheduled (no reply)
  const atRiskAppts = new Set(
    reminders
      .filter(
        (r) =>
          r.status === 'delivered' &&
          r.appointment?.status === 'scheduled' &&
          !confirmedAppts.has(r.appointment_id)
      )
      .map((r) => r.appointment_id)
  );

  const uniqueAppts = new Set(reminders.map((r) => r.appointment_id));
  stats.confirmRate =
    uniqueAppts.size > 0
      ? `${((confirmedAppts.size / uniqueAppts.size) * 100).toFixed(0)}%`
      : '—';
  stats.atRiskCount = atRiskAppts.size;

  // ─── Filtered list ──────────────────────────────────────────────────────

  const filtered = reminders.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (typeFilter !== 'all' && r.reminder_type !== typeFilter) return false;
    return true;
  });

  // Unique reminder types for filter
  const reminderTypes = Array.from(new Set(reminders.map((r) => r.reminder_type)));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminder Status</h1>
          <p className="text-sm text-gray-500 mt-1">
            SMS & email delivery tracking · Last updated {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Confirm Rate"
          value={stats.confirmRate}
          sub={`${confirmedAppts.size} clients confirmed`}
          color="#10B981"
          icon={CheckCircle}
        />
        <StatCard
          label="At Risk"
          value={stats.atRiskCount}
          sub="reminded, no reply"
          color="#F59E0B"
          icon={AlertTriangle}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          sub={`of ${stats.total} reminders`}
          color="#3B82F6"
          icon={MessageSquare}
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          sub="delivery failures"
          color="#EF4444"
          icon={XCircle}
        />
      </div>

      {/* At-Risk Appointments Panel */}
      {atRiskAppts.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              {atRiskAppts.size} appointment{atRiskAppts.size > 1 ? 's' : ''} at risk — reminder sent, no reply
            </h2>
          </div>
          <div className="space-y-2">
            {reminders
              .filter(
                (r) =>
                  atRiskAppts.has(r.appointment_id) &&
                  r.status === 'delivered' &&
                  r.appointment
              )
              .reduce((acc: ReminderRow[], r) => {
                if (!acc.find((x) => x.appointment_id === r.appointment_id)) acc.push(r);
                return acc;
              }, [])
              .slice(0, 5)
              .map((r) => (
                <div
                  key={r.appointment_id}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-800">
                    {r.appointment?.client?.first_name} {r.appointment?.client?.last_name}
                  </span>
                  <span className="text-gray-500">
                    {r.appointment?.pet?.name} · {r.appointment?.starts_at ? formatDate(r.appointment.starts_at) : ''}
                  </span>
                  <span className="text-amber-600 font-medium text-xs">No reply</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status filter */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'pending', 'sent', 'delivered', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? `All (${reminders.length})` : `${s} (${reminders.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Type filter */}
        {reminderTypes.length > 1 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All types</option>
            {reminderTypes.map((t) => (
              <option key={t} value={t}>
                {REMINDER_TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading && reminders.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Loading reminders…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reminders match this filter</p>
          <p className="text-sm text-gray-400 mt-1">
            Reminders are sent automatically when appointments are booked.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Client / Pet
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Appointment
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Channel
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Appt Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const riskLevel = r.appointment?.status === 'confirmed'
                    ? 'confirmed'
                    : atRiskAppts.has(r.appointment_id)
                      ? 'at-risk'
                      : 'unknown';

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      {/* Client / Pet */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {r.appointment?.client?.first_name} {r.appointment?.client?.last_name}
                        </p>
                        {r.appointment?.pet && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            🐾 {r.appointment.pet.name}
                          </p>
                        )}
                      </td>

                      {/* Appointment info */}
                      <td className="px-4 py-3">
                        <p className="text-gray-700">
                          {r.appointment?.appointment_type?.name ?? '—'}
                        </p>
                        {r.appointment?.starts_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDateTime(r.appointment.starts_at)}
                          </p>
                        )}
                      </td>

                      {/* Reminder type */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                          {REMINDER_TYPE_LABELS[r.reminder_type] ?? r.reminder_type}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-medium uppercase">
                          {r.channel === 'sms' ? '📱 SMS' : '📧 Email'}
                        </span>
                      </td>

                      {/* Reminder status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                        {r.error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate" title={r.error_message}>
                            {r.error_message}
                          </p>
                        )}
                      </td>

                      {/* Appointment risk */}
                      <td className="px-4 py-3">
                        <RiskBadge level={riskLevel} />
                      </td>

                      {/* Sent at */}
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {r.sent_at ? formatDateTime(r.sent_at) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Row count footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
            Showing {filtered.length} of {reminders.length} reminders
          </div>
        </div>
      )}
    </div>
  );
}
