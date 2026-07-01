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

/** Free-tier single-scan allowance. Set to 0 to remove the free tier entirely.
 *  A non-Pro user hitting /api/scan or /api/shelf-scan always gets 403. */
export const FREE_SCAN_LIMIT = 0;

/** Hard monthly ceiling on shelf scans for Pro users.
 *  Only applies to /api/scan-multi/detect (the expensive vision call).
 *  Single scans (/api/scan) stay unlimited for Pro. */
export const PRO_MONTHLY_SHELF_SCAN_LIMIT = 500;

/** Minimum registered-user count before social proof copy is shown on the
 *  upgrade and profile cards. Below this number nothing renders — no
 *  fabricated stats, no guesses. */
export const SOCIAL_PROOF_MIN = 500;
