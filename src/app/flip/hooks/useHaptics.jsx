"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * useHaptics — dual-stack haptics for mobile.
 *
 * Android Chrome supports navigator.vibrate. iOS Safari does NOT — there's no
 * official API. The hacky-but-real workaround is the <input type="checkbox"
 * switch> element, which triggers a haptic when toggled programmatically on
 * iOS 17.4+ Safari. We append one hidden element to the body and toggle it
 * for the iOS no-op fallback.
 *
 * Respects:
 *   - prefers-reduced-motion (no-op)
 *   - localStorage flag "fos-haptics-enabled" (default true)
 */

const LS_KEY = "fos-haptics-enabled";

function reducedMotionPreferred() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function hapticsEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === "false") return false;
  } catch {
    /* ignore */
  }
  return true;
}

export default function useHaptics() {
  const iosToggleRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (navigator.vibrate) return; // Android path doesn't need the iOS trick
    if (iosToggleRef.current) return;

    // Build the hidden iOS haptic toggle once.
    const el = document.createElement("input");
    el.type = "checkbox";
    el.setAttribute("switch", "");
    el.style.position = "absolute";
    el.style.width = "1px";
    el.style.height = "1px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.setAttribute("aria-hidden", "true");
    el.tabIndex = -1;
    document.body.appendChild(el);
    iosToggleRef.current = el;

    return () => {
      el.remove();
      iosToggleRef.current = null;
    };
  }, []);

  const tap = useCallback((pattern) => {
    if (reducedMotionPreferred()) return;
    if (!hapticsEnabled()) return;
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
        return;
      }
      // iOS path: toggle the hidden checkbox-switch.
      const el = iosToggleRef.current;
      if (el) el.checked = !el.checked;
    } catch {
      /* silent — haptics are nice-to-have, not load-bearing */
    }
  }, []);

  const hapticTap = useCallback(() => tap(10), [tap]);
  const hapticSuccess = useCallback(() => tap([30, 20, 30]), [tap]);
  const hapticError = useCallback(() => tap(60), [tap]);
  const hapticStreak = useCallback(() => tap([20, 10, 20, 10, 30]), [tap]);

  return { tap, hapticTap, hapticSuccess, hapticError, hapticStreak };
}
