import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const isAdmin = ADMIN_EMAILS.length === 0
    ? false
    : ADMIN_EMAILS.includes((user.email ?? '').toLowerCase());

  return (
    <div className="flex h-screen bg-cream-100">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
