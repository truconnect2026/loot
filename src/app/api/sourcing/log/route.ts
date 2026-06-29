import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    store_id?: string;
    logged_date?: string;
    was_on_sale?: boolean;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { store_id, logged_date, was_on_sale, note } = body;
  if (!store_id || typeof store_id !== "string") {
    return NextResponse.json({ error: "store_id is required" }, { status: 400 });
  }

  // Verify the store belongs to this user before logging against it.
  const { data: storeCheck, error: storeErr } = await supabase
    .from("sourcing_stores")
    .select("id")
    .eq("id", store_id)
    .eq("user_id", user.id)
    .single();

  if (storeErr || !storeCheck) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const dateToLog =
    logged_date && /^\d{4}-\d{2}-\d{2}$/.test(logged_date)
      ? logged_date
      : new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("sourcing_logs")
    .insert({
      user_id: user.id,
      store_id,
      logged_date: dateToLog,
      was_on_sale: was_on_sale === true,
      note: note?.trim() || null,
    })
    .select("id, store_id, logged_date, was_on_sale, note, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ log: data }, { status: 201 });
}
