import { NextResponse } from "next/server";
import { targetWeekSchedule, type TargetDay } from "@/lib/sourcing";

export interface TargetMarkdownsResponse {
  /** Mon-first weekly schedule. */
  schedule: TargetDay[];
  /** Which day index in `schedule` is "today" (0..6, Mon=0). */
  todayIndex: number;
  note: string;
}

/**
 * GET /api/feeds/target-markdowns
 *
 * Returns the well-known Target weekly markdown rotation. Static —
 * no Claude call. The client uses todayIndex to highlight the active
 * row.
 */
export async function GET(): Promise<NextResponse<TargetMarkdownsResponse>> {
  const schedule = targetWeekSchedule();
  const day = new Date().getDay(); // 0=Sun..6=Sat
  // schedule is Mon-first; map Date#getDay (Sun=0) → schedule index.
  const todayIndex = day === 0 ? 6 : day - 1;
  return NextResponse.json({
    schedule,
    todayIndex,
    note: "Markdowns hit 30-50-70% in waves — check end caps and clearance aisles.",
  });
}
