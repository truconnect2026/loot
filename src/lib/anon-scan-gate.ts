import "server-only";
import { createHmac } from "crypto";
import type { NextResponse } from "next/server";

/**
 * One-free-scan gate for anonymous (logged-out) callers of /api/scan
 * and /api/shelf-scan. Separate from the is_pro / FREE_SCAN_LIMIT gate,
 * which only applies to authenticated users.
 *
 * The cookie value is `${count}.${hmac}` — signed with the Supabase
 * service-role key (already a server-only secret every deployment has,
 * so this doesn't need its own env var) so a visitor can't just edit
 * the cookie in devtools to reset their count. httpOnly keeps it out
 * of reach of page JS entirely.
 */

export const ANON_SCAN_COOKIE = "loot_anon_scans";
export const ANON_SCAN_FREE_LIMIT = 1;
const ANON_SCAN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

function sign(raw: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", secret).update(raw).digest("hex").slice(0, 16);
}

/** Reads + verifies the cookie value; tampered or missing → treated as 0. */
export function readAnonScanCount(cookieValue: string | undefined): number {
  if (!cookieValue) return 0;
  const dot = cookieValue.lastIndexOf(".");
  if (dot < 0) return 0;
  const raw = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (sig !== sign(raw)) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Stamps the signed anon-scan cookie on a response after a free scan runs. */
export function setAnonScanCookie(res: NextResponse, count: number): void {
  const raw = String(count);
  res.cookies.set(ANON_SCAN_COOKIE, `${raw}.${sign(raw)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ANON_SCAN_COOKIE_MAX_AGE,
    path: "/",
  });
}
