'use client';

import { useMemo } from 'react';
import { Appointment } from '@/types';
import { CalendarCheck2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  appointments: Appointment[];
  loading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bgColor,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">
          {label}
        </p>
        {loading ? (
          <div className="mt-1.5 h-7 w-16 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold mt-0.5 leading-none" style={{ color }}>
            {value}
          </p>
        )}
        {sub && !loading && (
          <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardStats({ appointments, loading }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    // Today's appointments
    const todayAppts = appointments.filter(
      (a) => new Date(a.starts_at).toDateString() === todayStr
    );
    const confirmedToday = todayAppts.filter((a) => a.status === 'confirmed').length;

    // Confirmation rate (today)
    const confirmRate =
      todayAppts.length > 0
        ? Math.round((confirmedToday / todayAppts.length) * 100)
        : null;

    // At-risk: appointments that are 'scheduled' (not yet confirmed) and start within 48h
    const cutoff48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const atRisk = appointments.filter((a) => {
      const start = new Date(a.starts_at);
      return a.status === 'scheduled' && start > now && start <= cutoff48h;
    });

    // No-shows this month
    const noShowsMonth = appointments.filter((a) => {
      const d = new Date(a.starts_at);
      return (
        a.status === 'no_show' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      todayCount: todayAppts.length,
      confirmedToday,
      confirmRate,
      atRiskCount: atRisk.length,
      noShowsMonth,
    };
  }, [appointments]);

  const cards = [
    {
      label: "Today's Appointments",
      value: stats.todayCount,
      sub: stats.confirmedToday > 0 ? `${stats.confirmedToday} confirmed` : 'None confirmed yet',
      icon: CalendarCheck2,
      color: '#0D7377',
      bgColor: '#E6F4F5',
    },
    {
      label: 'Confirmation Rate',
      value: stats.confirmRate !== null ? `${stats.confirmRate}%` : '—',
      sub: stats.confirmRate !== null
        ? stats.confirmRate >= 80
          ? 'Great — well above target'
          : stats.confirmRate >= 60
          ? 'Moderate — room to improve'
          : 'Low — send manual follow-ups'
        : 'No appointments today',
      icon: TrendingUp,
      color: stats.confirmRate !== null && stats.confirmRate >= 80
        ? '#10B981'
        : stats.confirmRate !== null && stats.confirmRate >= 60
        ? '#F59E0B'
        : '#6B7280',
      bgColor: stats.confirmRate !== null && stats.confirmRate >= 80
        ? '#ECFDF5'
        : stats.confirmRate !== null && stats.confirmRate >= 60
        ? '#FFFBEB'
        : '#F9FAFB',
    },
    {
      label: 'At-Risk (48 h)',
      value: stats.atRiskCount,
      sub:
        stats.atRiskCount === 0
          ? 'All upcoming confirmed ✓'
          : stats.atRiskCount === 1
          ? '1 appointment unconfirmed'
          : `${stats.atRiskCount} appointments unconfirmed`,
      icon: Clock,
      color: stats.atRiskCount > 0 ? '#F59E0B' : '#10B981',
      bgColor: stats.atRiskCount > 0 ? '#FFFBEB' : '#ECFDF5',
    },
    {
      label: 'No-shows (Month)',
      value: stats.noShowsMonth,
      sub:
        stats.noShowsMonth === 0
          ? 'Zero no-shows this month 🎉'
          : `≈ $${(stats.noShowsMonth * 180).toLocaleString()} est. revenue lost`,
      icon: AlertTriangle,
      color: stats.noShowsMonth > 0 ? '#EF4444' : '#10B981',
      bgColor: stats.noShowsMonth > 0 ? '#FEF2F2' : '#ECFDF5',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} loading={loading} />
      ))}
    </div>
  );
}
