import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyDigistoreSignature } from "@/lib/digistore";

/**
 * Digistore24 IPN webhook.
 *
 * Digistore POSTs application/x-www-form-urlencoded with a sha_sign
 * field; we verify it byte-for-byte (see src/lib/digistore.ts), then
 * write the event to digistore_events (idempotent on
 * order_id/event_type/transaction_id) and update the buyer's profile
 * row with their Pro state.
 *
 * MUST respond with the literal text body "OK" (200) to acknowledge.
 * Anything else triggers Digistore's 10-day retry cycle.
 *
 * The repo uses public.profiles (not public.users) as the auth.users
 * mirror, so the spec's "users" table reads/writes are mapped onto
 * profiles here.
 */

export const dynamic = "force-dynamic";
// crypto.timingSafeEqual + crypto.createHash require the Node runtime.
export const runtime = "nodejs";

function ok(): Response {
  return new Response("OK", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

function fail(status: number, msg: string): Response {
  console.error("[digistore-webhook]", status, msg);
  return new Response(msg, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

// supabase-js v2 without a generated Database<T> generic types
// .update() as `never`. Untype the from() builder once at the head
// of the chain (mirrors the pattern in the Stripe webhook).
type AdminTable = ReturnType<
  ReturnType<typeof createClient>["from"]
> & {
  update: (
    values: Record<string, unknown>,
  ) => ReturnType<ReturnType<typeof createClient>["from"]>;
};

export async function POST(req: NextRequest): Promise<Response> {
  const passphrase = process.env.DIGISTORE_IPN_PASSPHRASE;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!passphrase || !serviceKey || !supabaseUrl) {
    return fail(500, "server misconfigured");
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/x-www-form-urlencoded")) {
    return fail(400, "expected form-urlencoded");
  }

  const rawBody = await req.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(rawBody)) params[k] = v;

  const valid = verifyDigistoreSignature(params, passphrase);

  const event = (params.event || "").toLowerCase();
  const orderId = params.order_id || "";
  const txId = params.transaction_id || "";
  const buyerEmail = (params.buyer_email || "").toLowerCase().trim();
  const productId = params.product_id || "";
  const amount = params.amount_brutto ? Number(params.amount_brutto) : null;
  const currency = params.currency || null;
  const mode = params.mode || "live"; // 'test' for sandbox
  const paySeq = params.pay_sequence_no
    ? Number(params.pay_sequence_no)
    : null;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ALWAYS log the event first, even if signature invalid — that way
  // a flood of bad signatures shows up in the audit table for
  // debugging instead of silently disappearing. Idempotent on
  // (order_id, event_type, transaction_id) so Digistore retries
  // collapse to a single row.
  const { error: logErr } = await supabase
    .from("digistore_events")
    .upsert(
      {
        order_id: orderId,
        transaction_id: txId || null,
        event_type: event,
        pay_sequence_no: paySeq,
        buyer_email: buyerEmail || null,
        product_id: productId || null,
        amount_brutto: amount,
        currency,
        mode,
        raw_payload: params,
        signature_valid: valid,
      },
      {
        onConflict: "order_id,event_type,transaction_id",
        ignoreDuplicates: true,
      },
    );

  if (logErr) {
    console.error("[digistore-webhook] log error", logErr);
    // Don't fail — idempotency conflicts are fine and we still want
    // to acknowledge to Digistore.
  }

  if (!valid) return fail(401, "invalid signature");
  if (!orderId || !buyerEmail) {
    return fail(400, "missing order_id or buyer_email");
  }

  // Test-mode events (Digistore sandbox / "Test IPN" button): log
  // and 200 OK, but never mutate a real user.
  if (mode === "test") {
    console.log("[digistore-webhook] test event", event, orderId);
    return ok();
  }

  // Classify plan by amount_netto first (pre-tax — stable across
  // buyer tax zones unlike amount_brutto, which includes VAT/sales
  // tax and tipped a $14.99 monthly into $16.19 brutto, blowing
  // through the tolerance window). product_id is intentionally NOT
  // primary: Digistore product 691098 serves BOTH the monthly and
  // annual payment plans, so a product_id lookup would always
  // resolve "monthly" and silently mis-tag annual buyers.
  // PLAN_BY_PRODUCT remains as a defensive fallback for IPNs that
  // somehow arrive without amount_netto.
  const PLAN_BY_PRODUCT: Record<string, "monthly" | "annual"> = {
    // Only used when amount_netto absent (defensive fallback).
    // 691098 serves both plans, so it's intentionally NOT mapped here.
  };

  let planType: "monthly" | "annual" | null = null;

  const netto = params.amount_netto ? Number(params.amount_netto) : amount;
  if (netto !== null) {
    if (Math.abs(netto - 14.99) < 0.5) planType = "monthly";
    else if (Math.abs(netto - 99.99) < 0.5) planType = "annual";
  }

  if (!planType) planType = PLAN_BY_PRODUCT[productId] ?? null;

  if (!planType) {
    console.warn(
      "[digistore-webhook] could not classify plan",
      JSON.stringify({
        product_id: productId,
        amount_brutto: amount,
        amount_netto: params.amount_netto,
        order_id: orderId,
      }),
    );
  }

  // 1. Find user by buyer_email via the admin listUsers API.
  //    NOTE: paginated in supabase-js; the first page (default 50)
  //    is fine for early scale but should be replaced with a direct
  //    auth.users query once the user count grows past one page.
  const { data: existingUserData } = await supabase.auth.admin.listUsers();
  let userId: string | undefined = existingUserData?.users.find(
    (u) => u.email?.toLowerCase() === buyerEmail,
  )?.id;

  // 2. Dual-rail guard. If the buyer already has an active Stripe
  //    sub, do NOT trample their state with Digistore writes — they
  //    may have double-purchased through an affiliate by accident, or
  //    Digistore may be replaying an old IPN. Skip the mutation but
  //    keep the audit row so support can spot it. The earlier upsert
  //    already wrote the event with signature_valid=true.
  if (userId) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("payment_source, is_pro, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (
      existingProfile &&
      existingProfile.payment_source === "stripe" &&
      existingProfile.is_pro === true
    ) {
      console.warn(
        "[digistore-webhook] conflict: user has active Stripe sub, skipping",
        {
          user_id: userId,
          order_id: orderId,
          stripe_customer_id: existingProfile.stripe_customer_id,
        },
      );
      // Backfill user_id on the audit row before bailing.
      const conflictTable = supabase.from(
        "digistore_events",
      ) as unknown as AdminTable;
      if (txId) {
        await conflictTable
          .update({ user_id: userId })
          .eq("order_id", orderId)
          .eq("event_type", event)
          .eq("transaction_id", txId);
      } else {
        await conflictTable
          .update({ user_id: userId })
          .eq("order_id", orderId)
          .eq("event_type", event)
          .is("transaction_id", null);
      }
      return ok();
    }
  }

  // 3. If no user exists, create one + send a magic link.
  if (!userId) {
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email: buyerEmail,
        email_confirm: true, // skip confirmation, they already paid
        user_metadata: { source: "digistore", order_id: orderId },
      });
    if (createErr || !created.user) {
      console.error("[digistore-webhook] user create failed", createErr);
      return fail(500, "user create failed");
    }
    userId = created.user.id;

    const { error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: buyerEmail,
      options: {
        redirectTo: "https://loot.works/welcome?order_id=" + orderId,
      },
    });
    if (linkErr) {
      console.error("[digistore-webhook] magic link failed", linkErr);
    }
  }

  // Compute next state. Digistore events:
  //   payment        successful charge (initial or rebill)
  //   payment_missed Digistore is retrying — soft suspend, keep is_pro
  //   last_paid_day  end of paid period (final cancel / retry exhausted)
  //   refund/chargeback  immediate revoke
  const now = new Date();
  let updates: Record<string, unknown> = {
    digistore_order_id: orderId,
    digistore_buyer_email: buyerEmail,
    pro_updated_at: now.toISOString(),
  };

  // Tag every mutation with payment_source so the Stripe webhook
  // knows to skip this user and the UI can route Manage-plan to
  // Digistore's order portal instead of Stripe's billing portal.
  //
  // Event names: live IPN sends `on_*` prefixes (on_payment,
  // on_refund, …); some docs and the test/IPN-replay tool send the
  // bare names. Match both so a single payload shape change at
  // Digistore's end can't silently brick provisioning.
  switch (event) {
    case "on_payment":
    case "payment": {
      const expires = new Date(now);
      if (planType === "annual") {
        expires.setFullYear(expires.getFullYear() + 1);
      } else {
        expires.setMonth(expires.getMonth() + 1); // default monthly
      }
      // 2-day grace buffer for retry windows.
      expires.setDate(expires.getDate() + 2);

      updates = {
        ...updates,
        is_pro: true,
        pro_status: "active",
        plan_type: planType,
        pro_expires_at: expires.toISOString(),
        payment_source: "digistore",
      };
      break;
    }
    case "on_payment_missed":
    case "payment_missed": {
      updates = {
        ...updates,
        pro_status: "suspended",
        payment_source: "digistore",
      };
      break;
    }
    case "on_rebill_cancelled":
    case "last_paid_day": {
      updates = {
        ...updates,
        is_pro: false,
        pro_status: "cancelled",
        payment_source: "digistore",
      };
      break;
    }
    case "on_refund":
    case "on_chargeback":
    case "refund":
    case "chargeback": {
      updates = {
        ...updates,
        is_pro: false,
        pro_status: "refunded",
        payment_source: "digistore",
      };
      break;
    }
    default: {
      // Unknown event — log raw event string + order so future name
      // drift surfaces in logs immediately. Return 200 OK so
      // Digistore stops retrying; we don't mutate the profile.
      console.warn(
        "[digistore-webhook] unhandled event",
        JSON.stringify({ event, order_id: orderId, mode }),
      );
      return ok();
    }
  }

  // Upsert the profile so we survive the rare race where the
  // auth.users trigger hasn't yet inserted the profile row
  // (the same race onboarding/page.tsx defends against).
  const { error: updateErr } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates }, { onConflict: "id" });

  if (updateErr) {
    console.error(
      "[digistore-webhook] profile upsert failed",
      updateErr,
    );
    return fail(500, "profile upsert failed");
  }

  // Backfill user_id on the event row we logged at the top. The row
  // was inserted with transaction_id = txId || null, so match the
  // null branch separately (eq on '' won't match NULL in Postgres).
  const eventsTable = supabase.from(
    "digistore_events",
  ) as unknown as AdminTable;
  if (txId) {
    await eventsTable
      .update({ user_id: userId })
      .eq("order_id", orderId)
      .eq("event_type", event)
      .eq("transaction_id", txId);
  } else {
    await eventsTable
      .update({ user_id: userId })
      .eq("order_id", orderId)
      .eq("event_type", event)
      .is("transaction_id", null);
  }

  return ok();
}

// Digistore only POSTs; reject anything else so misconfigured
// browsers / health checks don't 200 by accident.
export async function GET(): Promise<Response> {
  return new Response("method not allowed", {
    status: 405,
    headers: { "content-type": "text/plain" },
  });
}
