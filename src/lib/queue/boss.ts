/**
 * pg-boss singleton
 *
 * pg-boss creates its own schema ("pgboss") in the same Postgres database.
 * We connect using the Supabase service role connection string (full Postgres URI),
 * which bypasses RLS — correct for background jobs that need cross-tenant writes.
 *
 * In Vercel serverless functions, this module may initialise a new Boss per
 * cold-start. pg-boss handles concurrent instances safely via advisory locks.
 */

import PgBoss from 'pg-boss';

let bossInstance: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (bossInstance) return bossInstance;

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL env var is required for pg-boss');
  }

  const boss = new PgBoss({
    connectionString,
    // Keep job history for 7 days
    deleteAfterDays: 7,
    // Retry failed jobs up to 3 times, with exponential back-off (30s base)
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });

  boss.on('error', (error) => {
    console.error('[pg-boss] Error:', error);
  });

  await boss.start();
  bossInstance = boss;
  return boss;
}
