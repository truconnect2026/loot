import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { shelfScan, type ShelfScanResult } from "@/lib/claude";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

interface ShelfScanBody {
  image?: string;
}

interface ShelfScanError {
  error: string;
  /** Set on 403 limit-exceeded responses so the paywall sheet can
   * render an accurate "X/N used" label. */
  scans_used?: number;
  scans_limit?: number;
}

// Shelf scan counts as ONE scan against the daily limit even though
// it returns N items. Same threshold the barcode/vision route uses;
// keeping the gate logic literal-copied (rather than factored out)
// means each route can tune behavior independently if needed.
async function checkScanGate(
  req: NextRequest,
): Promise<NextResponse<ShelfScanError> | null> {
  void req; // keeping the signature symmetric with the future fanout
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();
    if (profileRow?.is_pro === true) return null;

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfDay.toISOString());
    const used = count ?? 0;
    if (used >= FREE_SCAN_LIMIT) {
      return NextResponse.json(
        {
          error:
            "Daily scan limit reached. Upgrade to Pro for unlimited scans.",
          scans_used: used,
          scans_limit: FREE_SCAN_LIMIT,
        },
        { status: 403 },
      );
    }
    return null;
  } catch (gateErr) {
    // If the gate query itself blows up (Supabase outage), let the
    // scan proceed — better to give a free user a freebie than to
    // 500 a paying user mid-flow. Same posture as the barcode route.
    console.error("Shelf-scan gate check failed:", gateErr);
    return null;
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ShelfScanResult | ShelfScanError>> {
  let body: ShelfScanBody;
  try {
    body = (await req.json()) as ShelfScanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const gateResponse = await checkScanGate(req);
  if (gateResponse) return gateResponse;

  let result: ShelfScanResult;
  try {
    result = await shelfScan(body.image);
  } catch (err) {
    const message =
      err instanceof Error
        ? `Shelf scan failed: ${err.message}`
        : "Shelf scan failed";
    console.error("Shelf scan error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Persist a single rolled-up row so the haul log doesn't get flooded
  // with one row per detected item. Aggregates are summed across BUY
  // items only — those are the items the user would actually grab —
  // so the today's-profit numbers reflect realistic intent rather
  // than including PASS items the user wouldn't touch. The full
  // per-item array lives in comps_data for reconstruction later if
  // a "view shelf history" feature ships.
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const buys = result.items.filter((i) => i.verdict === "BUY");
      const maybes = result.items.filter((i) => i.verdict === "MAYBE");
      const aggCost = buys.reduce((s, i) => s + i.cost, 0);
      const aggProfit = buys.reduce((s, i) => s + i.profit, 0);
      const aggSell = aggCost + aggProfit;
      const aggregateVerdict =
        buys.length > 0 ? "BUY" : maybes.length > 0 ? "MAYBE" : "PASS";

      await supabase.from("scans").insert({
        user_id: userData.user.id,
        method: "shelf",
        item_name: `Shelf scan: ${result.items.length} item${
          result.items.length === 1 ? "" : "s"
        }`,
        cost: aggCost,
        sell_price: aggSell,
        profit: aggProfit,
        verdict: aggregateVerdict,
        platform: "Mixed",
        fee: 0,
        comps_data: { items: result.items },
      });
    }
  } catch (persistErr) {
    // Don't fail the user-facing response just because logging broke.
    console.error("Failed to persist shelf scan:", persistErr);
  }

  return NextResponse.json(result);
}
