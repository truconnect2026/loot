import { NextResponse, type NextRequest } from "next/server";
import { identifyMultiFromImage, getVerdict } from "@/lib/claude";

export interface ScanMultiTestItem {
  name: string;
  brand: string;
  category: string;
  bbox: [number, number, number, number];
  detectConfidence: "high" | "medium" | "low";
  verdict: "BUY" | "PASS" | "MAYBE";
  sellPrice: number;
  reasoning: string;
}

export interface ScanMultiTestResponse {
  items: ScanMultiTestItem[];
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ScanMultiTestResponse | { error: string }>> {
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

  let detected;
  try {
    detected = await identifyMultiFromImage(image);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    console.error("scan-multi-test detection error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Run all valuations in parallel; a single failure doesn't abort the batch.
  const verdicts = await Promise.all(
    detected.map(async (item) => {
      try {
        return await getVerdict({
          itemName: item.name,
          cost: 0,
          imageDescription: item.category || undefined,
        });
      } catch {
        return null;
      }
    }),
  );

  const items: ScanMultiTestItem[] = detected.map((item, idx) => {
    const v = verdicts[idx];
    return {
      name: item.name,
      brand: item.brand,
      category: item.category,
      bbox: item.bbox,
      detectConfidence: item.confidence,
      verdict: v?.verdict ?? "MAYBE",
      sellPrice: v?.sellPrice ?? 0,
      reasoning: v?.reasoning ?? "",
    };
  });

  return NextResponse.json({ items });
}
