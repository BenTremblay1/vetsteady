'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Settings, LogOut, BarChart2, MessageSquare, TrendingUp, Gift } from 'lucide-react';

const navItems = [
  { href: '/dashboard',              label: 'Calendar',  icon: Calendar },
  { href: '/dashboard/clients',      label: 'Clients',   icon: Users },
  { href: '/dashboard/reminders',    label: 'Reminders', icon: MessageSquare },
  { href: '/dashboard/reports',      label: 'Reports',   icon: BarChart2 },
  { href: '/dashboard/launch',        label: 'Launch',    icon: TrendingUp },
  { href: '/dashboard/referral',      label: 'Referrals',  icon: Gift },
  { href: '/dashboard/settings',     label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <span className="text-xl font-bold" style={{ color: '#0D7377' }}>VetSteady</span>
        <p className="text-[10px] text-gray-400 mt-0.5">Practice Management</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={active ? { backgroundColor: '#0D7377' } : undefined}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-200">
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
