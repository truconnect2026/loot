import { NextResponse, type NextRequest } from "next/server";
import { shelfScan, type ShelfScanResult } from "@/lib/claude";

interface ShelfScanBody {
  image?: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ShelfScanResult | { error: string }>> {
  let body: ShelfScanBody;
  try {
    body = (await req.json()) as ShelfScanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  try {
    const result = await shelfScan(body.image);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Shelf scan failed";
    console.error("Shelf scan error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
