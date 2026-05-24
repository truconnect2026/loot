/**
 * UTM tagging helper for external CTAs.
 *
 * Every outbound link to a partner (Digistore24, etc.) gets a consistent
 * set of UTM params so that, once paid ad spend turns on, we can tell
 * which page / which placement converted. Internal Next.js navigations
 * keep using the existing `?ref=` pattern instead.
 *
 * Scheme:
 *   utm_source   always "loot_works" (the site as source)
 *   utm_medium   always "internal"   (link from our own surfaces)
 *   utm_campaign domain bucket — "pro_purchase", "affiliate_signup", etc.
 *   utm_content  the placement slug — see docs/utm-tracking.md for the
 *                full registry of values used across the site.
 *
 * Use `withUTM(url, content, campaign?)` instead of hand-formatting
 * search params so the scheme stays consistent and changes are
 * cheap to make in one place.
 */

export function withUTM(url, content, campaign = "pro_purchase") {
  const u = new URL(url);
  u.searchParams.set("utm_source", "loot_works");
  u.searchParams.set("utm_medium", "internal");
  u.searchParams.set("utm_campaign", campaign);
  u.searchParams.set("utm_content", content);
  return u.toString();
}
