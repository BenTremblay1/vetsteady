import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service role client — bypasses RLS.
 * ONLY use in server-side API routes and background jobs.
 * NEVER expose to the client.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
