import { NextResponse } from "next/server";
import { clearanceFeed, type ClearanceFeedItem } from "@/lib/claude";
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";

export interface ClearanceFeedResponse {
  items: ClearanceFeedItem[];
  cached: boolean;
}

const ZIP_KEY = "";

export async function GET(): Promise<
  NextResponse<ClearanceFeedResponse | { error: string }>
> {
  const cached = await readFeedCache<ClearanceFeedItem[]>(ZIP_KEY, "clearance");
  if (cached) {
    return NextResponse.json({ items: cached, cached: true });
  }

  try {
    const items = await clearanceFeed();
    await writeFeedCache(ZIP_KEY, "clearance", items);
    return NextResponse.json({ items, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clearance feed failed";
    console.error("Clearance feed error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
