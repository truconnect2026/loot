import { NextResponse, type NextRequest } from "next/server";
import { priceCheck, type PriceCheckResult } from "@/lib/claude";

interface PriceCheckBody {
  itemName?: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<PriceCheckResult | { error: string }>> {
  let body: PriceCheckBody;
  try {
    body = (await req.json()) as PriceCheckBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const itemName = (body.itemName ?? "").trim();
  if (!itemName) {
    return NextResponse.json({ error: "Missing itemName" }, { status: 400 });
  }

  try {
    const result = await priceCheck(itemName);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Price check failed";
    console.error("Price check error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
