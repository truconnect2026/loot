import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { identifyMultiFromImageDebug, identifyCrateStripsDebug, type MultiDetectItem } from "@/lib/claude";
import { PRO_MONTHLY_SHELF_SCAN_LIMIT, FREE_SCAN_LIMIT } from "@/lib/limits";

export interface DetectResponse {
  items: MultiDetectItem[];
  _debug: { rawText: string; parsedCount: number };
}

export async function POST(
  req: NextRequest,
): Promise<
  NextResponse<
    | DetectResponse
    | {
        error: string;
        message?: string;
        used?: number;
        limit?: number;
        scans_used?: number;
        scans_limit?: number;
      }
  >
> {
  let body: { image?: string; mode?: string; crops?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, mode, crops } = body;
  const isCrate = mode === "crate";

  if (!isCrate && (!image || typeof image !== "string")) {
    return NextResponse.json(
      { error: "Provide { image: base64string } or { mode: 'crate', crops: [] }" },
      { status: 400 },
    );
  }
  if (isCrate && (!Array.isArray(crops) || crops.length === 0)) {
    return NextResponse.json(
      { error: "Crate mode requires { crops: string[] }" },
      { status: 400 },
    );
  }

  // ── Auth + Pro gate ─────────────────────────────────────────────────────────
  // ENFORCED (was previously log-but-don't-gate). Mirror of
  // /api/shelf-scan's checkScanGate: anonymous → 401, free (non-Pro) →
  // 403, Pro → monthly cap of PRO_MONTHLY_SHELF_SCAN_LIMIT. The single
  // try/catch fails open ONLY on a gate-query exception (never 500s a
  // paying user mid-flow) — same posture as /api/scan + /api/shelf-scan.
  let authedUserId: string | null = null;

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
    authedUserId = user.id;

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
      return NextResponse.json(
        {
          error: "Upgrade to Pro for unlimited scans.",
          scans_used: 0,
          scans_limit: FREE_SCAN_LIMIT,
        },
        { status: 403 },
      );
    }

    // Pro monthly cap — count method IN (shelf,crate) this calendar month (UTC).
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("method", ["shelf", "crate"])
      .gte("created_at", startOfMonth.toISOString());

    const used = count ?? 0;
    console.log(
      `[SHELF-LIMIT] pro=true used=${used}/${PRO_MONTHLY_SHELF_SCAN_LIMIT} (includes crate)`,
    );

    if (used >= PRO_MONTHLY_SHELF_SCAN_LIMIT) {
      return NextResponse.json(
        {
          error: "monthly_limit",
          used,
          limit: PRO_MONTHLY_SHELF_SCAN_LIMIT,
        },
        { status: 429 },
      );
    }
  } catch (gateErr) {
    console.error("[SHELF-LIMIT] gate check failed, proceeding:", gateErr);
  }

  // ── Run detection ───────────────────────────────────────────────────────────
  try {
    const { items, rawText, parsedCount } = isCrate
      ? await identifyCrateStripsDebug(crops!)
      : await identifyMultiFromImageDebug(image!);

    // Record the scan so the monthly count stays accurate.
    if (authedUserId) {
      try {
        const supabase = await createServerSupabaseClient();
        const scanMethod = isCrate ? "crate" : "shelf";
        await supabase.from("scans").insert({
          user_id: authedUserId,
          method: scanMethod,
          item_name: isCrate
            ? `Crate scan: ${items.length} strip${items.length === 1 ? "" : "s"} identified`
            : `Shelf scan: ${items.length} item${items.length === 1 ? "" : "s"} detected`,
        });
      } catch (writeErr) {
        console.error("[SHELF-LIMIT] scan write failed:", writeErr);
      }
    }

    return NextResponse.json({
      items,
      _debug: { rawText: rawText.slice(0, 3000), parsedCount },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    console.error("scan-multi/detect error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
