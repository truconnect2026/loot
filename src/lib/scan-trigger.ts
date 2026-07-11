"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

// ═══ THE ONE SCAN TRIGGER ══════════════════════════════════════════════
// Any surface adding a scan entry point MUST call useScanTrigger() — the
// Jan '26 dead-FAB break came from ad-hoc wiring (the FAB pushed
// "/app?scan=shelf", a param only a FRESH /app mount ever read, so the
// nav SCAN button was silently dead the entire time you were already on
// Home). No surface may own private wiring into the scan overlays.
//
// Shape: the dashboard — the only page that mounts ScanOverlay /
// ShelfScanSheet / PaywallSheet — registers the single handler. While it
// is mounted, triggers fire the handler directly: no URL params, no
// remount dependency. From any other route the mode is stashed and we
// navigate to /app; the handler drains the pending mode the moment it
// registers. ALL gating (free-scan limit, Pro shelf check, paywall)
// stays inside the dashboard's handler — this module never bypasses it.

// "crate" rides the same pipe: ScanOverlay accepts mode="crate"
// directly and resyncs activeMode on every open.
export type ScanTriggerMode = "barcode" | "vision" | "shelf" | "crate";

// Optional image payload. Only the shelf library-upload path uses it:
// the picked image rides the same pipe (fire-direct or stash+drain) so
// the overlay runs its detect→value pipeline on an uploaded image
// exactly as it would on a camera capture. Camera/barcode entries pass
// no image and behave identically to before.
let handler: ((mode: ScanTriggerMode, image?: string) => void) | null = null;
let pending: { mode: ScanTriggerMode; image?: string } | null = null;

/**
 * Dashboard-side. Register the one consumer; returns the unregister
 * cleanup for the effect. A trigger fired before the dashboard mounted
 * (e.g. FAB tapped on /sourcing) drains here.
 */
export function registerScanHandler(
  h: (mode: ScanTriggerMode, image?: string) => void,
): () => void {
  handler = h;
  if (pending !== null) {
    const { mode, image } = pending;
    pending = null;
    h(mode, image);
  }
  return () => {
    if (handler === h) handler = null;
  };
}

/**
 * Core dispatch, framework-free: fire the handler if the dashboard is
 * live (true), otherwise stash the mode (+ optional image) for
 * drain-on-register (false). Surfaces inside React use useScanTrigger
 * below, which adds the cross-route navigation this function
 * deliberately knows nothing about.
 */
export function requestScan(mode: ScanTriggerMode, image?: string): boolean {
  if (handler) {
    handler(mode, image);
    return true;
  }
  pending = { mode, image };
  return false;
}

/**
 * Surface-side. Returns the canonical trigger: fire directly when the
 * dashboard is live, otherwise stash + route to /app.
 */
export function useScanTrigger(): (mode: ScanTriggerMode, image?: string) => void {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (mode: ScanTriggerMode, image?: string) => {
      // Stashed with no handler while already on /app = unauthed
      // marketing preview; navigating would be a no-op, the stash just
      // waits for the dashboard to mount.
      if (!requestScan(mode, image) && pathname !== "/app") router.push("/app");
    },
    [router, pathname],
  );
}
