import { NextResponse, type NextRequest } from "next/server";
import { identifyMultiFromImage, type MultiDetectItem } from "@/lib/claude";

export interface DetectResponse {
  items: MultiDetectItem[];
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
    const items = await identifyMultiFromImage(image);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Detection failed";
    console.error("scan-multi-test/detect error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
