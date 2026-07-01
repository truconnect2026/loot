import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { identifyMultiFromImageDebug, type MultiDetectItem } from "@/lib/claude";
import { PRO_MONTHLY_SHELF_SCAN_LIMIT } from "@/lib/limits";

export interface DetectResponse {
  items: MultiDetectItem[];
  _debug: { rawText: string; parsedCount: number };
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<DetectResponse | { error: string; used?: number; limit?: number }>> {
  let body: { image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image } = body;
  if (!image || typeof image !== "string") {
    return NextResponse.json(
      { error: "Provide { image: base64string }" },
      { status: 400 },
    );
  }

  // ── Auth + Pro monthly cap ──────────────────────────────────────────────────
  // Pro users are capped at PRO_MONTHLY_SHELF_SCAN_LIMIT shelf scans/month.
  // Free users: no additional gate here (existing free-tier applies on /api/scan).
  // If the gate check itself fails, log and proceed rather than blocking a paying user.
  let authedUserId: string | null = null;
  let isPro = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (user) {
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
      isPro = profileRow?.is_pro === true || isTestPro;

      if (isPro) {
        // Count method='shelf' rows this calendar month (UTC).
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("scans")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("method", "shelf")
          .gte("created_at", startOfMonth.toISOString());

        const used = count ?? 0;
        console.log(
          `[SHELF-LIMIT] pro=${isPro} used=${used}/${PRO_MONTHLY_SHELF_SCAN_LIMIT}`,
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
      } else {
        // Free user — log but don't gate here.
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("scans")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("method", "shelf")
          .gte("created_at", startOfMonth.toISOString());
        console.log(
          `[SHELF-LIMIT] pro=${isPro} used=${count ?? 0}/${PRO_MONTHLY_SHELF_SCAN_LIMIT}`,
        );
      }
    } else {
      console.log("[SHELF-LIMIT] pro=false (unauthenticated)");
    }
  } catch (gateErr) {
    console.error("[SHELF-LIMIT] gate check failed, proceeding:", gateErr);
  }

  // ── Run detection ───────────────────────────────────────────────────────────
  try {
    const { items, rawText, parsedCount } = await identifyMultiFromImageDebug(image);

    // Record the shelf scan so the monthly count stays accurate.
    if (authedUserId) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase.from("scans").insert({
          user_id: authedUserId,
          method: "shelf",
          item_name: `Shelf scan: ${items.length} item${items.length === 1 ? "" : "s"} detected`,
        });
      } catch (writeErr) {
        // Non-fatal — don't block the response if the write fails.
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
