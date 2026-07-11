import { NextResponse } from "next/server";
import { penniesFeed, type PenniesFeedItem } from "@/lib/claude";
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

export interface PenniesFeedResponse {
  items: PenniesFeedItem[];
  cached: boolean;
}

// Pennies are national, not zip-specific — cache key is the empty
// string so all users in all zips share one cached feed per TTL.
const ZIP_KEY = "";

// Spend gate for cache MISS — mirrors the /api/shelf-scan auth pattern
// (same client construction, same profiles.is_pro + PRO_TEST_EMAILS
// check, same 401/403 body shapes). A cache HIT is served to anyone
// (public teaser); only a MISS, which would mint a new Claude call,
// requires an authenticated Pro user. Fail-open on gate exception,
// matching /api/scan + /api/shelf-scan.
async function checkSpendGate(): Promise<NextResponse<{
  error: string;
  message?: string;
  scans_used?: number;
  scans_limit?: number;
}> | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        { error: "signup_required", message: "sign in to refresh this feed" },
        { status: 401 },
      );
    }
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();
    const testProEmails = (process.env.PRO_TEST_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isTestPro = user.email
      ? testProEmails.includes(user.email.toLowerCase())
      : false;
    if (profileRow?.is_pro === true || isTestPro) return null;
    return NextResponse.json(
      {
        error: "Upgrade to Pro for unlimited scans.",
        scans_used: 0,
        scans_limit: FREE_SCAN_LIMIT,
      },
      { status: 403 },
    );
  } catch (gateErr) {
    console.error("Feed spend gate check failed:", gateErr);
    return null;
  }
}

export async function GET(): Promise<
  NextResponse<PenniesFeedResponse | { error: string }>
> {
  const cached = await readFeedCache<PenniesFeedItem[]>(ZIP_KEY, "pennies");
  if (cached) {
    return NextResponse.json({ items: cached, cached: true });
  }
  // Cache miss → Pro-gated (the sweepable path that mints Claude calls).
  const gate = await checkSpendGate();
  if (gate) return gate;


  try {
    const items = await penniesFeed();
    await writeFeedCache(ZIP_KEY, "pennies", items);
    return NextResponse.json({ items, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pennies feed failed";
    console.error("Pennies feed error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
