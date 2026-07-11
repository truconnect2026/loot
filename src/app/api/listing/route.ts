import { NextResponse, type NextRequest } from "next/server";

import { generateListing } from "@/lib/claude";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

interface ListingRequestBody {
  itemName: string;
  sellPrice: number;
  reasoning?: string;
}

export interface ListingResponse {
  title: string;
  description: string;
  suggestedPrice: number;
}

interface ListingError {
  error: string;
}

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
  req: NextRequest
): Promise<NextResponse<ListingResponse | ListingError>> {
  let body: ListingRequestBody;
  try {
    body = (await req.json()) as ListingRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.itemName || typeof body.sellPrice !== "number") {
    return NextResponse.json(
      { error: "Missing itemName or sellPrice" },
      { status: 400 }
    );
  }

  try {
  const gate = await checkSpendGate();
  if (gate) return gate;
    const listing = await generateListing({
      itemName: body.itemName,
      sellPrice: body.sellPrice,
      reasoning: body.reasoning,
    });
    return NextResponse.json(listing);
  } catch (err) {
    console.error("Listing error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
