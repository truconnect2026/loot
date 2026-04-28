import "server-only";

/**
 * eBay Browse API wrapper — client-credentials OAuth + sold-item search.
 * Token cached in module memory for its lifetime to avoid re-auth on each call.
 */

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET must be set");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: SCOPE,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay OAuth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export interface EbayComp {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  condition?: string;
  url?: string;
  imageUrl?: string;
}

interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  condition?: string;
  itemWebUrl?: string;
  image?: { imageUrl: string };
}

interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[];
}

export async function searchSoldComps(query: string, limit = 10): Promise<EbayComp[]> {
  const token = await getAccessToken();

  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set(
    "filter",
    "buyingOptions:{FIXED_PRICE},conditions:{USED}"
  );
  url.searchParams.set("sort", "price");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay search failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as EbaySearchResponse;
  return (data.itemSummaries ?? [])
    .filter((it) => it.price?.value)
    .map((it) => ({
      itemId: it.itemId,
      title: it.title,
      price: Number(it.price!.value),
      currency: it.price!.currency,
      condition: it.condition,
      url: it.itemWebUrl,
      imageUrl: it.image?.imageUrl,
    }));
}

/** Median sold price — robust against outliers in the 10-item sample. */
export function medianPrice(comps: EbayComp[]): number | null {
  if (comps.length === 0) return null;
  const sorted = [...comps].map((c) => c.price).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
