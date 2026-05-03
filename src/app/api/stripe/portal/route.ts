import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

export interface PortalResponse {
  url: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Create a Stripe Customer Portal session for the current user.
 * Reads stripe_customer_id from profiles. If absent (user never
 * subscribed), returns 400 — the UI should send those users to
 * checkout instead.
 *
 * Returns the hosted portal URL; the frontend opens it in a new
 * tab via window.open(url, "_blank", "noopener,noreferrer").
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<PortalResponse | ErrorResponse>> {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No subscription on file" },
      { status: 400 },
    );
  }

  const origin = req.nextUrl.origin;

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profileRow.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Portal session failed";
    console.error("Portal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
