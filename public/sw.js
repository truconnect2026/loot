/**
 * LOOT push service worker.
 *
 * Two events:
 *   push                  — receive an alert from the cron, surface
 *                           it as a system notification.
 *   notificationclick     — focus an existing LOOT tab if one is
 *                           open, otherwise open a new one at the
 *                           payload's `url` (defaults to /app).
 *
 * Payload contract (sent by lib/web-push.ts):
 *   { title: string, body: string, icon?: string, url?: string }
 */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "LOOT", body: event.data.text() };
  }

  const title = payload.title || "LOOT";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: "/badge-72.png",
    data: { url: payload.url || "/app" },
    // Tag groups same-keyword alerts so a stack of BOLO matches
    // collapses into one notification instead of spamming the
    // tray. The tag is derived from the payload type if present.
    tag: payload.tag || "loot-alert",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/app";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          // If a LOOT tab is already open, focus it and navigate.
          if ("focus" in client) {
            const url = new URL(client.url);
            if (url.origin === self.location.origin) {
              return client.focus().then(function (focused) {
                if ("navigate" in focused) return focused.navigate(targetUrl);
                return focused;
              });
            }
          }
        }
        // No open LOOT tabs — open a fresh one.
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

// Activate immediately on update so a redeploy of sw.js doesn't
// leave users on the old worker for 24h.
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
