import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const FREE_DAILY_LIMIT = 5;

export interface ScanCountResponse {
  isPro: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Lightweight read of the current user's scan-quota state.
 * Frontend uses this to render "X/5 free scans today" under the
 * ScanButtons row. Returns isPro: true / used: 0 / limit: Infinity-
 * shaped values for Pro users so the same UI logic can collapse
 * the counter for them with `isPro && hideCounter`.
 *
 * Anonymous calls (no session) get a permissive default — the
 * actual rate limit is enforced server-side in /api/scan, so
 * we don't need to be strict here.
 */
export async function GET(): Promise<NextResponse<ScanCountResponse>> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return NextResponse.json({
      isPro: false,
      used: 0,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT,
    });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .maybeSingle();

  const isPro = profileRow?.is_pro === true;

  if (isPro) {
    return NextResponse.json({
      isPro: true,
      used: 0,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
    });
  }

  // Day boundary in the SERVER's timezone (UTC on Vercel). Resellers
  // checking the limit at midnight local time may see an off-by-one
  // — accepted tradeoff vs. complicating the query with per-user
  // tz storage.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString());

  const used = count ?? 0;
  return NextResponse.json({
    isPro: false,
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
  });
}
