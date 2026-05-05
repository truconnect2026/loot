/**
 * Single source of truth for free-tier usage limits.
 *
 * The daily scan limit is enforced server-side in /api/scan and
 * /api/shelf-scan, surfaced read-only to the dashboard via
 * /api/scan-count, and reflected in user-facing copy on the scan-
 * count pill + the PaywallSheet. Every consumer imports from here
 * so a future tier change (e.g. 3 → 5 promo, or weekly limits)
 * lands in one file.
 */

export const FREE_DAILY_LIMIT = 3;
