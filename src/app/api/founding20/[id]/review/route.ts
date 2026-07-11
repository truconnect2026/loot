import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

const VALID_STATUS = new Set(["pending", "reviewing", "approved", "rejected"]);

// supabase-js v2 without a generated Database<T> types update() as never;
// untype the from() builder once at the head so the eq() chain keeps the
// standard PostgrestFilterBuilder shape. Same pattern as the Stripe
// webhook route.
type AdminTable = ReturnType<
  ReturnType<typeof getSupabaseAdmin>["from"]
> & {
  update: (
    values: Record<string, unknown>,
  ) => ReturnType<ReturnType<typeof getSupabaseAdmin>["from"]>;
};

interface ReviewBody {
  status?: string;
  notes_internal?: string | null;
}

interface ReviewUpdate {
  status: string;
  reviewed_at: string;
  reviewed_by: string;
  notes_internal: string | null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ ok: true } | { error: string }>> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user || !user.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: ReviewBody;
  try {
    body = (await req.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = (body.status ?? "").trim();
  if (!VALID_STATUS.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const notesInternal = (body.notes_internal ?? "").trim().slice(0, 2000) || null;

  const update: ReviewUpdate = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.email,
    notes_internal: notesInternal,
  };

  const admin = getSupabaseAdmin();
  const table = admin.from("founding20_applications") as unknown as AdminTable;
  const { error } = await table
    .update(update as unknown as Record<string, unknown>)
    .eq("id", id);

  if (error) {
    console.error("[founding20/review]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
