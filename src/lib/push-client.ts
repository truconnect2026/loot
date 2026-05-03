"use client";

/**
 * Browser-side push subscription helpers. The account page calls
 * these when the user toggles the master "Push notifications"
 * switch.
 *
 * Flow:
 *   subscribeToPush() → register sw.js → request permission →
 *     pushManager.subscribe → POST /api/push/subscribe
 *   unsubscribeFromPush() → reverse: pushManager.unsubscribe +
 *     POST /api/push/unsubscribe
 *
 * Returns a discriminated result so the toggle UI can render an
 * accurate message instead of a generic "failed".
 */

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "missing-vapid" | "error"; message?: string };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!pushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false, reason: "missing-vapid" };
  }

  try {
    // Register the worker if not already (registration is idempotent
    // — the browser dedupes by scope, so calling it on every
    // subscribe attempt is fine).
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }

    // Re-use an existing subscription if there is one. Browsers
    // expire push subscriptions every few months; if the existing
    // one was from a different VAPID public key we'd need to
    // unsubscribe first, but in practice the key doesn't rotate.
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // pushManager.subscribe wants ArrayBuffer-backed BufferSource;
      // the modern lib.dom Uint8Array type is generic over its
      // backing buffer (ArrayBufferLike), which doesn't satisfy the
      // older non-generic constraint. Cast through BufferSource —
      // the underlying bytes are valid either way.
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ) as unknown as BufferSource,
      });
    }

    const json = sub.toJSON() as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    const endpoint = json.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return {
        ok: false,
        reason: "error",
        message: "browser did not return subscription keys",
      };
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, keys: { p256dh, auth } }),
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: "error",
        message: `subscribe API returned ${res.status}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  if (!pushSupported()) return { ok: false };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch("/api/push/unsubscribe", { method: "POST" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
