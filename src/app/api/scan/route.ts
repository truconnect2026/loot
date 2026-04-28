import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { lookupUpc } from "@/lib/upc";
import { searchSoldComps, medianPrice } from "@/lib/ebay";
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
  comps: number;
  roi: number;
  reasoning: string;
  listingTitle: string;
  listingDescription: string;
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
    let brand: string | undefined;
    let category: string | undefined;
    let imageUrl: string | null = null;

    if (body.type === "barcode") {
      if (!body.upc) {
        return NextResponse.json({ error: "Missing upc" }, { status: 400 });
      }
      upc = body.upc.trim();

      const product = await lookupUpc(upc);
      if (!product) {
        return NextResponse.json(
          { error: `No product found for UPC ${upc}` },
          { status: 404 }
        );
      }
      itemName = product.title;
      brand = product.brand;
      category = product.category;
      imageUrl = product.imageUrl ?? null;
    } else if (body.type === "vision") {
      if (!body.image) {
        return NextResponse.json({ error: "Missing image" }, { status: 400 });
      }
      const identified = await identifyFromImage(body.image);
      itemName = identified.name;
      brand = identified.brand ?? undefined;
      category = identified.category ?? undefined;
    } else {
      return NextResponse.json({ error: "Invalid scan type" }, { status: 400 });
    }

    // eBay sold comps for the identified item.
    const query = brand ? `${brand} ${itemName}` : itemName;
    const comps = await searchSoldComps(query, 10);
    const median = medianPrice(comps);

    // Claude verdict.
    const verdict = await getVerdict({
      itemName,
      cost,
      comps,
      brand,
      category,
    });

    const sellPrice = verdict.sellPrice || median || 0;
    const profit = verdict.profit || sellPrice - verdict.fee - cost;
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
          comps_data: comps,
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
      comps: comps.length,
      roi,
      reasoning: verdict.reasoning,
      listingTitle: verdict.listingTitle,
      listingDescription: verdict.listingDescription,
      imageUrl,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    console.error("Scan error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
