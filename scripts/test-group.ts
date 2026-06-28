import { groupSeries } from "../src/lib/groupSeries";
import { normalizeMetrics } from "../src/lib/normalizeMetrics";
import { deriveMetrics, inferCategory } from "../src/lib/deriveMetrics";
import type { BatchValuation } from "../src/lib/claude";

function item(
  index: number,
  name: string,
  estResale: number,
  demand: "High" | "Medium" | "Low" = "Medium",
  verdict?: "BUY" | "PASS" | "MAYBE",
): BatchValuation {
  const v: "BUY" | "PASS" | "MAYBE" =
    verdict ?? (estResale >= 15 ? "BUY" : estResale >= 8 ? "MAYBE" : "PASS");
  return {
    index,
    name,
    verdict: v,
    sellPrice: estResale,
    sellSpeed: "FAST",        // model defaults (will be overridden by deriveMetrics)
    reasoning: "test",
    estResale,
    resaleLow: Math.round(estResale * 0.7 * 100) / 100,
    resaleHigh: Math.round(estResale * 2.0 * 100) / 100, // intentionally wide — tests clamp
    daysToSell: "2-4 weeks",
    demand,
    platform: "eBay",         // model defaults (will be overridden by deriveMetrics)
    idConfidence: "medium",
    needsVerify: false,
    groupId: null,
    groupRole: "single",
  };
}

const INPUT: BatchValuation[] = [
  // ── Book singles that form lots after groupSeries ──────────────────────
  item(0,  "City of Bones (Mortal Instruments)",              3.50),
  item(1,  "City of Ashes (Mortal Instruments)",              3.50),
  item(2,  "City of Lost Souls (Mortal Instrum...)",          3.50),
  item(3,  "City of Heavenly Fire (Mortal In...)",            4.00),
  item(4,  "City of Fallen Angels (The Mortal ...)",          3.50),
  item(5,  "City of Glass (The Mortal Instruments)",          3.50),
  item(6,  "Clockwork Angel (The Infernal Devices)",          4.00),
  item(7,  "Clockwork Prince (The Infernal Devices)",         4.00),
  item(8,  "Clockwork Princess (The Infernal Devices)",       4.50),
  // ── Manga series — "series" triggers lot before "manga" triggers media ─
  item(9,  "Sailor Moon Manga Series (multiple volumes)",    18.00, "High"),
  item(10, "Soul Eater Manga Series (multiple volumes)",     15.00, "High"),
  // ── Funko Pop — figure category ─────────────────────────────────────────
  item(11, "Killua Zoldyck Funko Pop (Hunter x Hunter)",    12.00, "High",   "MAYBE"),
  // ── Misc singles — fall through to "book" ────────────────────────────────
  item(12, "Luffy Bento Box",                                 8.00, "Medium", "MAYBE"),
  // ── Book singles (PASS) ───────────────────────────────────────────────────
  item(13, "The Hunger Games",                                3.00, "Low"),
  item(14, "Catching Fire",                                   3.00, "Low"),
  item(15, "Mockingjay",                                      3.00, "Low"),
  item(16, "Harry Potter and the Sorcerer's Stone",           5.00),
  item(17, "Harry Potter and the Chamber of Secrets",         4.00),
  item(18, "Harry Potter and the Prisoner of Azkaban",        5.00),
  item(19, "Harry Potter and the Goblet of Fire",             5.00),
  // ── Manga volumes — "vol " → lot ──────────────────────────────────────────
  item(20, "One Piece Vol 1",                                12.00, "High"),
  item(21, "One Piece Vol 2",                                10.00, "High"),
  item(22, "One Piece Vol 3",                                12.00, "High"),
  // ── Household — no category match → "book" ────────────────────────────────
  item(23, "KitchenAid Mixer (Red)",                         45.00, "High",   "BUY"),
  // ── "set" in name → lot category ──────────────────────────────────────────
  item(24, "Vintage Pyrex Bowl Set",                         22.00, "Medium", "BUY"),
  // ── More household singles ────────────────────────────────────────────────
  item(25, "LEGO Star Wars Millennium Falcon",               35.00, "High",   "BUY"),
  item(26, "Nintendo DS Lite (Black)",                       18.00, "High",   "BUY"),
  item(27, "Random Romance Novel",                            2.00, "Low"),
  // ── Graded card — card category, price-bump on speed ─────────────────────
  item(28, "PSA 9 Charizard Holo Pokemon Card",            150.00, "High",   "BUY"),
  // ── Complete set — lot + bulky override on platform ───────────────────────
  item(29, "Harry Potter Complete Hardcover Set",            75.00, "High",   "BUY"),
];

console.log(`\n=== INPUT: ${INPUT.length} items ===\n`);

// Pipeline: deriveMetrics → normalizeMetrics → groupSeries
const WITH_METRICS = INPUT.map((v) => ({ ...v, ...deriveMetrics(v) }));
const NORMALIZED   = normalizeMetrics(WITH_METRICS);
const OUTPUT       = groupSeries(NORMALIZED);

// ── Grouping table ─────────────────────────────────────────────────────────

console.log(`\n=== OUTPUT: ${OUTPUT.length} items ===\n`);

const COL = [56, 12, 24, 7, 9];
const header = [
  "name".padEnd(COL[0]),
  "groupRole".padEnd(COL[1]),
  "groupId".padEnd(COL[2]),
  "verdict".padEnd(COL[3]),
  "estResale",
].join(" | ");
console.log(header);
console.log("-".repeat(header.length));

for (const v of OUTPUT) {
  const prefix =
    v.groupRole === "lot-anchor" ? "★ " :
    v.groupRole === "lot-member"  ? "  └ " : "  ";
  const nameCol = (prefix + v.name).slice(0, COL[0]).padEnd(COL[0]);
  console.log(
    [
      nameCol,
      (v.groupRole ?? "single").padEnd(COL[1]),
      (v.groupId ?? "null").padEnd(COL[2]),
      v.verdict.padEnd(COL[3]),
      `$${v.estResale.toFixed(2)}`,
    ].join(" | "),
  );
}

// ── Metrics table (code-derived, post-normalise, pre-group) ───────────────

console.log(`\n=== METRICS (code-derived) ===\n`);

const MC = [48, 8, 9, 7, 16];
const mheader = [
  "name".padEnd(MC[0]),
  "category".padEnd(MC[1]),
  "speed".padEnd(MC[2]),
  "demand".padEnd(MC[3]),
  "platform",
].join(" | ");
console.log(mheader);
console.log("-".repeat(mheader.length));

for (const v of NORMALIZED) {
  const cat = inferCategory(v);
  console.log(
    [
      v.name.slice(0, MC[0]).padEnd(MC[0]),
      cat.padEnd(MC[1]),
      v.sellSpeed.padEnd(MC[2]),
      v.demand.padEnd(MC[3]),
      v.platform,
    ].join(" | "),
  );
}

// ── Sanity checks ──────────────────────────────────────────────────────────

const rangeViolations = NORMALIZED.filter(
  (v) => v.resaleLow > 0 && v.resaleHigh > Math.round(v.resaleLow * 1.6 * 100) / 100 + 0.01,
);
console.log(
  `\nRANGE CHECK: ${rangeViolations.length} items exceed 1.6x (should be 0 after normalize)`,
);

const speeds: Record<string, number>     = { FAST: 0, MODERATE: 0, SLOW: 0 };
const demands: Record<string, number>    = { High: 0, Medium: 0, Low: 0 };
const platforms: Record<string, number>  = {};
const categories: Record<string, number> = {};

for (const v of NORMALIZED) {
  const cat = inferCategory(v);
  speeds[v.sellSpeed]    = (speeds[v.sellSpeed]    ?? 0) + 1;
  demands[v.demand]      = (demands[v.demand]      ?? 0) + 1;
  platforms[v.platform]  = (platforms[v.platform]  ?? 0) + 1;
  categories[cat]        = (categories[cat]        ?? 0) + 1;
}

const fmt = (obj: Record<string, number>) =>
  Object.entries(obj).map(([k, n]) => `${k}:${n}`).join(", ");

console.log(
  `SPREAD CHECK: speeds={${fmt(speeds)}} demand={${fmt(demands)}} platforms={${fmt(platforms)}} categories={${fmt(categories)}}`,
);
