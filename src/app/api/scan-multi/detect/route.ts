import { NextResponse, type NextRequest } from "next/server";
import { identifyMultiFromImageDebug, type MultiDetectItem } from "@/lib/claude";

export interface DetectResponse {
  items: MultiDetectItem[];
  _debug: { rawText: string; parsedCount: number };
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<DetectResponse | { error: string }>> {
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

  try {
    const { items, rawText, parsedCount } = await identifyMultiFromImageDebug(image);
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
