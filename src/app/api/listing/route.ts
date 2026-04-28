import { NextResponse, type NextRequest } from "next/server";

import { generateListing } from "@/lib/claude";

interface ListingRequestBody {
  itemName: string;
  sellPrice: number;
  reasoning?: string;
}

export interface ListingResponse {
  title: string;
  description: string;
  suggestedPrice: number;
}

interface ListingError {
  error: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ListingResponse | ListingError>> {
  let body: ListingRequestBody;
  try {
    body = (await req.json()) as ListingRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.itemName || typeof body.sellPrice !== "number") {
    return NextResponse.json(
      { error: "Missing itemName or sellPrice" },
      { status: 400 }
    );
  }

  try {
    const listing = await generateListing({
      itemName: body.itemName,
      sellPrice: body.sellPrice,
      reasoning: body.reasoning,
    });
    return NextResponse.json(listing);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Listing generation failed";
    console.error("Listing error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
