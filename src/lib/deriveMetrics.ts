import type { BatchValuation } from "./claude";

export type InferredCategory =
  | "figure"
  | "card"
  | "lot"
  | "media"
  | "book"
  | "vhs"
  | "bulky-appliance";

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

  // 4. VHS tape (checked before generic media so it gets its own floor)
  if (/\bvhs\b|\bcassette\b/.test(n)) return "vhs";

  // 5. Bulky appliance — heavy items that belong on FB Local
  if (/\b(?:heaters?|humidifiers?|lamps?|kettles?|printers?|monitors?|fans?|speakers?)\b/.test(n))
    return "bulky-appliance";

  // 6. Media — manga, disc, vinyl, etc.
  if (/manga|dvd|blu-ray|vinyl|\bcd\b/.test(n)) return "media";

  // 7. Default — single book or unrecognised item
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
      case "figure":          sellSpeed = verdict === "BUY" ? "FAST" : "MODERATE"; break;
      case "card":            sellSpeed = "FAST"; break;
      case "lot":             sellSpeed = "MODERATE"; break;
      case "media":           sellSpeed = "MODERATE"; break;
      case "vhs":             sellSpeed = "SLOW"; break;
      case "bulky-appliance": sellSpeed = verdict === "PASS" ? "SLOW" : "MODERATE"; break;
      default:                sellSpeed = "SLOW"; // book
    }

    // Lots slow down when expensive (figures/cards stay Fast)
    if (category === "lot" && estResale >= 40) {
      sellSpeed = "SLOW";
    }

    // PASS verdict always slow
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
    } else if (category === "vhs" || category === "bulky-appliance") {
      platform = "Facebook Local";
    } else if (category === "lot" || category === "media") {
      platform = estResale >= 25 ? "Mercari" : "Facebook Local";
    } else {
      // book single: decent books ship via Mercari, cheap ones sell local
      platform = estResale >= 15 ? "Mercari" : "Facebook Local";
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

// Patterns that signal a rare / collectible VHS (worth MAYBE or BUY).
const VHS_RARITY_RE = /sealed|rare|black.?diamond|first.?edition|horror|a24|oop|out.?of.?print/i;

/**
 * applyValueFloors — post-process pass that can only make verdicts more
 * conservative, never upgrade them.  Run after normalizeMetrics, before
 * groupSeries so the group anchor's verdict is correct.
 *
 * Rules:
 *  - Common VHS → PASS, resale clamped $1-3.
 *  - Bulky-appliance BUY without real margin → MAYBE.
 *  - Common single book under $5 → PASS (belt-and-suspenders).
 */
export function applyValueFloors(items: BatchValuation[]): BatchValuation[] {
  return items.map((item) => {
    const cat = inferCategory(item);

    if (cat === "vhs") {
      if (!VHS_RARITY_RE.test(item.name ?? "")) {
        // Common VHS: always PASS, clamp resale to $1-3.
        const clamped = Math.min(item.estResale, 2);
        return {
          ...item,
          verdict: "PASS" as const,
          demand: "Low" as const,
          estResale: clamped,
          sellPrice: clamped,
          resaleLow: 1,
          resaleHigh: 3,
        };
      }
      // Rare VHS: never let PASS stand — floor at MAYBE.
      if (item.verdict === "PASS") return { ...item, verdict: "MAYBE" as const };
      return item;
    }

    if (cat === "bulky-appliance") {
      // BUY requires estResale >= $35 AND High demand; anything less → MAYBE.
      if (item.verdict === "BUY" && !(item.estResale >= 35 && item.demand === "High")) {
        return { ...item, verdict: "MAYBE" as const };
      }
      return item;
    }

    // Common single book under $5 → PASS.
    if (
      cat === "book" &&
      item.groupRole === "single" &&
      item.estResale < 5 &&
      item.verdict !== "PASS"
    ) {
      return { ...item, verdict: "PASS" as const };
    }

    return item;
  });
}
