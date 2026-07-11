import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// Public count of approved Founding 20 spots — drives the live counter
// on /kit. Cached for one minute on the edge so the badge feels responsive
// without flooding Supabase.
export async function GET(): Promise<
  NextResponse<{ claimed: number; total: number } | { error: string }>
> {
  const TOTAL = 20;
  try {
    const admin = getSupabaseAdmin();
    const { count, error } = await admin
      .from("founding20_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");
    if (error) {
      console.error("[founding20/count]", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
    return NextResponse.json(
      { claimed: count ?? 0, total: TOTAL },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("[founding20/count]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
