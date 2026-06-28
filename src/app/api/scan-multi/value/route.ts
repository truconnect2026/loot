import { NextResponse, type NextRequest } from "next/server";
import { valuateBatch, type BatchValuation } from "@/lib/claude";

export interface ValueResponse {
  valuations: BatchValuation[];
  _debug: {
    inputCount: number;
    valuedCount: number;
    buyCount: number;
    maybeCount: number;
    passCount: number;
    verifyCount: number;
    groupCount: number;
  };
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
    const buyCount = valuations.filter((v) => v.verdict === "BUY").length;
    const maybeCount = valuations.filter((v) => v.verdict === "MAYBE").length;
    const passCount = valuations.filter((v) => v.verdict === "PASS").length;
    const verifyCount = valuations.filter((v) => v.needsVerify).length;
    const groupIds = new Set(
      valuations.map((v) => v.groupId).filter((g): g is string => g !== null),
    );
    return NextResponse.json({
      valuations,
      _debug: {
        inputCount: items.length,
        valuedCount: valuations.length,
        buyCount,
        maybeCount,
        passCount,
        verifyCount,
        groupCount: groupIds.size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Valuation failed";
    console.error("scan-multi/value error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
