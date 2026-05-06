/**
 * Sourcing helpers — small bits of state that drive the SOURCING
 * carousel and its bottom sheets. Pure functions only so they're
 * cheap to call from both client components and route handlers.
 *
 * Goodwill color tag rotation and Target markdown schedule are the
 * two "active" sourcing intel feeds at launch. The rest of the
 * carousel is currently coming-soon placeholders.
 */

export interface GoodwillColor {
  /** Display name — capitalized for prose ("Blue is 50% off"). */
  name: string;
  /** Approximate paint hex for the color dot in the sheet. */
  hex: string;
  /** Discount tier — 50% is the rotating color, 75% is the "old"
   * carry-over color from the previous week's rotation. */
  discount: "50% OFF" | "75% OFF";
}

// Five-color rotation shared across most regional Goodwill stores.
// Order is the rotation order — week N's 50% color becomes week N+1's
// 75% color, then drops out, and a new 50% color enters.
const ROTATION: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "Blue", hex: "#4FA3E8" },
  { name: "Yellow", hex: "#FFD000" },
  { name: "Pink", hex: "#E5A5C7" },
  { name: "Green", hex: "#5ED890" },
  { name: "Orange", hex: "#E8A05A" },
];

/**
 * Compute the current Goodwill color tags. Rotates weekly based on
 * Date.now() / one-week-ms — close enough for "what color this week."
 * Returns the full sorted list with discount tags so the bottom
 * sheet can render every color, not just today's primary.
 */
export function currentGoodwillColors(now: Date = new Date()): GoodwillColor[] {
  const weekIndex =
    Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000)) % ROTATION.length;
  // 50% color = this week's; 75% color = the previous week's (the
  // "old color goes deeper before it drops"). Other colors carry
  // a "50% OFF" marker as the default tier — the bottom sheet
  // visually de-emphasizes them.
  const fiftyIdx = ((weekIndex % ROTATION.length) + ROTATION.length) % ROTATION.length;
  const seventyFiveIdx = (fiftyIdx - 1 + ROTATION.length) % ROTATION.length;
  return ROTATION.map((c, idx) => ({
    name: c.name,
    hex: c.hex,
    discount:
      idx === fiftyIdx
        ? "50% OFF"
        : idx === seventyFiveIdx
          ? "75% OFF"
          : "50% OFF",
  }));
}

/** Just the headline color used for the carousel card status line. */
export function primaryGoodwillColor(now: Date = new Date()): GoodwillColor {
  const weekIndex =
    Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000)) % ROTATION.length;
  const fiftyIdx = ((weekIndex % ROTATION.length) + ROTATION.length) % ROTATION.length;
  const c = ROTATION[fiftyIdx]!;
  return { name: c.name, hex: c.hex, discount: "50% OFF" };
}

export interface TargetDay {
  /** Three-letter abbrev shown in the sheet ("Mon"). */
  short: string;
  /** Full label ("Monday"). */
  full: string;
  /** Two human-readable category strings. */
  categories: string[];
}

// Sun=0 → Sat=6 to match `Date#getDay()` ordering. Rendering sorts
// these into Mon-first display order.
const TARGET_BY_WEEKDAY: ReadonlyArray<TargetDay> = [
  { short: "Sun", full: "Sunday", categories: ["Baby", "Stationery"] },
  { short: "Mon", full: "Monday", categories: ["Electronics", "Accessories"] },
  { short: "Tue", full: "Tuesday", categories: ["Women's clothing", "Domestics"] },
  { short: "Wed", full: "Wednesday", categories: ["Men's clothing", "Health"] },
  { short: "Thu", full: "Thursday", categories: ["Housewares", "Lingerie"] },
  { short: "Fri", full: "Friday", categories: ["Cosmetics", "Auto"] },
  { short: "Sat", full: "Saturday", categories: ["Toys", "Garden"] },
];

/** Today's Target markdown categories as a single comma string. */
export function todayTargetCategories(now: Date = new Date()): string {
  const day = TARGET_BY_WEEKDAY[now.getDay()];
  if (!day) return "";
  return day.categories.join(" + ");
}

/** Full week schedule, sorted Mon-first for display. */
export function targetWeekSchedule(): TargetDay[] {
  // Reorder so Monday leads — matches how retail folks talk about the week.
  const ordered = [
    TARGET_BY_WEEKDAY[1]!, // Mon
    TARGET_BY_WEEKDAY[2]!, // Tue
    TARGET_BY_WEEKDAY[3]!, // Wed
    TARGET_BY_WEEKDAY[4]!, // Thu
    TARGET_BY_WEEKDAY[5]!, // Fri
    TARGET_BY_WEEKDAY[6]!, // Sat
    TARGET_BY_WEEKDAY[0]!, // Sun
  ];
  return ordered;
}
