import { createClient } from '@supabase/supabase-js';

/**
 * Direct service-role Supabase client — no cookie/SSR wrapper.
 * Use this in webhook handlers, API routes, and any context that doesn't
 * have a user request (cron jobs, background tasks, admin routes).
 * Never use this client-side.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
