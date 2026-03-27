import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Launch Analytics API ──────────────────────────────────────────────────────
// Returns SaaS-level business metrics for the VetSteady launch dashboard.
// Data sources: Supabase (practices, appointments, subscriptions tables).
//
// GET /api/analytics/launch
// Returns: { mrr, signups, activeThisWeek, churnRate, trialToPaid, nps, weeklyGrowth }

export async function GET() {
  const supabase = createClient();

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // ── 1. Total signups (all practices) ────────────────────────────────────
    const { count: totalPractices } = await supabase
      .from('practices')
      .select('*', { count: 'exact', head: true });

    // ── 2. New signups in last 30 days ──────────────────────────────────────
    const { count: newSignups30d } = await supabase
      .from('practices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // ── 3. Active practices this week (had ≥1 appointment created) ──────────
    const { data: activeAppts } = await supabase
      .from('appointments')
      .select('practice_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    const activePracticeIds = new Set((activeAppts ?? []).map((a) => a.practice_id));
    const activeThisWeek = activePracticeIds.size;

    // ── 4. MRR from subscriptions ────────────────────────────────────────────
    // Expects a `subscriptions` table with: practice_id, status, plan, amount_cents
    // Falls back gracefully if table doesn't exist yet.
    let mrr = 0;
    let payingCount = 0;
    let churned30d = 0;
    let trialCount = 0;
    let paidConversions = 0;

    const { data: subs, error: subErr } = await supabase
      .from('subscriptions')
      .select('practice_id, status, plan, amount_cents, cancelled_at, created_at');

    if (!subErr && subs) {
      const activeSubs = subs.filter((s) => s.status === 'active');
      mrr = activeSubs.reduce((sum, s) => sum + (s.amount_cents ?? 9900), 0) / 100;
      payingCount = activeSubs.length;

      // Churned in last 30 days
      churned30d = subs.filter(
        (s) =>
          s.status === 'cancelled' &&
          s.cancelled_at &&
          new Date(s.cancelled_at) >= thirtyDaysAgo
      ).length;

      // Trial → Paid: trials started in last 60 days that converted
      const trialsStarted = subs.filter(
        (s) =>
          s.created_at && new Date(s.created_at) >= sixtyDaysAgo
      ).length;
      trialCount = trialsStarted;
      paidConversions = subs.filter(
        (s) =>
          s.status === 'active' &&
          s.created_at &&
          new Date(s.created_at) >= sixtyDaysAgo
      ).length;
    }

    const churnRate =
      payingCount + churned30d > 0
        ? ((churned30d / (payingCount + churned30d)) * 100).toFixed(1)
        : '0.0';

    const trialToPaid =
      trialCount > 0
        ? ((paidConversions / trialCount) * 100).toFixed(0)
        : null;

    // ── 5. Weekly signup growth (last 8 weeks) ───────────────────────────────
    const { data: allPractices } = await supabase
      .from('practices')
      .select('created_at')
      .order('created_at', { ascending: true });

    const weeklyGrowth = buildWeeklyGrowth(allPractices ?? [], 8);

    // ── 6. NPS placeholder (Stripe/PostHog-powered in production) ───────────
    // Real NPS: quarterly survey via Resend → store responses in `nps_responses` table.
    // For now, return null to show "Not collected yet" state.
    const { data: npsRows } = await supabase
      .from('nps_responses')
      .select('score')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const nps = calculateNps(npsRows ?? []);

    return NextResponse.json({
      mrr: Math.round(mrr * 100) / 100,
      payingCount,
      totalSignups: totalPractices ?? 0,
      newSignups30d: newSignups30d ?? 0,
      activeThisWeek,
      churnRate: parseFloat(churnRate),
      trialToPaid: trialToPaid ? parseInt(trialToPaid) : null,
      nps,
      weeklyGrowth,
    });
  } catch (err) {
    console.error('[analytics/launch] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface WeekPoint {
  label: string; // "Mar W1"
  signups: number;
  cumulative: number;
}

function buildWeeklyGrowth(
  practices: { created_at: string }[],
  numWeeks: number
): WeekPoint[] {
  const result: WeekPoint[] = [];
  const now = new Date();

  for (let w = numWeeks - 1; w >= 0; w--) {
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const signups = practices.filter((p) => {
      const d = new Date(p.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;

    const cumulative = practices.filter(
      (p) => new Date(p.created_at) < weekEnd
    ).length;

    const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ label, signups, cumulative });
  }

  return result;
}

function calculateNps(responses: { score: number }[]): number | null {
  if (responses.length === 0) return null;
  const promoters = responses.filter((r) => r.score >= 9).length;
  const detractors = responses.filter((r) => r.score <= 6).length;
  return Math.round(((promoters - detractors) / responses.length) * 100);
}
