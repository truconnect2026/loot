import { NextResponse, type NextRequest } from "next/server";
import { boloMatch } from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  sendPush,
  type StoredSubscription,
  type PushPayload,
} from "@/lib/web-push";

/**
 * Cron — runs every 30 minutes via vercel.json. For each user with
 * push notifications enabled and at least one matching pref:
 *
 *   - BOLO alerts: ask Claude whether their watch-list keywords
 *     correspond to active deals near them; push one notification
 *     per match.
 *   - Deal alerts: scan the feed_cache row for their zip's deals
 *     feed; push for any item with profit > 30 that landed in the
 *     cache after the user's last_alert_check_at.
 *
 * Auth: validates Authorization: Bearer ${CRON_SECRET}. Vercel's
 * cron infrastructure attaches this header when CRON_SECRET is set
 * on the project.
 *
 * Scale notes:
 *   - Per-user Claude call for BOLO is the expensive part. With N
 *     users this is N*Haiku-call per 30 min. Add a Redis-backed
 *     queue or per-zip batching once N grows.
 *   - Deal alerts ride on the existing feed_cache so they cost zero
 *     incremental Claude tokens — they only fire when the cache has
 *     refreshed since the user's last check.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const PROFIT_THRESHOLD = 30;
const PER_RUN_USER_LIMIT = 50;

interface NotificationPrefs {
  user_id: string;
  bolo: boolean | null;
  deals: boolean | null;
}

interface ProfileSlice {
  id: string;
  zip_code: string | null;
  search_radius_miles: number | null;
  last_alert_check_at: string | null;
}

interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface BoloKeyword {
  user_id: string;
  keyword: string;
}

interface FeedCacheRow {
  zip_code: string;
  feed_type: string;
  payload: unknown;
  created_at: string;
}

interface CachedDeal {
  title?: string;
  price?: number;
  estimatedValue?: number;
  source?: string;
}

async function evictSubscription(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from("push_subscriptions").delete().eq("user_id", userId);
}

async function pushAndEvictOnGone(
  sub: StoredSubscription,
  userId: string,
  payload: PushPayload,
): Promise<boolean> {
  try {
    const result = await sendPush(sub, payload);
    if (!result.ok && result.gone) {
      await evictSubscription(userId);
      return false;
    }
    return result.ok;
  } catch (err) {
    console.error("[cron/bolo-check] push send error:", err);
    return false;
  }
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<{ ok: true; processed: number; sent: number } | { error: string }>> {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Pull users who have push enabled (at minimum, a stored
  // subscription) and at least one pref bucket turned on. We join
  // in JS rather than via a Postgres function so this stays simple.
  const { data: subRows } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .limit(PER_RUN_USER_LIMIT);
  const subscriptions = (subRows ?? []) as PushSubscriptionRow[];
  if (subscriptions.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0 });
  }

  const userIds = subscriptions.map((s) => s.user_id);

  const [{ data: prefRows }, { data: profileRows }, { data: keywordRows }] =
    await Promise.all([
      admin
        .from("notification_prefs")
        .select("user_id, bolo, deals")
        .in("user_id", userIds),
      admin
        .from("profiles")
        .select("id, zip_code, search_radius_miles, last_alert_check_at")
        .in("id", userIds),
      admin
        .from("bolo_keywords")
        .select("user_id, keyword")
        .in("user_id", userIds),
    ]);

  const prefsByUser = new Map<string, NotificationPrefs>();
  for (const row of (prefRows ?? []) as NotificationPrefs[]) {
    prefsByUser.set(row.user_id, row);
  }
  const profileByUser = new Map<string, ProfileSlice>();
  for (const row of (profileRows ?? []) as ProfileSlice[]) {
    profileByUser.set(row.id, row);
  }
  const keywordsByUser = new Map<string, string[]>();
  for (const row of (keywordRows ?? []) as BoloKeyword[]) {
    const list = keywordsByUser.get(row.user_id) ?? [];
    list.push(row.keyword);
    keywordsByUser.set(row.user_id, list);
  }

  // Pre-fetch the deals cache rows for every distinct zip — saves
  // round-trips when many users share a zip.
  const distinctZips = new Set<string>();
  for (const profile of profileByUser.values()) {
    if (profile.zip_code) distinctZips.add(profile.zip_code);
  }
  const dealsCacheByZip = new Map<string, FeedCacheRow>();
  if (distinctZips.size > 0) {
    const { data: cacheRows } = await admin
      .from("feed_cache")
      .select("zip_code, feed_type, payload, created_at")
      .in("zip_code", Array.from(distinctZips))
      .eq("feed_type", "deals");
    for (const row of (cacheRows ?? []) as FeedCacheRow[]) {
      dealsCacheByZip.set(row.zip_code, row);
    }
  }

  let processed = 0;
  let sent = 0;
  const now = new Date().toISOString();

  for (const subRow of subscriptions) {
    processed++;
    const sub: StoredSubscription = {
      endpoint: subRow.endpoint,
      p256dh: subRow.p256dh,
      auth: subRow.auth,
    };
    const userId = subRow.user_id;
    const prefs = prefsByUser.get(userId) ?? { user_id: userId, bolo: true, deals: true };
    const profile = profileByUser.get(userId);
    const lastCheckMs = profile?.last_alert_check_at
      ? new Date(profile.last_alert_check_at).getTime()
      : 0;

    try {
      // ── BOLO alerts ──
      if (prefs.bolo !== false) {
        const keywords = keywordsByUser.get(userId) ?? [];
        const zip = profile?.zip_code ?? "";
        const radius = profile?.search_radius_miles ?? 15;
        if (keywords.length > 0 && zip) {
          const matches = await boloMatch({ keywords, zip, radius });
          for (const m of matches) {
            const ok = await pushAndEvictOnGone(sub, userId, {
              title: `BOLO match: ${m.title}`,
              body: `${m.keyword_matched} spotted near you`,
              tag: `bolo:${m.keyword_matched}`,
              url: "/app#deals-near-you",
            });
            if (ok) sent++;
          }
        }
      }

      // ── Deal alerts ──
      if (prefs.deals !== false && profile?.zip_code) {
        const cacheRow = dealsCacheByZip.get(profile.zip_code);
        if (cacheRow) {
          const cacheCreatedMs = new Date(cacheRow.created_at).getTime();
          // Only push if the cache has been refreshed since the
          // user's last alert check — otherwise we'd resend the
          // same items every 30 min for the cache's 4h lifetime.
          if (cacheCreatedMs > lastCheckMs) {
            const deals = (cacheRow.payload ?? []) as CachedDeal[];
            const highProfit = deals
              .filter((d) => {
                const profit =
                  Number(d.estimatedValue ?? 0) - Number(d.price ?? 0);
                return profit > PROFIT_THRESHOLD;
              })
              // Cap to 3 per run so a 12-deal cache doesn't fire 12
              // notifications at once.
              .slice(0, 3);
            for (const d of highProfit) {
              const profit =
                Number(d.estimatedValue ?? 0) - Number(d.price ?? 0);
              const ok = await pushAndEvictOnGone(sub, userId, {
                title: "New deal near you",
                body: `${d.title ?? "Deal"} — potential +$${Math.round(profit)}`,
                tag: "deal-alert",
                url: "/app#deals-near-you",
              });
              if (ok) sent++;
            }
          }
        }
      }

      // Bump last_alert_check_at so subsequent runs only consider
      // newer cache rows. Untyped from() so update() accepts a
      // plain Record — same pattern as the Stripe webhook.
      type AdminTable = ReturnType<ReturnType<typeof getSupabaseAdmin>["from"]> & {
        update: (
          v: Record<string, unknown>,
        ) => ReturnType<ReturnType<typeof getSupabaseAdmin>["from"]>;
      };
      const profilesTable = admin.from("profiles") as unknown as AdminTable;
      await profilesTable
        .update({ last_alert_check_at: now })
        .eq("id", userId);
    } catch (err) {
      console.error(`[cron/bolo-check] user ${userId} failed:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed, sent });
}
