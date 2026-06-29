import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { buildWeekPlan } from "@/lib/sourcingPlan";
import type { StoreRecord, LogRecord } from "@/lib/sourcingPlan";

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [storesRes, logsRes] = await Promise.all([
    supabase
      .from("sourcing_stores")
      .select("id, name, chain, location_label")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("sourcing_logs")
      .select("store_id, logged_date, was_on_sale")
      .eq("user_id", user.id),
  ]);

  const stores = (storesRes.data ?? []) as StoreRecord[];
  const logs = (logsRes.data ?? []) as LogRecord[];

  const result = buildWeekPlan(stores, logs);
  return NextResponse.json(result);
}
