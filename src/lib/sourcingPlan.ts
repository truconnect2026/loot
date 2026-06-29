/**
 * buildWeekPlan — resolve a 7-day sourcing schedule for a user's stores.
 *
 * For each of the next 7 days, for each user store:
 *   1. Find matching ChainDayPatterns from sourcingPatterns.ts
 *   2. Upgrade confidence to "confirmed" if the user's own logs show
 *      2+ was_on_sale hits on that weekday for that store
 *   3. Fall back to "unknown" when no pattern exists
 *
 * Also returns TODAY'S BEST STOP: highest-confidence deal today,
 * tiebroken by chain priority.
 */

import { patternsForDay } from "./sourcingPatterns";

export interface StoreRecord {
  id: string;
  name: string;
  chain: string;
  location_label: string | null;
}

export interface LogRecord {
  store_id: string;
  logged_date: string; // "YYYY-MM-DD" (date column from Supabase)
  was_on_sale: boolean;
}

export interface DayEntry {
  store: StoreRecord;
  label: string;
  confidence: "pattern" | "confirmed" | "unknown";
}

export interface DayPlan {
  date: string;    // "YYYY-MM-DD"
  weekday: number; // 0 (Sun) – 6 (Sat)
  entries: DayEntry[];
}

export interface WeekPlanResult {
  weekPlan: DayPlan[];
  bestStop: DayEntry | null;
}

const CONF_RANK: Record<string, number> = { confirmed: 2, pattern: 1, unknown: 0 };

// Higher = more established network; used as tiebreaker when confidence is equal.
const CHAIN_PRIORITY: Record<string, number> = {
  Goodwill: 3,
  Savers: 2,
  "Value Village": 2,
  other: 0,
};

function chainPriority(chain: string): number {
  return CHAIN_PRIORITY[chain] ?? 1;
}

// Count how many logs for this store on this weekday had was_on_sale = true.
// Uses UTC day to avoid local-TZ issues with date-only strings.
function saleHitCount(storeId: string, weekday: number, logs: LogRecord[]): number {
  return logs.filter((l) => {
    if (l.store_id !== storeId || !l.was_on_sale) return false;
    // Parse "YYYY-MM-DD" at noon UTC so DST never flips the date.
    const d = new Date(l.logged_date + "T12:00:00Z");
    return d.getUTCDay() === weekday;
  }).length;
}

export function buildWeekPlan(
  stores: StoreRecord[],
  logs: LogRecord[],
  now: Date = new Date(),
): WeekPlanResult {
  const weekPlan: DayPlan[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const weekday = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const dateStr = date.toISOString().slice(0, 10);

    const entries: DayEntry[] = [];

    for (const store of stores) {
      const patterns = patternsForDay(store.chain, weekday);

      if (patterns.length === 0) {
        entries.push({ store, label: "no known deals today", confidence: "unknown" });
        continue;
      }

      // 2+ log hits on this weekday → user has personally confirmed the pattern.
      const hits = saleHitCount(store.id, weekday, logs);
      const confidence: "confirmed" | "pattern" = hits >= 2 ? "confirmed" : "pattern";

      for (const p of patterns) {
        entries.push({ store, label: p.label, confidence });
      }
    }

    weekPlan.push({ date: dateStr, weekday, entries });
  }

  // Best stop = highest confidence among today's non-unknown entries,
  // tiebreak by chain priority (Goodwill > Savers/Value Village > other).
  const todayEntries = weekPlan[0]?.entries ?? [];
  const bestStop =
    [...todayEntries]
      .filter((e) => e.confidence !== "unknown")
      .sort((a, b) => {
        const cd =
          (CONF_RANK[b.confidence] ?? 0) - (CONF_RANK[a.confidence] ?? 0);
        if (cd !== 0) return cd;
        return chainPriority(b.store.chain) - chainPriority(a.store.chain);
      })[0] ?? null;

  return { weekPlan, bestStop };
}
