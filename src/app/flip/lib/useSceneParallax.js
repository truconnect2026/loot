"use client";

import { useEffect } from "react";

/**
 * Scene parallax — the spatial-depth engine for the flip intro. Writes ONLY
 * compositor-safe translate3d transforms to a small set of depth-layer refs,
 * so the scene reads as a window into space with real dimension (near layers
 * move more, far layers less). No React state per frame, no layout properties.
 *
 * ENGINEERED FOR THE THROTTLED IG WEBVIEW:
 *  - ONE rAF loop, coalesced; per frame it writes at most `layers.length`
 *    (here 3) transform strings — trivial, GPU-composited work.
 *  - Listeners are passive.
 *  - Values are smoothed (lerp) so motion is eased and never seasick, and the
 *    amplitude (coef px) is small.
 *
 * INPUT FALLBACK CHAIN (the scene ALWAYS has depth-life):
 *  1. deviceorientation — best-effort. iOS 13+/IG webviews gate it behind a
 *     permission that requires a user gesture; we do NOT force a prompt on
 *     load, so orientation only contributes where the browser allows ungated
 *     events (some Android/desktop). When it fires it takes over.
 *  2. pointer / touch move over the scene — works in the IG webview.
 *  3. autonomous slow drift — always on, the baseline; input eases back to it
 *     when idle, so there is never a dead, static frame.
 *
 * REDUCED MOTION: the hook is a no-op — layers keep their static base offset
 * (a clean, complete still). This is the competent floor, not the focus.
 *
 * @param {Array<{ ref: {current: HTMLElement|null}, coef: number }>} layers
 *   coef = px amplitude at |input| = 1. Pass a STABLE array (useMemo).
 * @param {boolean} reduced  prefers-reduced-motion
 */
export function useSceneParallax(layers, reduced) {
  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    const els = layers.map((l) => l.ref.current);
    if (!els.some(Boolean)) return;

    let raf = 0;
    let cx = 0, cy = 0; // smoothed current, roughly -1..1
    let px = 0, py = 0; // latest pointer/tilt target, -1..1
    let hasInput = false;
    let lastInput = 0;
    let t0 = 0;

    const clamp = (v) => (v < -1 ? -1 : v > 1 ? 1 : v);

    const onPointer = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const src = e.touches && e.touches[0] ? e.touches[0] : e;
      if (src.clientX == null) return;
      px = clamp((src.clientX / w - 0.5) * 2);
      py = clamp((src.clientY / h - 0.5) * 2);
      hasInput = true;
      lastInput = performance.now();
    };
    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null) return;
      px = clamp(e.gamma / 30); // left/right tilt
      py = clamp((e.beta - 45) / 30); // front/back around a comfortable hold angle
      hasInput = true;
      lastInput = performance.now();
    };

    const tick = (ts) => {
      if (!t0) t0 = ts;
      const t = ts - t0;
      // Always-on autonomous drift (the baseline depth-life).
      const dx = Math.sin(t * 0.00028) * 0.5;
      const dy = Math.cos(t * 0.00021) * 0.42;
      // After 2.5s of no input, ease fully back to drift.
      const stale = !hasInput || ts - lastInput > 2500;
      const tx = stale ? dx : px * 0.85 + dx * 0.22;
      const ty = stale ? dy : py * 0.85 + dy * 0.22;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const coef = layers[i].coef;
        el.style.transform = `translate3d(${(cx * coef).toFixed(2)}px, ${(cy * coef).toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
      if (raf) cancelAnimationFrame(raf);
      els.forEach((el) => {
        if (el) el.style.transform = "";
      });
    };
  }, [reduced, layers]);
}
