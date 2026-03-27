'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Users,
  UserCheck,
  TrendingDown,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekPoint {
  label: string;
  signups: number;
  cumulative: number;
}

interface LaunchData {
  mrr: number;
  payingCount: number;
  totalSignups: number;
  newSignups30d: number;
  activeThisWeek: number;
  churnRate: number;
  trialToPaid: number | null;
  nps: number | null;
  weeklyGrowth: WeekPoint[];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

function StatCard({ label, value, sub, color, icon: Icon, trend, trendLabel }: StatCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center gap-1.5">
        {trend && (
          <TrendIcon size={12} style={{ color: trendColor }} />
        )}
        <p className="text-xs text-gray-500">{sub}</p>
        {trendLabel && (
          <span className="text-xs font-semibold" style={{ color: trendColor }}>{trendLabel}</span>
        )}
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#0D7377' }: { data: number[]; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const h = 40;
  const w = 100;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── NPS Badge ────────────────────────────────────────────────────────────────

function NpsBadge({ nps }: { nps: number | null }) {
  if (nps === null) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">NPS Score</p>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50">
            <Star size={15} className="text-amber-400" />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-300 mb-1">—</p>
        <p className="text-xs text-gray-400">Survey not yet collected</p>
        <p className="text-xs text-gray-400 mt-1">Send via Resend quarterly · Target: 40+</p>
      </div>
    );
  }

  const color = nps >= 50 ? '#10B981' : nps >= 30 ? '#F59E0B' : '#EF4444';
  const label = nps >= 50 ? 'Excellent' : nps >= 30 ? 'Good' : nps >= 0 ? 'Needs work' : 'Critical';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">NPS Score</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Star size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color }}>{nps > 0 ? `+${nps}` : nps}</p>
      <p className="text-xs text-gray-500">{label} · Target: 40+</p>
    </div>
  );
}

// ─── Weekly Growth Chart ──────────────────────────────────────────────────────

function WeeklyGrowthChart({ data }: { data: WeekPoint[] }) {
  if (data.length === 0) return null;

  const maxCumulative = Math.max(...data.map((d) => d.cumulative), 1);
  const maxSignups = Math.max(...data.map((d) => d.signups), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <BarChart2 size={15} className="text-gray-400" />
        Signup Growth (last 8 weeks)
      </h2>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-24 mb-2">
        {data.map((week) => {
          const barH = maxSignups > 0 ? (week.signups / maxSignups) * 100 : 0;
          return (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {week.signups} new · {week.cumulative} total
              </div>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(barH, week.signups > 0 ? 4 : 0)}%`,
                  backgroundColor: '#0D7377',
                  opacity: 0.8,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show every other one to avoid crowding */}
      <div className="flex gap-1 mb-3">
        {data.map((week, i) => (
          <div key={week.label} className="flex-1 text-center">
            {i % 2 === 0 && (
              <span className="text-[9px] text-gray-400">{week.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Cumulative sparkline */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Cumulative signups</p>
        <Sparkline data={data.map((d) => d.cumulative)} />
        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
          <span>{data[0]?.label}</span>
          <span className="font-semibold text-gray-700">{data[data.length - 1]?.cumulative} total</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Targets Table ────────────────────────────────────────────────────────────

function TargetsTable({ data }: { data: LaunchData }) {
  const targets = [
    {
      metric: 'MRR',
      current: data.mrr > 0 ? `$${data.mrr.toLocaleString()}` : '$0',
      month1: '$990',
      month3: '$4,950',
      onTrack: data.mrr >= 990,
      hasData: data.mrr > 0,
    },
    {
      metric: 'Paying practices',
      current: `${data.payingCount}`,
      month1: '10',
      month3: '50',
      onTrack: data.payingCount >= 10,
      hasData: data.payingCount > 0,
    },
    {
      metric: 'Active this week',
      current: `${data.activeThisWeek}`,
      month1: '5',
      month3: '40',
      onTrack: data.activeThisWeek >= 5,
      hasData: true,
    },
    {
      metric: 'Monthly churn',
      current: `${data.churnRate}%`,
      month1: '<10%',
      month3: '<5%',
      onTrack: data.churnRate < 10,
      hasData: data.payingCount > 0,
    },
    {
      metric: 'Trial → Paid',
      current: data.trialToPaid !== null ? `${data.trialToPaid}%` : '—',
      month1: '30%',
      month3: '40%',
      onTrack: (data.trialToPaid ?? 0) >= 30,
      hasData: data.trialToPaid !== null,
    },
    {
      metric: 'NPS',
      current: data.nps !== null ? (data.nps >= 0 ? `+${data.nps}` : `${data.nps}`) : '—',
      month1: '>20',
      month3: '>40',
      onTrack: (data.nps ?? 0) >= 20,
      hasData: data.nps !== null,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Launch Targets vs Actuals</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-2 text-xs font-semibold text-gray-400">Metric</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400">Now</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400">Month 1 target</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400">Month 3 target</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {targets.map((t) => (
              <tr key={t.metric}>
                <td className="py-2 text-gray-700 font-medium">{t.metric}</td>
                <td className="py-2 text-right font-mono text-gray-900">{t.current}</td>
                <td className="py-2 text-right text-gray-400">{t.month1}</td>
                <td className="py-2 text-right text-gray-400">{t.month3}</td>
                <td className="py-2 text-right">
                  {!t.hasData ? (
                    <span className="text-xs text-gray-300 italic">no data</span>
                  ) : t.onTrack ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                      ✓ On track
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 rounded-full px-2 py-0.5">
                      ✗ Behind
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LaunchDashboardPage() {
  const [data, setData] = useState<LaunchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/launch');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('[launch-dashboard] load failed:', e);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Launch Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            SaaS business metrics — MRR, signups, churn, NPS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Monthly Recurring Revenue"
              value={data.mrr > 0 ? `$${data.mrr.toLocaleString()}` : '$0'}
              sub={data.payingCount > 0 ? `${data.payingCount} paying practices` : 'No paid plans yet'}
              color="#0D7377"
              icon={DollarSign}
              trend={data.mrr > 0 ? 'up' : 'neutral'}
              trendLabel={data.mrr > 0 ? `· target $990` : undefined}
            />
            <StatCard
              label="Total Signups"
              value={String(data.totalSignups ?? 0)}
              sub={`+${data.newSignups30d} in last 30 days`}
              color="#8B5CF6"
              icon={Users}
              trend={data.newSignups30d > 0 ? 'up' : 'neutral'}
              trendLabel={data.newSignups30d > 0 ? `this month` : undefined}
            />
            <StatCard
              label="Active This Week"
              value={String(data.activeThisWeek)}
              sub="practices used VetSteady"
              color="#10B981"
              icon={UserCheck}
              trend={data.activeThisWeek > 0 ? 'up' : 'neutral'}
            />
            <StatCard
              label="Monthly Churn"
              value={`${data.churnRate}%`}
              sub={data.payingCount > 0 ? 'of paid plans cancelled' : 'No paid plans yet'}
              color={data.churnRate > 10 ? '#EF4444' : '#F59E0B'}
              icon={TrendingDown}
              trend={data.churnRate === 0 ? 'neutral' : data.churnRate < 5 ? 'up' : 'down'}
              trendLabel={data.churnRate < 5 ? '· target <5%' : '· target <5%'}
            />
          </div>

          {/* ── Secondary row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1">
              <NpsBadge nps={data.nps} />
            </div>

            <div className="col-span-2 md:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trial → Paid</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
                  <ArrowUpRight size={15} className="text-indigo-500" />
                </div>
              </div>
              {data.trialToPaid !== null ? (
                <>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{data.trialToPaid}%</p>
                  <p className="text-xs text-gray-500">trials converted · target 40%</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-300 mb-1">—</p>
                  <p className="text-xs text-gray-400">No trial data yet (60-day window)</p>
                </>
              )}
            </div>

            {/* Activation rate */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Activation Rate</p>
              {data.totalSignups > 0 ? (
                <>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {Math.round((data.activeThisWeek / data.totalSignups) * 100)}%
                    </span>
                    <span className="text-sm text-gray-500 mb-1">of all signups active this week</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((data.activeThisWeek / data.totalSignups) * 100, 100)}%`,
                        backgroundColor: '#0D7377',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>{data.activeThisWeek} active</span>
                    <span>{data.totalSignups} total signed up</span>
                  </div>
                </>
              ) : (
                <p className="text-3xl font-bold text-gray-300">—</p>
              )}
            </div>
          </div>

          {/* ── Growth chart + targets ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeeklyGrowthChart data={data.weeklyGrowth} />
            <TargetsTable data={data} />
          </div>

          {/* ── Action items ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-amber-800 mb-3">📋 Launch Actions</h2>
            <ul className="space-y-1.5 text-sm text-amber-700">
              {data.nps === null && (
                <li>• <strong>NPS:</strong> Send your first quarterly survey via Resend to beta users</li>
              )}
              {data.mrr === 0 && (
                <li>• <strong>MRR:</strong> Connect Stripe webhook → populate <code className="text-xs bg-amber-100 px-1 rounded">subscriptions</code> table (see <code className="text-xs bg-amber-100 px-1 rounded">docs/DEPLOYMENT.md</code>)</li>
              )}
              {data.activeThisWeek < 5 && (
                <li>• <strong>Activation:</strong> Reach out to beta practices — only {data.activeThisWeek} active this week. Use beta-outreach-emails.md templates.</li>
              )}
              {data.totalSignups < 10 && (
                <li>• <strong>Growth:</strong> {data.totalSignups}/10 beta signups. Run reddit-community-strategy.md plan.</li>
              )}
              {data.mrr > 0 && data.churnRate > 10 && (
                <li>• <strong>Churn:</strong> {data.churnRate}% churn is above 10% target. Review UX friction points.</li>
              )}
              {data.mrr > 0 && data.churnRate <= 5 && data.totalSignups >= 10 && (
                <li className="text-emerald-700">✓ <strong>All key metrics on track!</strong> Keep pushing growth channels.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
