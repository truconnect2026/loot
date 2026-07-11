import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { lookupUpc } from "@/lib/upc";
import {
  getVerdict,
  identifyFromImage,
  type PlatformRankEntry,
  type SellSpeed,
} from "@/lib/claude";
import { FREE_SCAN_LIMIT } from "@/lib/limits";
import {
  ANON_SCAN_COOKIE,
  ANON_SCAN_FREE_LIMIT,
  readAnonScanCount,
  setAnonScanCookie,
} from "@/lib/anon-scan-gate";

interface ScanRequestBody {
  type: "barcode" | "vision" | "known";
  upc?: string;
  image?: string;
  itemName?: string;
  category?: string;
  cost?: number;
}

export interface ScanResponse {
  method: "barcode" | "vision";
  name: string;
  upc: string | null;
  cost: number;
  sell: number;
  profit: number;
  verdict: "BUY" | "PASS" | "MAYBE";
  platform: string;
  fee: number;
  confidence: "high" | "medium" | "low";
  roi: number;
  reasoning: string;
  imageUrl: string | null;
  daysToSell: number;
  sellSpeed: SellSpeed;
  platformRanking: PlatformRankEntry[];
  /** Real take-home after platform fees + shipping. */
  netProfit: number;
  /** Item appears to be at retail price — VerdictSheet renders a
   * warning banner above the verdict pill when true. */
  retailArbitrage: boolean;
}

interface ScanError {
  error: string;
  /** Set on 403 limit-exceeded responses so the paywall sheet can
   * render an accurate "X/N used" label. */
  scans_used?: number;
  scans_limit?: number;
  /** Set on the 401 signup_required response — user-facing copy for
   * the anon-scan wall. */
  message?: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ScanResponse | ScanError>> {
  let body: ScanRequestBody;
  try {
    body = (await req.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cost = typeof body.cost === "number" && body.cost >= 0 ? body.cost : 0;

  // Anonymous callers get exactly one free scan (signed httpOnly cookie),
  // then a 401 the frontend turns into a signup wall. Set below the try
  // block so the success-response handler can stamp the cookie.
  let stampAnonScanCookie = false;

  // Subscription gate — Pro users skip; free users capped at the
  // FREE_SCAN_LIMIT centralized in lib/limits.ts.
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
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
      }
    } else {
      const anonCount = readAnonScanCount(
        req.cookies.get(ANON_SCAN_COOKIE)?.value,
      );
      if (anonCount >= ANON_SCAN_FREE_LIMIT) {
        return NextResponse.json(
          {
            error: "signup_required",
            message: "you've used your free scan",
          },
          { status: 401 },
        );
      }
      stampAnonScanCookie = true;
    }
  } catch (gateErr) {
    // If the gate query itself blew up (Supabase outage), let the
    // scan proceed — better to give a free user a freebie than to
    // 500 a paying user mid-flow.
    console.error("Scan gate check failed:", gateErr);
  }

  try {
    let itemName: string;
    let upc: string | null = null;
    let imageUrl: string | null = null;
    let imageDescription: string | undefined;

    if (body.type === "barcode") {
      if (!body.upc) {
        return NextResponse.json({ error: "Missing upc" }, { status: 400 });
      }
      upc = body.upc.trim();

      let product;
      try {
        product = await lookupUpc(upc);
      } catch {
        return NextResponse.json(
          {
            error:
              "Could not identify this UPC. Try AI Vision instead.",
          },
          { status: 404 }
        );
      }
      if (!product || !product.title) {
        return NextResponse.json(
          {
            error:
              "Could not identify this UPC. Try AI Vision instead.",
          },
          { status: 404 }
        );
      }
      itemName = product.brand
        ? `${product.brand} ${product.title}`
        : product.title;
      imageUrl = product.imageUrl ?? null;
    } else if (body.type === "vision") {
      if (!body.image) {
        return NextResponse.json({ error: "Missing image" }, { status: 400 });
      }
      const identified = await identifyFromImage(body.image);
      itemName = identified.brand
        ? `${identified.brand} ${identified.name}`
        : identified.name;
      imageDescription = identified.category ?? undefined;
    } else if (body.type === "known") {
      if (!body.itemName || typeof body.itemName !== "string") {
        return NextResponse.json({ error: "Missing itemName" }, { status: 400 });
      }
      itemName = body.itemName.trim();
      imageDescription = body.category ?? undefined;
    } else {
      return NextResponse.json({ error: "Invalid scan type" }, { status: 400 });
    }

    // Claude Haiku does the entire pricing + verdict on its own — no comps API.
    const verdict = await getVerdict({
      itemName,
      cost,
      imageDescription,
    });

    const sellPrice = verdict.sellPrice;
    const profit =
      typeof verdict.profit === "number"
        ? verdict.profit
        : sellPrice - verdict.fee - cost;
    const roi = cost > 0 ? Math.round((profit / cost) * 100) : 0;

    // Persist the scan if the user is authenticated. Anonymous users still
    // get a verdict back; we just skip the haul log row.
    try {
      const supabase = await createServerSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("scans").insert({
          user_id: userData.user.id,
          method: body.type === "known" ? "vision" : body.type,
          item_name: itemName,
          upc,
          cost,
          sell_price: sellPrice,
          profit,
          verdict: verdict.verdict,
          platform: verdict.platform,
          fee: verdict.fee,
          comps_data: { confidence: verdict.confidence, reasoning: verdict.reasoning },
          image_url: imageUrl,
        });
      }
    } catch (persistErr) {
      // Don't fail the user-facing response just because logging broke.
      console.error("Failed to persist scan:", persistErr);
    }

    const response: ScanResponse = {
      method: body.type === "known" ? "vision" : body.type,
      name: itemName,
      upc,
      cost,
      sell: sellPrice,
      profit,
      verdict: verdict.verdict,
      platform: verdict.platform,
      fee: verdict.fee,
      confidence: verdict.confidence,
      roi,
      reasoning: verdict.reasoning,
      imageUrl,
      daysToSell: verdict.daysToSell,
      sellSpeed: verdict.sellSpeed,
      platformRanking: verdict.platformRanking,
      netProfit: verdict.netProfit,
      retailArbitrage: verdict.retailArbitrage,
    };

    const res = NextResponse.json(response);
    if (stampAnonScanCookie) setAnonScanCookie(res, ANON_SCAN_FREE_LIMIT);
    return res;
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
