import { NextResponse } from "next/server";
import {
  currentGoodwillColors,
  primaryGoodwillColor,
  type GoodwillColor,
} from "@/lib/sourcing";

export interface GoodwillColorsResponse {
  /** This week's headline 50%-off color — used for the carousel
   * card status line. */
  primary: GoodwillColor;
  /** Full color rotation with this week's 50% / 75% markers. */
  colors: GoodwillColor[];
  note: string;
}

/**
 * GET /api/feeds/goodwill-colors
 *
 * Hardcoded weekly rotation (5-color cycle) so we don't burn Claude
 * tokens on a deterministic schedule. Region-specific schedules vary,
 * which is why the response carries a "schedules vary" note for the
 * sheet UI to surface.
 */
export async function GET(): Promise<NextResponse<GoodwillColorsResponse>> {
  return NextResponse.json({
    primary: primaryGoodwillColor(),
    colors: currentGoodwillColors(),
    note: "Schedules vary by location — confirm with your store.",
  });
}
