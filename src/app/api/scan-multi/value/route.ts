import { NextResponse, type NextRequest } from "next/server";
import { valuateBatch, type BatchValuation } from "@/lib/claude";

export interface ValueResponse {
  valuations: BatchValuation[];
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

  try {
    const valuations = await valuateBatch(items);
    return NextResponse.json({ valuations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Valuation failed";
    console.error("scan-multi/value error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
