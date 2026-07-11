import { NextResponse, type NextRequest } from "next/server";

import { flipCoach, type FlipCoachTurn } from "@/lib/claude";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

interface FlipCoachBody {
  message?: string;
  history?: Array<{ role?: string; content?: string }>;
}

interface FlipCoachResponse {
  response: string;
}

interface FlipCoachError {
  error: string;
  message?: string;
  scans_used?: number;
  scans_limit?: number;
}

// Spend gate — the same Pro-only gate the other Claude-spend routes use.
// FREE_SCAN_LIMIT is 0: the free tier gets NOTHING that spends, so a
// non-Pro or anonymous caller can never reach the Claude call below.
// Anon → 401 signup_required, authenticated non-Pro → 403 (paywall body
// shape). Fail-open on a gate exception, matching /api/scan +
// /api/shelf-scan.
async function checkSpendGate(): Promise<NextResponse<FlipCoachError> | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        { error: "signup_required", message: "sign in to use this tool" },
        { status: 401 },
      );
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
    if (profileRow?.is_pro === true || isTestPro) return null;
    return NextResponse.json(
      {
        error: "Upgrade to Pro for unlimited scans.",
        scans_used: 0,
        scans_limit: FREE_SCAN_LIMIT,
      },
      { status: 403 },
    );
  } catch (gateErr) {
    // Fail-open on gate error, matching /api/scan + /api/shelf-scan:
    // don't 500 a paying user mid-flow during a Supabase blip.
    console.error("[flip-coach] gate failed, proceeding:", gateErr);
    return null;
  }
}

/**
 * POST /api/flip-coach
 *
 * Stateless: history travels in the request body. Flip Coach is a
 * Pro-only feature — anonymous → 401, free (non-Pro) → 403. The free
 * tier gets nothing that spends (FREE_SCAN_LIMIT = 0); there is no
 * free-tier message counter.
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

  const gate = await checkSpendGate();
  if (gate) return gate;

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
    return NextResponse.json({ response });
  } catch (err) {
    console.error("Flip coach error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
