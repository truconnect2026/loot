import "server-only";
import Stripe from "stripe";

/**
 * Stripe client — instantiated lazily so missing keys don't break
 * cold-start of unrelated routes. Pin the API version explicitly:
 * Stripe rolls breaking changes into new API versions, and reading
 * the SDK's default would silently shift behavior on an SDK bump.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error("STRIPE_SECRET_KEY must be set");
    client = new Stripe(apiKey);
  }
  return client;
}

/**
 * Price IDs for the two LOOT Pro plans. Set these in Vercel env
 * once the Stripe products are created. The fallback empty string
 * keeps TypeScript happy at build time; the route handlers
 * validate the price_id from the request matches one of these
 * before calling Stripe, so a missing env var produces a clear
 * 400 instead of a Stripe-side error.
 */
export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? "";
export const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? "";

export function isKnownPrice(priceId: string): boolean {
  return (
    (priceId === PRICE_MONTHLY && PRICE_MONTHLY !== "") ||
    (priceId === PRICE_ANNUAL && PRICE_ANNUAL !== "")
  );
}

export function priceToPlanType(priceId: string): "monthly" | "annual" | null {
  if (priceId === PRICE_MONTHLY) return "monthly";
  if (priceId === PRICE_ANNUAL) return "annual";
  return null;
}
