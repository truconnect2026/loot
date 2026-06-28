import { groupSeries } from "../src/lib/groupSeries";
import { normalizeMetrics } from "../src/lib/normalizeMetrics";
import type { BatchValuation } from "../src/lib/claude";

function item(
  index: number,
  name: string,
  estResale: number,
  demand: "High" | "Medium" | "Low" = "Medium",
  verdict?: "BUY" | "PASS" | "MAYBE",
  speed: "FAST" | "MODERATE" | "SLOW" = "FAST", // default FAST mimics model over-use
  platform = "eBay",                              // default eBay mimics model over-use
): BatchValuation {
  const v: "BUY" | "PASS" | "MAYBE" =
    verdict ?? (estResale >= 15 ? "BUY" : estResale >= 8 ? "MAYBE" : "PASS");
  return {
    index,
    name,
    verdict: v,
    sellPrice: estResale,
    sellSpeed: speed,
    reasoning: "test",
    estResale,
    // intentionally wide (2.86× ratio) to demonstrate normalizeMetrics clamping
    resaleLow: Math.round(estResale * 0.7 * 100) / 100,
    resaleHigh: Math.round(estResale * 2.0 * 100) / 100,
    daysToSell: "2-4 weeks",
    demand,
    platform,
    idConfidence: "medium",
    needsVerify: false,
    groupId: null,
    groupRole: "single",
  };
}

const INPUT: BatchValuation[] = [
  // Mortal Instruments — model defaults FAST/eBay for YA books (incorrect but common)
  item(0,  "City of Bones (Mortal Instruments)",              3.50),
  item(1,  "City of Ashes (Mortal Instruments)",              3.50),
  item(2,  "City of Lost Souls (Mortal Instrum...)",          3.50),
  item(3,  "City of Heavenly Fire (Mortal In...)",            4.00),
  item(4,  "City of Fallen Angels (The Mortal ...)",          3.50),
  item(5,  "City of Glass (The Mortal Instruments)",          3.50),
  // Infernal Devices — same default
  item(6,  "Clockwork Angel (The Infernal Devices)",          4.00),
  item(7,  "Clockwork Prince (The Infernal Devices)",         4.00),
  item(8,  "Clockwork Princess (The Infernal Devices)",       4.50),
  // Popular manga — FAST/High actually defensible here
  item(9,  "Sailor Moon Manga Series (multiple volumes)",    18.00, "High"),
  item(10, "Soul Eater Manga Series (multiple volumes)",     15.00, "High"),
  // Funko Pop — FAST/eBay appropriate for hyped figure
  item(11, "Killua Zoldyck Funko Pop (Hunter x Hunter)",    12.00, "High", "MAYBE"),
  // Luffy Bento — model defaults FAST/eBay (should be Mercari/MODERATE)
  item(12, "Luffy Bento Box",                                 8.00, "Medium", "MAYBE"),
  // Hunger Games — SLOW, Mercari (commodity mass-market novels)
  item(13, "The Hunger Games",                                3.00, "Low",    undefined, "SLOW", "Mercari"),
  item(14, "Catching Fire",                                   3.00, "Low",    undefined, "SLOW", "Mercari"),
  item(15, "Mockingjay",                                      3.00, "Low",    undefined, "SLOW", "Mercari"),
  // Harry Potter — MODERATE, Mercari (common but still sell-able)
  item(16, "Harry Potter and the Sorcerer's Stone",           5.00, "Medium", undefined, "MODERATE", "Mercari"),
  item(17, "Harry Potter and the Chamber of Secrets",         4.00, "Medium", undefined, "MODERATE", "Mercari"),
  item(18, "Harry Potter and the Prisoner of Azkaban",        5.00, "Medium", undefined, "MODERATE", "Mercari"),
  item(19, "Harry Potter and the Goblet of Fire",             5.00, "Medium", undefined, "MODERATE", "Mercari"),
  // One Piece — model defaults FAST/eBay (defensible for popular manga)
  item(20, "One Piece Vol 1",                                12.00, "High"),
  item(21, "One Piece Vol 2",                                10.00, "High"),
  item(22, "One Piece Vol 3",                                12.00, "High"),
  // Household — varied platforms/speeds (correct values, not model defaults)
  item(23, "KitchenAid Mixer (Red)",                         45.00, "High",   "BUY",    "MODERATE", "Facebook Local"),
  item(24, "Vintage Pyrex Bowl Set",                         22.00, "Medium", "BUY",    "MODERATE", "Facebook Local"),
  item(25, "LEGO Star Wars Millennium Falcon",               35.00, "High",   "BUY",    "SLOW",     "eBay"),
  item(26, "Nintendo DS Lite (Black)",                       18.00, "High",   "BUY",    "MODERATE", "eBay"),
  item(27, "Random Romance Novel",                            2.00, "Low",    undefined, "SLOW",    "Mercari"),
];

console.log(`\n=== INPUT: ${INPUT.length} items ===\n`);

const NORMALIZED = normalizeMetrics(INPUT);
const OUTPUT = groupSeries(NORMALIZED);

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
  const prefix = v.groupRole === "lot-anchor" ? "★ " : v.groupRole === "lot-member" ? "  └ " : "  ";
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

// ── Metrics table (on NORMALIZED, before groupSeries alters lot anchors) ───

console.log(`\n=== METRICS (post-normalize, pre-group) ===\n`);

const MC = [48, 9, 7, 16, 20];
const mheader = [
  "name".padEnd(MC[0]),
  "speed".padEnd(MC[1]),
  "demand".padEnd(MC[2]),
  "platform".padEnd(MC[3]),
  "$low–$high (est)",
].join(" | ");
console.log(mheader);
console.log("-".repeat(mheader.length));

for (const v of NORMALIZED) {
  const name = v.name.slice(0, MC[0]).padEnd(MC[0]);
  const range = `$${v.resaleLow.toFixed(2)}–$${v.resaleHigh.toFixed(2)} ($${v.estResale.toFixed(2)})`;
  console.log(
    [
      name,
      v.sellSpeed.padEnd(MC[1]),
      v.demand.padEnd(MC[2]),
      v.platform.slice(0, MC[3]).padEnd(MC[3]),
      range,
    ].join(" | "),
  );
}

// ── Sanity checks ──────────────────────────────────────────────────────────

const rangeViolations = NORMALIZED.filter(
  (v) => v.resaleLow > 0 && v.resaleHigh > Math.round(v.resaleLow * 1.6 * 100) / 100 + 0.01,
);
console.log(`\nRANGE CHECK: ${rangeViolations.length} items exceed 1.6x (should be 0 after normalize)`);

const speeds: Record<string, number> = { FAST: 0, MODERATE: 0, SLOW: 0 };
const demands: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
const platforms: Record<string, number> = {};
for (const v of NORMALIZED) {
  speeds[v.sellSpeed] = (speeds[v.sellSpeed] ?? 0) + 1;
  demands[v.demand] = (demands[v.demand] ?? 0) + 1;
  platforms[v.platform] = (platforms[v.platform] ?? 0) + 1;
}
const fmtSpeeds = Object.entries(speeds).map(([k, n]) => `${k}:${n}`).join(", ");
const fmtDemands = Object.entries(demands).map(([k, n]) => `${k}:${n}`).join(", ");
const fmtPlatforms = Object.entries(platforms).map(([k, n]) => `${k}:${n}`).join(", ");
console.log(`SPREAD CHECK: speeds={${fmtSpeeds}} demand={${fmtDemands}} platforms={${fmtPlatforms}}`);
