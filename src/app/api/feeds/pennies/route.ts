import { NextResponse } from "next/server";
import { penniesFeed, type PenniesFeedItem } from "@/lib/claude";
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";

export interface PenniesFeedResponse {
  items: PenniesFeedItem[];
  cached: boolean;
}

// Pennies are national, not zip-specific — cache key is the empty
// string so all users in all zips share one cached feed per TTL.
const ZIP_KEY = "";

export async function GET(): Promise<
  NextResponse<PenniesFeedResponse | { error: string }>
> {
  const cached = await readFeedCache<PenniesFeedItem[]>(ZIP_KEY, "pennies");
  if (cached) {
    return NextResponse.json({ items: cached, cached: true });
  }

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
