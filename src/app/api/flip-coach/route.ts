import { NextResponse, type NextRequest } from "next/server";

import { flipCoach, type FlipCoachTurn } from "@/lib/claude";

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
