import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Feed cache — wraps the feed_cache Supabase table. Each row holds
 * the JSON payload for a single (zip, feed_type) combo. Reads enforce
 * a 4-hour TTL; writes are upserts so re-running a feed inside the
 * window replaces the cached payload.
 *
 * Both read and write swallow errors silently and degrade to "no
 * cache" so a misconfigured Supabase project doesn't take down the
 * feed routes — they'll just call Claude every time, which is the
 * pre-cache behavior.
 */

const TTL_MS = 4 * 60 * 60 * 1000;

export type FeedType = "deals" | "free" | "pennies" | "clearance";

interface FeedCacheRow {
  payload: unknown;
  created_at: string | null;
}

export async function readFeedCache<T>(
  zip: string,
  type: FeedType,
): Promise<T | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("feed_cache")
      .select("payload, created_at")
      .eq("zip_code", zip)
      .eq("feed_type", type)
      .maybeSingle();
    const row = data as FeedCacheRow | null;
    if (!row?.created_at) return null;
    const age = Date.now() - new Date(row.created_at).getTime();
    if (age > TTL_MS) return null;
    return row.payload as T;
  } catch {
    return null;
  }
}

export async function writeFeedCache(
  zip: string,
  type: FeedType,
  payload: unknown,
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("feed_cache").upsert(
      {
        zip_code: zip,
        feed_type: type,
        payload,
        created_at: new Date().toISOString(),
      },
      { onConflict: "zip_code,feed_type" },
    );
  } catch {
    /* cache write failure is acceptable — we just won't dedupe the
       next call. The user-facing response is unaffected. */
  }
}
