import { NextResponse, type NextRequest } from "next/server";
import { scrapId, type ScrapIdResult } from "@/lib/claude";

interface ScrapIdBody {
  image?: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ScrapIdResult | { error: string }>> {
  let body: ScrapIdBody;
  try {
    body = (await req.json()) as ScrapIdBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  try {
    const result = await scrapId(body.image);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrap ID failed";
    console.error("Scrap ID error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
