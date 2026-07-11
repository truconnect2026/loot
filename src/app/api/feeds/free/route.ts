import { NextResponse, type NextRequest } from "next/server";
import { freeFeed, type FreeFeedItem } from "@/lib/claude";
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

import type { FeedDeal } from "@/app/api/feeds/deals/route";

export interface FreeFeedResponse {
  deals: FeedDeal[];
  cached: boolean;
}

function platformToSource(platform: string): string {
  switch (platform) {
    case "Craigslist":
      return "craigslist_free";
    case "Facebook":
      return "fb_marketplace";
    case "Nextdoor":
      return "nextdoor";
    default:
      return "craigslist_free";
  }
}

function formatAge(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatDistance(miles: number): string {
  if (miles < 1) return "<1 mi";
  return `${miles.toFixed(1)} mi`;
}

function toFeedDeal(item: FreeFeedItem, idx: number): FeedDeal {
  return {
    id: `f_${idx}_${item.title.slice(0, 16).replace(/\s+/g, "_")}`,
    title: item.title,
    price: 0,
    estimatedValue: item.estimated_resale_value,
    distance: formatDistance(item.distance_miles),
    source: platformToSource(item.platform),
    isFree: true,
    postedAt: formatAge(item.age_hours),
    url: "",
  };
}

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

export async function GET(
  req: NextRequest,
): Promise<NextResponse<FreeFeedResponse | { error: string }>> {
  const { searchParams } = new URL(req.url);
  const zip = (searchParams.get("zip") ?? "").trim();
  const radius = Math.max(1, Math.min(200, Number(searchParams.get("radius") ?? 15)));

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: "Provide ?zip=XXXXX (5-digit US zip)" },
      { status: 400 },
    );
  }

  const cached = await readFeedCache<FeedDeal[]>(zip, "free");
  if (cached) {
    return NextResponse.json({ deals: cached, cached: true });
  }
  // Cache miss → Pro-gated (the sweepable path that mints Claude calls).
  const gate = await checkSpendGate();
  if (gate) return gate;


  try {
    const items = await freeFeed(zip, radius);
    const deals = items.map(toFeedDeal);
    await writeFeedCache(zip, "free", deals);
    return NextResponse.json({ deals, cached: false });
  } catch (err) {
    console.error("Free feed error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
