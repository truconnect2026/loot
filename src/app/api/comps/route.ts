import { NextResponse, type NextRequest } from "next/server";
import { fetchSoldComps } from "@/lib/claude";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

// Spend gate — mirrors the /api/shelf-scan auth pattern (same client
// construction, same profiles.is_pro + PRO_TEST_EMAILS check, same
// 401/403 body shapes). Pro-only: FREE_SCAN_LIMIT is 0, so a non-Pro
// or anonymous caller can never reach the Claude call below. Returns a
// response to send immediately, or null when the caller may proceed.
async function checkSpendGate(): Promise<NextResponse<{
  error: string;
  message?: string;
  scans_used?: number;
  scans_limit?: number;
}> | null> {
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
    console.error("Spend gate check failed:", gateErr);
    return null;
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  let body: { itemName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { itemName } = body;
  if (!itemName || typeof itemName !== "string") {
    return NextResponse.json(
      { error: "Provide { itemName: string }" },
      { status: 400 },
    );
  }
  const gate = await checkSpendGate();
  if (gate) return gate;
  const comps = await fetchSoldComps(itemName.trim());
  return NextResponse.json({ comps });
}
