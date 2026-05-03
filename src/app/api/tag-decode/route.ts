import { NextResponse, type NextRequest } from "next/server";
import { tagDecode, type TagDecodeResult } from "@/lib/claude";

interface TagDecodeBody {
  image?: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<TagDecodeResult | { error: string }>> {
  let body: TagDecodeBody;
  try {
    body = (await req.json()) as TagDecodeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  try {
    const result = await tagDecode(body.image);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tag decode failed";
    console.error("Tag decode error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
