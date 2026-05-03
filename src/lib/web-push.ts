import "server-only";
import webpush from "web-push";

/**
 * web-push wrapper. Configures VAPID details lazily on first use
 * so a missing key during build doesn't kill unrelated routes.
 *
 * Envs:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — also exposed to the browser for
 *     pushManager.subscribe(applicationServerKey)
 *   VAPID_PRIVATE_KEY — server-side only, do NOT prefix NEXT_PUBLIC
 *   VAPID_SUBJECT — mailto: URL or https URL identifying the app
 *     to push services. Defaults to "mailto:hello@loot.app" if unset.
 *
 * Generate the keypair with: `npx web-push generate-vapid-keys`.
 */

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@loot.app";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys must be set (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  /** Notification tag — same-tag alerts collapse in the tray. */
  tag?: string;
}

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a single push. Returns false on 410 Gone (subscription
 * expired) so the caller can delete the row from
 * push_subscriptions; throws on other errors.
 */
export async function sendPush(
  sub: StoredSubscription,
  payload: PushPayload,
): Promise<{ ok: true } | { ok: false; gone: true }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err) {
    // web-push wraps push-service responses in a WebPushError with
    // statusCode set. 410 Gone / 404 = subscription is dead, caller
    // should evict the row.
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      return { ok: false, gone: true };
    }
    throw err;
  }
}
