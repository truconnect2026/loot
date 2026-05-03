import { NextResponse, type NextRequest } from "next/server";
import { freeFeed, type FreeFeedItem } from "@/lib/claude";
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";

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

  try {
    const items = await freeFeed(zip, radius);
    const deals = items.map(toFeedDeal);
    await writeFeedCache(zip, "free", deals);
    return NextResponse.json({ deals, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Free feed failed";
    console.error("Free feed error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
