import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Browser client — use in client components ("use client").
 * Reads/writes cookies automatically via the browser.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
