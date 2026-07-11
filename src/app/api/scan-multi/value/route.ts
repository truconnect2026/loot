import { NextResponse, type NextRequest } from "next/server";
import { valuateBatch, type BatchValuation } from "@/lib/claude";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";
import { correctName } from "@/lib/correctNames";
import { deriveMetrics, applyValueFloors } from "@/lib/deriveMetrics";
import { normalizeMetrics } from "@/lib/normalizeMetrics";
import { groupSeries } from "@/lib/groupSeries";

export interface ValueResponse {
  valuations: BatchValuation[];
  _debug: {
    inputCount: number;
    valuedCount: number;
    buyCount: number;
    maybeCount: number;
    passCount: number;
    verifyCount: number;
    groupCount: number;
    lotMemberCount: number;
  };
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
  req: NextRequest,
): Promise<NextResponse<ValueResponse | { error: string }>> {
  let body: { items?: { index: number; name: string; category: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { items } = body;
  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "Provide { items: [{ index, name, category }] }" },
      { status: 400 },
    );
  }

  const gate = await checkSpendGate();
  if (gate) return gate;
  try {
    // Correct garbled names before Claude prices them and before grouping.
    const rawNameMap = new Map<number, string>();
    const correctedItems = items.map((it) => {
      const result = correctName(it.name, it.category);
      if (result.corrected) rawNameMap.set(it.index, it.name);
      return { ...it, name: result.name };
    });

    const valuations = await valuateBatch(correctedItems);
    const withMetrics = valuations.map((v) => ({
      ...v,
      rawName: rawNameMap.get(v.index),
      ...deriveMetrics(v),
    }));
    const normalized = normalizeMetrics(withMetrics);
    const floored = applyValueFloors(normalized);
    const grouped = groupSeries(floored);
    const buyCount = grouped.filter((v) => v.verdict === "BUY").length;
    const maybeCount = grouped.filter((v) => v.verdict === "MAYBE").length;
    const passCount = grouped.filter((v) => v.verdict === "PASS").length;
    const verifyCount = grouped.filter((v) => v.needsVerify).length;
    const anchors = grouped.filter((v) => v.groupRole === "lot-anchor");
    const lotMemberCount = grouped.filter((v) => v.groupRole === "lot-member").length;
    return NextResponse.json({
      valuations: grouped,
      _debug: {
        inputCount: items.length,
        valuedCount: grouped.length,
        buyCount,
        maybeCount,
        passCount,
        verifyCount,
        groupCount: anchors.length,
        lotMemberCount,
      },
    });
  } catch (err) {
    console.error("scan-multi/value error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
