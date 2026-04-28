import "server-only";

/**
 * UPCitemdb trial endpoint — free tier, 100 requests/day, no auth required.
 * Returns the highest-quality match (the API ranks results internally).
 */

export interface UpcLookupResult {
  title: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
}

interface UpcItemDbItem {
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
  images?: string[];
}

interface UpcItemDbResponse {
  code?: string;
  total?: number;
  items?: UpcItemDbItem[];
}

export async function lookupUpc(upc: string): Promise<UpcLookupResult | null> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Don't cache scans — every lookup should hit live.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`UPCitemdb lookup failed (${res.status})`);
  }

  const data = (await res.json()) as UpcItemDbResponse;
  const item = data.items?.[0];
  if (!item || !item.title) return null;

  return {
    title: item.title,
    brand: item.brand,
    category: item.category,
    description: item.description,
    imageUrl: item.images?.[0],
  };
}
