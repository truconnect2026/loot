import { NextResponse, type NextRequest } from "next/server";
import { fetchSoldComps } from "@/lib/claude";

export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  let body: { itemName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { itemName } = body;
  if (!itemName || typeof itemName !== "string") {
    return NextResponse.json(
      { error: "Provide { itemName: string }" },
      { status: 400 },
    );
  }
  const comps = await fetchSoldComps(itemName.trim());
  return NextResponse.json({ comps });
}
