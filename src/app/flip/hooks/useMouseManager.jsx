"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "motion/react";

/**
 * useTilt — 3D parallax tilt for a single element, driven by cursor position
 * relative to that element. Smoothed via Motion useSpring.
 *
 * PERF: opt-out on coarse pointer / reduced motion (callers should check
 * useDeviceClass first; this hook short-circuits internally as a backstop).
 *
 * The "unified mouse manager" in the spec is split into focused per-element
 * hooks because Motion's useSpring can only be created at render-time, not
 * dynamically registered. CosmicCursor owns its own listener. Each tiltable
 * element calls useTilt and gets a smoothed pair of MotionValues.
 */
export function useTilt(elementRef, options = {}) {
  const { maxRotateX = 6, maxRotateY = 6, enabled = true } = options;
  const tiltX = useSpring(0, { stiffness: 180, damping: 22 });
  const tiltY = useSpring(0, { stiffness: 180, damping: 22 });
  const isHover = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const elt = elementRef.current;
    if (!elt) return;

    const onEnter = () => { isHover.current = true; };
    const onLeave = () => {
      isHover.current = false;
      tiltX.set(0); tiltY.set(0);
    };
    const onMove = (e) => {
      if (!isHover.current) return;
      const rect = elt.getBoundingClientRect();
      if (!rect.width) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      tiltX.set(-Math.max(-1, Math.min(1, dy)) * maxRotateX);
      tiltY.set(Math.max(-1, Math.min(1, dx)) * maxRotateY);
    };
    elt.addEventListener("mouseenter", onEnter);
    elt.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      elt.removeEventListener("mouseenter", onEnter);
      elt.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousemove", onMove);
    };
  }, [elementRef, maxRotateX, maxRotateY, enabled, tiltX, tiltY]);

  return { tiltX, tiltY };
}

/** Global cursor-position MotionValues (used by CosmicCursor). */
export function useCursorPosition() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const interactive = useMotionValue(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    const onMove = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      const target = e.target;
      const i = target?.closest?.("button, a, input, [role=button], [data-interactive]");
      interactive.set(i ? 1 : 0);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y, interactive]);

  return { x, y, interactive };
}
