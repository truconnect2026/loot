import { NextResponse, type NextRequest } from "next/server";
import { createHmac } from "crypto";

import { flipCoach, type FlipCoachTurn } from "@/lib/claude";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface FlipCoachBody {
  message?: string;
  history?: Array<{ role?: string; content?: string }>;
}

interface FlipCoachResponse {
  response: string;
}

interface FlipCoachError {
  error: string;
  used?: number;
  limit?: number;
}

// ── Free-tier daily counter (signed httpOnly cookie) ──────────────────────────
// Mirrors FlipCoachSheet's client-side FREE_DAILY_LIMIT = 3. The client
// localStorage check is a UX fast-path; THIS is the authority.
//
// Why a cookie and not a DB row: the ideal is a per-user daily count in
// Postgres, but the scans table's method CHECK constraint
// ('barcode','vision','shelf') blocks a 'flip_coach' method, and adding
// a new table or column is a migration — out of scope for this pass.
// This reuses the exact signed-cookie technique already shipped in
// src/lib/anon-scan-gate.ts: value is `${utcDay}:${count}.${hmac}`,
// HMAC-signed with the service-role key so it can't be forged, httpOnly
// so page JS can't touch it. Clearing cookies resets the count (same
// caveat as the existing anon-scan cookie) — a durable DB counter is
// the follow-up once a migration is approved.
const FLIP_COACH_COOKIE = "loot_flipcoach";
const FLIP_COACH_FREE_DAILY_LIMIT = 3;

function fcSign(raw: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", secret).update(raw).digest("hex").slice(0, 16);
}

function fcTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
}

/** Verified count for TODAY; tampered / stale-day / missing → 0. */
function fcReadCount(cookieValue: string | undefined): number {
  if (!cookieValue) return 0;
  const dot = cookieValue.lastIndexOf(".");
  if (dot < 0) return 0;
  const raw = cookieValue.slice(0, dot);
  if (cookieValue.slice(dot + 1) !== fcSign(raw)) return 0;
  const sep = raw.indexOf(":");
  if (sep < 0 || raw.slice(0, sep) !== fcTodayKey()) return 0;
  const n = Number(raw.slice(sep + 1));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Stamps today's count on the response after a successful free-tier turn. */
function fcSetCount(res: NextResponse, count: number): void {
  const raw = `${fcTodayKey()}:${count}`;
  res.cookies.set(FLIP_COACH_COOKIE, `${raw}.${fcSign(raw)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 48, // 48h; the UTC-day key drives the real daily reset
    path: "/",
  });
}

/**
 * POST /api/flip-coach
 *
 * Stateless: history travels in the request body. Anonymous → 401.
 * Free tier is capped server-side at FLIP_COACH_FREE_DAILY_LIMIT/day via
 * a signed httpOnly cookie (client localStorage is only a UX fast-path);
 * Pro users are unlimited.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<FlipCoachResponse | FlipCoachError>> {
  let body: FlipCoachBody;
  try {
    body = (await req.json()) as FlipCoachBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // Auth + free-tier daily limit. Anonymous → 401. Free users capped at
  // FLIP_COACH_FREE_DAILY_LIMIT/day (429 over limit); Pro → unlimited.
  // freeCount non-null means "stamp count+1 on the success response".
  // Fail-open on a gate exception, matching /api/scan + /api/shelf-scan.
  let freeCount: number | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: "signup_required" }, { status: 401 });
    }
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();
    const testProEmails = (process.env.PRO_TEST_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isTestPro = user.email
      ? testProEmails.includes(user.email.toLowerCase())
      : false;
    const isPro = profileRow?.is_pro === true || isTestPro;
    if (!isPro) {
      const used = fcReadCount(req.cookies.get(FLIP_COACH_COOKIE)?.value);
      if (used >= FLIP_COACH_FREE_DAILY_LIMIT) {
        return NextResponse.json(
          { error: "daily_limit", used, limit: FLIP_COACH_FREE_DAILY_LIMIT },
          { status: 429 },
        );
      }
      freeCount = used;
    }
  } catch (gateErr) {
    console.error("[flip-coach] gate failed, proceeding:", gateErr);
  }

  // Sanitize history → only valid turns, capped at 20 (claude.ts also
  // slices, but trimming early keeps us from passing junk through).
  const history: FlipCoachTurn[] = Array.isArray(body.history)
    ? body.history
        .map((t) => {
          const role =
            t?.role === "user" || t?.role === "assistant" ? t.role : null;
          const content = typeof t?.content === "string" ? t.content : "";
          if (!role || !content) return null;
          return { role, content } as FlipCoachTurn;
        })
        .filter((t): t is FlipCoachTurn => t !== null)
        .slice(-20)
    : [];

  try {
    const response = await flipCoach({ message, history });
    const res = NextResponse.json({ response });
    // Count this turn only after a successful (billable) response, so a
    // failed Claude call doesn't burn a free user's daily allotment.
    if (freeCount !== null) fcSetCount(res, freeCount + 1);
    return res;
  } catch (err) {
    console.error("Flip coach error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
