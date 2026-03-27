/**
 * Vercel Cron: Process Reminder Queue
 *
 * Runs every 5 minutes via Vercel Cron (configured in vercel.json).
 * Secured with CRON_SECRET header.
 *
 * Fetches up to 10 pending reminder jobs from pg-boss and processes them.
 */

import { NextResponse } from 'next/server';
import { processReminderBatch } from '@/lib/queue/processor';

export const runtime = 'nodejs'; // pg-boss requires Node.js (not Edge)
export const maxDuration = 60;   // Allow up to 60s for batch processing

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (or our own cron scheduler)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processReminderBatch();

    console.log(
      `[cron] process-reminders: ${result.processed} sent, ${result.failed} failed`
    );

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[cron] process-reminders error:', err?.message);
    return NextResponse.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 }
    );
  }
}
