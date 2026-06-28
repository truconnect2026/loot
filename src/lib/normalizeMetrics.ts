import type { BatchValuation } from "./claude";

export function normalizeMetrics(items: BatchValuation[]): BatchValuation[] {
  return items.map((item) => {
    let { estResale, resaleLow, resaleHigh, platform } = item;

    // Fill missing/zero values from estResale
    if (resaleLow <= 0 && resaleHigh <= 0) {
      if (estResale > 0) {
        resaleLow = Math.round(estResale * 0.85 * 100) / 100;
        resaleHigh = Math.round(estResale * 1.3 * 100) / 100;
      }
    } else if (resaleLow <= 0) {
      resaleLow = Math.round((resaleHigh / 1.6) * 100) / 100;
    } else if (resaleHigh <= 0) {
      resaleHigh = Math.round(resaleLow * 1.3 * 100) / 100;
    }

    // Swap inverted band
    if (resaleLow > resaleHigh) [resaleLow, resaleHigh] = [resaleHigh, resaleLow];

    // Clamp high to 1.6× low — never widen
    const cap = Math.round(resaleLow * 1.6 * 100) / 100;
    if (resaleHigh > cap) resaleHigh = cap;

    // Clamp estResale inside band
    if (estResale < resaleLow || estResale > resaleHigh) {
      estResale = Math.round(((resaleLow + resaleHigh) / 2) * 100) / 100;
    }

    // Default empty platform
    if (!platform) platform = "eBay";

    return { ...item, estResale, sellPrice: estResale, resaleLow, resaleHigh, platform };
  });
}
