import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, priceToPlanType } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Stripe webhook — the single source of truth for subscription
 * state on profiles. Stripe POSTs here on subscription lifecycle
 * events; we verify the signature, then upsert the relevant
 * profile fields using the service-role Supabase client (no user
 * session here, so RLS would block normal anon access).
 *
 * Events handled:
 *   checkout.session.completed       — first sub: set is_pro, ids, renewal
 *   customer.subscription.updated    — renewal/plan change: refresh
 *   customer.subscription.deleted    — cancel: clear is_pro
 *   invoice.payment_failed           — set status to past_due
 *
 * The route reads the raw request body with req.text() because
 * Stripe's signature is computed over the raw bytes — JSON.parse
 * would canonicalize whitespace and break verification.
 */

function unixToIso(unix: number | null | undefined): string | null {
  if (typeof unix !== "number" || !Number.isFinite(unix)) return null;
  return new Date(unix * 1000).toISOString();
}

interface ProfileUpdate {
  is_pro?: boolean;
  stripe_customer_id?: string;
  stripe_subscription_status?: string;
  subscription_renews_at?: string | null;
  plan_type?: "monthly" | "annual" | null;
}

// The supabase-js v2 client without a generated Database<T> generic
// types `update()` as `never` — we untype the from() builder once
// at the head of the chain so the rest of the call (eq / select /
// etc.) keeps the standard PostgrestFilterBuilder shape. Same
// pattern would be used elsewhere if we add more admin writes.
type AdminTable = ReturnType<
  ReturnType<typeof getSupabaseAdmin>["from"]
> & {
  update: (
    values: Record<string, unknown>,
  ) => ReturnType<ReturnType<typeof getSupabaseAdmin>["from"]>;
};

async function updateProfileById(
  userId: string,
  patch: ProfileUpdate,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const table = admin.from("profiles") as unknown as AdminTable;
  await table
    .update(patch as unknown as Record<string, unknown>)
    .eq("id", userId);
}

async function updateProfileByCustomer(
  customerId: string,
  patch: ProfileUpdate,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const table = admin.from("profiles") as unknown as AdminTable;
  await table
    .update(patch as unknown as Record<string, unknown>)
    .eq("stripe_customer_id", customerId);
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId =
    (session.metadata?.supabase_user_id as string | undefined) ||
    (session.client_reference_id as string | null) ||
    null;
  const customerId =
    typeof session.customer === "string" ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;
  if (!userId || !customerId || !subscriptionId) return;

  // Fetch the subscription so we have current_period_end + the
  // line-item price (for plan_type). The session itself doesn't
  // carry the period end on the parent object.
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price?.id ?? "";
  // Stripe types had `current_period_end` directly on Subscription
  // through API 2024-06; later versions moved it into the items.
  // Read defensively from both shapes.
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end ??
    null;

  await updateProfileById(userId, {
    is_pro: sub.status === "active" || sub.status === "trialing",
    stripe_customer_id: customerId,
    stripe_subscription_status: sub.status,
    subscription_renews_at: unixToIso(periodEnd),
    plan_type: priceToPlanType(priceId),
  });
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return;
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items.data[0]?.current_period_end ??
    null;

  await updateProfileByCustomer(customerId, {
    is_pro: sub.status === "active" || sub.status === "trialing",
    stripe_subscription_status: sub.status,
    subscription_renews_at: unixToIso(periodEnd),
    plan_type: priceToPlanType(priceId),
  });
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  if (!customerId) return;
  await updateProfileByCustomer(customerId, {
    is_pro: false,
    stripe_subscription_status: "canceled",
    subscription_renews_at: null,
  });
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;
  await updateProfileByCustomer(customerId, {
    stripe_subscription_status: "past_due",
  });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<{ received: true } | { error: string }>> {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  // Raw body required for signature verification — see file header.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Other events are subscribed-to as a side effect of the
        // dashboard's default config but aren't actionable here.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook handler failed";
    console.error("Webhook error:", err);
    // Return 500 so Stripe retries — the event might process on
    // the second attempt if the failure was transient (DB timeout).
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
