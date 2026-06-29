/**
 * Sourcing pattern library — chain → weekly deal map.
 *
 * These are TYPICAL patterns compiled from widely-reported schedules.
 * They are regionally variable and can change without notice.
 * The UI surfaces them tagged "verify in store" (confidence: "pattern").
 * Users upgrade individual patterns to "confirmed" via their own logs
 * (see buildWeekPlan in sourcingPlan.ts).
 *
 * weekday follows Date#getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed,
 *                                 4=Thu, 5=Fri, 6=Sat
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ChainDayPattern {
  chain: string;
  weekday: Weekday;
  label: string;
  confidence: "pattern"; // always "pattern" here; logs upgrade to "confirmed"
}

export const CHAIN_PATTERNS: readonly ChainDayPattern[] = [
  // ── GOODWILL ────────────────────────────────────────────────────────────
  // Color-tag discount rotates weekly (Blue→Yellow→Pink→Green→Orange, repeat).
  // The active color is 50% off every day of the week it's current;
  // the prior week's color drops to 75% before cycling out.
  // Current color is computed dynamically via currentGoodwillColors() in sourcing.ts.
  { chain: "Goodwill", weekday: 0, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },
  { chain: "Goodwill", weekday: 1, label: "Senior Discount Day — extra 20% off (55+, most locations)",          confidence: "pattern" },
  { chain: "Goodwill", weekday: 1, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },
  { chain: "Goodwill", weekday: 2, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },
  { chain: "Goodwill", weekday: 3, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },
  { chain: "Goodwill", weekday: 4, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },
  { chain: "Goodwill", weekday: 5, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },
  { chain: "Goodwill", weekday: 6, label: "Weekly color tag 50% off · check current color in-app",              confidence: "pattern" },

  // ── SAVERS ──────────────────────────────────────────────────────────────
  // Monday & Tuesday are the most common color-tag markdown days.
  // Senior Day (55+) typically Monday; extra 30% off entire purchase.
  // Wednesday is a common restock day — fresh goods hit floor early.
  { chain: "Savers", weekday: 1, label: "Senior Discount Day — extra 30% off (55+, most locations)", confidence: "pattern" },
  { chain: "Savers", weekday: 1, label: "Sale tag rotation — up to 50% off select items",            confidence: "pattern" },
  { chain: "Savers", weekday: 2, label: "Sale tag rotation — up to 50% off select items",            confidence: "pattern" },
  { chain: "Savers", weekday: 3, label: "Mid-week restock — fresh merchandise on floor",             confidence: "pattern" },

  // ── VALUE VILLAGE (shares national infrastructure with Savers) ───────────
  { chain: "Value Village", weekday: 1, label: "Senior Discount Day — extra 30% off (55+, most locations)", confidence: "pattern" },
  { chain: "Value Village", weekday: 1, label: "Sale tag rotation — up to 50% off select items",            confidence: "pattern" },
  { chain: "Value Village", weekday: 2, label: "Sale tag rotation — up to 50% off select items",            confidence: "pattern" },
  { chain: "Value Village", weekday: 3, label: "Mid-week restock — fresh merchandise on floor",             confidence: "pattern" },

  // ── OTHER / INDEPENDENT ─────────────────────────────────────────────────
  // Monday senior discount is the most common pattern across independent thrift stores.
  { chain: "other", weekday: 1, label: "Many independent stores offer senior discount on Mondays", confidence: "pattern" },
];

/** All patterns for a given chain + weekday. Returns [] if none known. */
export function patternsForDay(chain: string, weekday: number): ChainDayPattern[] {
  const key = chain.trim().toLowerCase();
  return CHAIN_PATTERNS.filter(
    (p) => p.weekday === weekday && p.chain.toLowerCase() === key,
  );
}

/** Distinct chain names that have at least one pattern entry. */
export const KNOWN_CHAINS = [
  "Goodwill",
  "Savers",
  "Value Village",
  "other",
] as const;

export type KnownChain = (typeof KNOWN_CHAINS)[number];
