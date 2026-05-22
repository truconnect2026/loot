"use client";

/**
 * Device-class detection for "should we even try to render heavy effects?"
 *
 * PERF: skips on mobile/low-end devices.
 *
 * Heavy effects gated by ENABLE_HEAVY_EFFECTS:
 *   - cursor + 3D tilt (P20)
 *   - dynamic lighting + parallax + depth-of-field (P21, partially)
 *   - SVG chromatic + dust haze (P21)
 *
 * Reduced motion ALSO disables these (combined check in callers).
 */
import { useEffect, useState } from "react";

export function detectDeviceClass() {
  if (typeof window === "undefined") return { mobile: true, lowEnd: false, saveData: false, coarsePointer: true, reducedMotion: false };
  const mobile = window.innerWidth < 768;
  const lowEnd = (navigator.hardwareConcurrency || 4) < 4;
  const conn = navigator.connection;
  const saveData = !!(conn && conn.saveData);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return { mobile, lowEnd, saveData, coarsePointer, reducedMotion };
}

/** Hook returning the cached device class + ENABLE_HEAVY_EFFECTS flag. */
export function useDeviceClass() {
  const [dc, setDc] = useState(() => detectDeviceClass());
  useEffect(() => {
    setDc(detectDeviceClass());
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onChange = () => setDc(detectDeviceClass());
    mq?.addEventListener?.("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq?.removeEventListener?.("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);
  const enableHeavyEffects = !dc.mobile && !dc.lowEnd && !dc.saveData && !dc.reducedMotion && !dc.coarsePointer;
  return { ...dc, enableHeavyEffects };
}
