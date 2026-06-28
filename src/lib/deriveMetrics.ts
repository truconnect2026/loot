import type { BatchValuation } from "./claude";

export type InferredCategory = "figure" | "card" | "lot" | "media" | "book";

export function inferCategory(item: BatchValuation): InferredCategory {
  const n = (item.name ?? "").toLowerCase();

  // 1. Figure — Funko, statues, plush, etc.
  if (/funko|\bpop\b|figure|qposket|q posket|nendoroid|statue|plush/.test(n))
    return "figure";

  // 2. Graded / trading card
  if (/psa|cgc|tcg|\bcard\b|slab/.test(n)) return "card";

  // 3. Lot — AI already grouped it, OR name signals a run/set
  if (
    item.groupRole === "lot-anchor" ||
    /\bseries\b|\bset\b|\(multiple|vol\s/.test(n)
  )
    return "lot";

  // 4. Media — manga, disc, vinyl, etc.
  if (/manga|dvd|blu-ray|vinyl|\bcd\b/.test(n)) return "media";

  // 5. Default — single book or unrecognised item
  return "book";
}

export function deriveMetrics(item: BatchValuation): {
  sellSpeed: "FAST" | "MODERATE" | "SLOW";
  demand: "High" | "Medium" | "Low";
  platform: string;
} {
  try {
    const category = inferCategory(item);
    const { verdict, estResale } = item;
    const n = (item.name ?? "").toLowerCase();

    // ── 1. Speed by category ─────────────────────────────────────
    let sellSpeed: "FAST" | "MODERATE" | "SLOW";
    switch (category) {
      case "figure": sellSpeed = verdict === "BUY" ? "FAST" : "MODERATE"; break;
      case "card":   sellSpeed = "FAST"; break;
      case "lot":    sellSpeed = "MODERATE"; break;
      case "media":  sellSpeed = "MODERATE"; break;
      default:       sellSpeed = "SLOW"; // book
    }

    // Bump: expensive items move slower (more selective buyers)
    if (estResale >= 40) {
      if (sellSpeed === "FAST")     sellSpeed = "MODERATE";
      else if (sellSpeed === "MODERATE") sellSpeed = "SLOW";
    }

    // PASS verdict always slow — no point rushing a non-opportunity
    if (verdict === "PASS") sellSpeed = "SLOW";

    // ── 2. Demand by verdict + price ─────────────────────────────
    let demand: "High" | "Medium" | "Low";
    if (verdict === "BUY") {
      demand = estResale >= 20 ? "High" : "Medium";
    } else if (verdict === "MAYBE") {
      demand = "Medium";
    } else {
      demand = "Low";
    }

    // ── 3. Platform by category ───────────────────────────────────
    let platform: string;
    if (category === "figure" || category === "card") {
      platform = "eBay";
    } else if (category === "lot" || category === "media") {
      platform = estResale >= 25 ? "Mercari" : "Facebook Local";
    } else {
      // book or unrecognised
      platform = "Facebook Local";
    }

    // Override: bulky high-value items favour local pickup
    if (/box set|hardcover set|complete/.test(n) && estResale >= 40) {
      platform = "Facebook Local";
    }

    return { sellSpeed, demand, platform };
  } catch {
    return { sellSpeed: "MODERATE", demand: "Medium", platform: "eBay" };
  }
}
