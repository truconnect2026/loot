import { NextResponse, type NextRequest } from "next/server";
import { valuateBatch, type BatchValuation } from "@/lib/claude";
import { correctName } from "@/lib/correctNames";
import { deriveMetrics, applyValueFloors } from "@/lib/deriveMetrics";
import { normalizeMetrics } from "@/lib/normalizeMetrics";
import { groupSeries } from "@/lib/groupSeries";

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
    lotMemberCount: number;
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
    // Correct garbled names before Claude prices them and before grouping.
    const rawNameMap = new Map<number, string>();
    const correctedItems = items.map((it) => {
      const result = correctName(it.name, it.category);
      if (result.corrected) rawNameMap.set(it.index, it.name);
      return { ...it, name: result.name };
    });

    const valuations = await valuateBatch(correctedItems);
    const withMetrics = valuations.map((v) => ({
      ...v,
      rawName: rawNameMap.get(v.index),
      ...deriveMetrics(v),
    }));
    const normalized = normalizeMetrics(withMetrics);
    const floored = applyValueFloors(normalized);
    const grouped = groupSeries(floored);
    const buyCount = grouped.filter((v) => v.verdict === "BUY").length;
    const maybeCount = grouped.filter((v) => v.verdict === "MAYBE").length;
    const passCount = grouped.filter((v) => v.verdict === "PASS").length;
    const verifyCount = grouped.filter((v) => v.needsVerify).length;
    const anchors = grouped.filter((v) => v.groupRole === "lot-anchor");
    const lotMemberCount = grouped.filter((v) => v.groupRole === "lot-member").length;
    return NextResponse.json({
      valuations: grouped,
      _debug: {
        inputCount: items.length,
        valuedCount: grouped.length,
        buyCount,
        maybeCount,
        passCount,
        verifyCount,
        groupCount: anchors.length,
        lotMemberCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Valuation failed";
    console.error("scan-multi/value error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
