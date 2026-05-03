import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS. Use ONLY for
 * server-side code that has no user session, e.g. the Stripe
 * webhook (which is invoked by Stripe, not the user). This client
 * has full read/write access to every table; do not import it
 * from anywhere a user request could reach.
 *
 * The cookies() context isn't required here because there's no
 * session to refresh — auth is byte-for-byte signature verification
 * on the request itself, done at the route layer.
 */

let admin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set");
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set");
    admin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return admin;
}
