'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, MessageSquare, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { Appointment } from '@/types';

// ─── Reports Page ─────────────────────────────────────────────────────────────
// Surfaces actionable no-show data — the core value prop of VetSteady.

export default function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load last 90 days
      const start = new Date();
      start.setDate(start.getDate() - 90);
      const end = new Date();
      const res = await fetch(
        `/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const json = await res.json();
      setAppointments(json.data ?? []);
    } catch (e) {
      console.error('[reports] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Derived metrics ──────────────────────────────────────────────────────
  const total = appointments.length;
  const noShows = appointments.filter((a) => a.status === 'no_show').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  const noShowRate = total > 0 ? ((noShows / total) * 100).toFixed(1) : '—';
  const confirmRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '—';

  // Revenue impact: industry avg $250/appointment, 11% baseline no-show rate
  const baselineNoShows = Math.round(total * 0.11);
  const savedNoShows = Math.max(0, baselineNoShows - noShows);
  const savedRevenue = savedNoShows * 250;

  // Monthly breakdown (last 3 months)
  const monthlyBreakdown = buildMonthlyBreakdown(appointments);

  // Top no-show clients
  const clientNoShows = buildClientNoShows(appointments);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Last 90 days · {total} appointments</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading data…</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'No-show Rate',
                value: `${noShowRate}%`,
                sub: 'Industry avg: 11%',
                color: '#EF4444',
                icon: XCircle,
              },
              {
                label: 'Confirm Rate',
                value: `${confirmRate}%`,
                sub: `${confirmed} confirmed`,
                color: '#10B981',
                icon: CheckCircle,
              },
              {
                label: 'Revenue Saved',
                value: savedRevenue > 0 ? `$${savedRevenue.toLocaleString()}` : '$0',
                sub: `vs 11% baseline`,
                color: '#0D7377',
                icon: TrendingDown,
              },
              {
                label: 'SMS Confirmations',
                value: confirmed.toString(),
                sub: 'replies captured',
                color: '#8B5CF6',
                icon: MessageSquare,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-gray-400" />
              Appointment Status Breakdown
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Confirmed',  count: confirmed, color: '#10B981' },
                { label: 'Completed',  count: completed, color: '#3B82F6' },
                { label: 'Scheduled',  count: appointments.filter(a => a.status === 'scheduled').length, color: '#F59E0B' },
                { label: 'Cancelled',  count: cancelled,  color: '#6B7280' },
                { label: 'No-show',    count: noShows,    color: '#EF4444' },
              ].map((row) => {
                const pct = total > 0 ? (row.count / total) * 100 : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-gray-600">{row.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: row.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{row.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Breakdown */}
          {monthlyBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Summary</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-semibold text-gray-400">Month</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-400">Total</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-400">No-shows</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-400">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthlyBreakdown.map((m) => (
                    <tr key={m.label}>
                      <td className="py-2 text-gray-700">{m.label}</td>
                      <td className="py-2 text-right text-gray-500">{m.total}</td>
                      <td className="py-2 text-right">
                        <span className={m.noShows > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}>
                          {m.noShows}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {m.total > 0 ? `${((m.noShows / m.total) * 100).toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top No-show Clients */}
          {clientNoShows.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Repeat No-shows</h2>
              <div className="space-y-2">
                {clientNoShows.slice(0, 5).map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{c.name}</span>
                    <span className="text-sm font-semibold text-red-500">{c.count}x no-show</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {total === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <BarChart2 size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No appointment data yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Reports will populate as appointments are booked and completed.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMonthlyBreakdown(appointments: Appointment[]) {
  const map: Record<string, { label: string; total: number; noShows: number }> = {};

  for (const a of appointments) {
    const d = new Date(a.starts_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!map[key]) map[key] = { label, total: 0, noShows: 0 };
    map[key].total++;
    if (a.status === 'no_show') map[key].noShows++;
  }

  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

function buildClientNoShows(appointments: Appointment[]) {
  const map: Record<string, { name: string; count: number }> = {};

  for (const a of appointments) {
    if (a.status !== 'no_show') continue;
    const client = a.client;
    if (!client) continue;
    const name = `${client.first_name} ${client.last_name}`;
    if (!map[name]) map[name] = { name, count: 0 };
    map[name].count++;
  }

  return Object.values(map).sort((a, b) => b.count - a.count);
}
