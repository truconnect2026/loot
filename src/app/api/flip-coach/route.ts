import { NextResponse, type NextRequest } from "next/server";

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
}

/**
 * POST /api/flip-coach
 *
 * Stateless: history travels in the request body. The 3/day free-
 * tier limit is enforced on the client (localStorage with a date
 * key) so this server route doesn't need a counter table.
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

  // Auth gate — anonymous callers can no longer reach the Claude call.
  // (The authenticated free-tier daily limit is enforced in the
  // signed-cookie counter added by the flip-coach rate-limit pass.)
  // Fail-open on a gate exception, matching /api/scan + /api/shelf-scan.
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { error: "signup_required" },
        { status: 401 },
      );
    }
  } catch (gateErr) {
    console.error("[flip-coach] auth gate failed, proceeding:", gateErr);
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
    return NextResponse.json({ response });
  } catch (err) {
    const m = err instanceof Error ? err.message : "Coach request failed";
    console.error("Flip coach error:", err);
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
