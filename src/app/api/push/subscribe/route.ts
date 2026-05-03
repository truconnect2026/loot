import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  updated_at: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<{ ok: true } | { error: string }>> {
  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Missing endpoint or keys" },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Untype the row to side-step the supabase-js v2 `never` schema
  // type — same pattern used in the Stripe webhook.
  const row: PushSubscriptionRow = {
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(row as unknown as Record<string, unknown>, {
      onConflict: "user_id",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
