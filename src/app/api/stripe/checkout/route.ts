import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStripe, isKnownPrice } from "@/lib/stripe";

interface CheckoutBody {
  priceId?: string;
}

export interface CheckoutResponse {
  url: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Create a Stripe Checkout session for the current user. Caller
 * passes a priceId (must match one of the configured monthly/annual
 * prices). Stripe returns a hosted URL; the frontend redirects.
 *
 * Metadata carries supabase_user_id so the webhook can correlate
 * the eventual checkout.session.completed back to the right
 * profiles row when it fires.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<CheckoutResponse | ErrorResponse>> {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const priceId = (body.priceId ?? "").trim();
  if (!priceId || !isKnownPrice(priceId)) {
    return NextResponse.json({ error: "Unknown priceId" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Reuse stripe_customer_id if we already created one. Avoids
  // duplicate Customer rows for users who initiate checkout twice.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const origin = req.nextUrl.origin;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profileRow?.stripe_customer_id ?? undefined,
      customer_email: profileRow?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=canceled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Checkout session failed";
    console.error("Checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
