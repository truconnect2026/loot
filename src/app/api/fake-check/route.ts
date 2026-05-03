import { NextResponse, type NextRequest } from "next/server";
import { fakeCheck, type FakeCheckResult } from "@/lib/claude";

interface FakeCheckBody {
  image?: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<FakeCheckResult | { error: string }>> {
  let body: FakeCheckBody;
  try {
    body = (await req.json()) as FakeCheckBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  try {
    const result = await fakeCheck(body.image);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fake check failed";
    console.error("Fake check error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
