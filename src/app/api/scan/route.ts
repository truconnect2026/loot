import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { lookupUpc } from "@/lib/upc";
import { getVerdict, identifyFromImage } from "@/lib/claude";

interface ScanRequestBody {
  type: "barcode" | "vision";
  upc?: string;
  image?: string;
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
}

interface ScanError {
  error: string;
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
          method: body.type,
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
      method: body.type,
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
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    console.error("Scan error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
