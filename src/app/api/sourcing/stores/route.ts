import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { KNOWN_CHAINS } from "@/lib/sourcingPatterns";

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("sourcing_stores")
    .select("id, name, chain, location_label, created_at")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ stores: data ?? [] });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { name?: string; chain?: string; location_label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, chain = "other", location_label } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const knownChainValues: readonly string[] = KNOWN_CHAINS;
  const resolvedChain = knownChainValues.includes(chain) ? chain : "other";

  const { data, error } = await supabase
    .from("sourcing_stores")
    .insert({
      user_id: user.id,
      name: name.trim(),
      chain: resolvedChain,
      location_label: location_label?.trim() || null,
    })
    .select("id, name, chain, location_label, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ store: data }, { status: 201 });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Provide ?id=<store-id>" }, { status: 400 });
  }

  const { error } = await supabase
    .from("sourcing_stores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // RLS also enforces this; belt + braces

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: id });
}
