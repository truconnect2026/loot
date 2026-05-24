/**
 * Pending-plan handoff between /pro and /account.
 *
 * When a signed-out visitor clicks a purchase CTA on /pro, we stash
 * their plan choice (and any UTMs in the URL) in sessionStorage before
 * bouncing them to login. After auth, /account picks it up and
 * auto-launches Stripe checkout with the original attribution intact.
 *
 * sessionStorage (not localStorage) on purpose — a stale pending plan
 * from yesterday shouldn't ambush a returning user.
 *
 * Same module is used by:
 *   - /pro/page.jsx          — saves on click
 *   - /app/page.tsx          — bounces to /account on mount if set
 *   - /onboarding/page.tsx   — bounces to /account on completion if set
 *   - /account/page.tsx      — consumes + clears + launches checkout
 */

export const PENDING_PLAN_KEY = "loot.pending_plan";

export type PlanChoice = "monthly" | "annual";

export interface PendingPlan {
  plan: PlanChoice;
  utms: Record<string, string>;
  savedAt: number;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export function utmsFromSearch(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(search);
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v.slice(0, 500);
  }
  return out;
}

export function savePendingPlan(plan: PlanChoice, utms: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingPlan = { plan, utms, savedAt: Date.now() };
    window.sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage may be unavailable (private mode); the worst case
    // is the user finishes auth and lands on /app instead of checkout,
    // which is recoverable — they can click upgrade from /account.
  }
}

export function readPendingPlan(): PendingPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPlan>;
    if (parsed.plan !== "monthly" && parsed.plan !== "annual") return null;
    return {
      plan: parsed.plan,
      utms: (parsed.utms && typeof parsed.utms === "object") ? parsed.utms : {},
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPendingPlan(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_PLAN_KEY);
  } catch {
    /* same fallback rationale as savePendingPlan */
  }
}
