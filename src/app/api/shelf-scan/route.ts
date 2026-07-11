import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { shelfScan, type ShelfScanResult } from "@/lib/claude";
import { FREE_SCAN_LIMIT } from "@/lib/limits";
import {
  ANON_SCAN_COOKIE,
  ANON_SCAN_FREE_LIMIT,
  readAnonScanCount,
  setAnonScanCookie,
} from "@/lib/anon-scan-gate";

interface ShelfScanBody {
  image?: string;
}

interface ShelfScanError {
  error: string;
  /** Set on 403 limit-exceeded responses so the paywall sheet can
   * render an accurate "X/N used" label. */
  scans_used?: number;
  scans_limit?: number;
  /** Set on the 401 signup_required response — user-facing copy for
   * the anon-scan wall. */
  message?: string;
}

interface ScanGateResult {
  /** Non-null means the caller must return this response immediately. */
  block: NextResponse<ShelfScanError> | null;
  /** True when this is an anonymous caller's first (free) scan — the
   * success handler needs to stamp the anon-scan cookie. */
  stampAnonCookie: boolean;
}

// Shelf scan counts as ONE scan against the daily limit even though
// it returns N items. Same threshold the barcode/vision route uses;
// keeping the gate logic literal-copied (rather than factored out)
// means each route can tune behavior independently if needed.
async function checkScanGate(req: NextRequest): Promise<ScanGateResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      const anonCount = readAnonScanCount(
        req.cookies.get(ANON_SCAN_COOKIE)?.value,
      );
      if (anonCount >= ANON_SCAN_FREE_LIMIT) {
        return {
          block: NextResponse.json(
            { error: "signup_required", message: "you've used your free scan" },
            { status: 401 },
          ),
          stampAnonCookie: false,
        };
      }
      return { block: null, stampAnonCookie: true };
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
    if (profileRow?.is_pro === true || isTestPro) {
      return { block: null, stampAnonCookie: false };
    }

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfDay.toISOString());
    const used = count ?? 0;
    if (used >= FREE_SCAN_LIMIT) {
      return {
        block: NextResponse.json(
          {
            error:
              "Daily scan limit reached. Upgrade to Pro for unlimited scans.",
            scans_used: used,
            scans_limit: FREE_SCAN_LIMIT,
          },
          { status: 403 },
        ),
        stampAnonCookie: false,
      };
    }
    return { block: null, stampAnonCookie: false };
  } catch (gateErr) {
    // If the gate query itself blows up (Supabase outage), let the
    // scan proceed — better to give a free user a freebie than to
    // 500 a paying user mid-flow. Same posture as the barcode route.
    console.error("Shelf-scan gate check failed:", gateErr);
    return { block: null, stampAnonCookie: false };
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

  const gate = await checkScanGate(req);
  if (gate.block) return gate.block;

  let result: ShelfScanResult;
  try {
    result = await shelfScan(body.image);
  } catch (err) {
    console.error("Shelf scan error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
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

  const res = NextResponse.json(result);
  if (gate.stampAnonCookie) setAnonScanCookie(res, ANON_SCAN_FREE_LIMIT);
  return res;
}
