"use client";

import { useEffect, useState } from "react";

/**
 * Mirrors the OS "reduce motion" setting. Used to gate JS-driven motion
 * (typewriters, orchestrated intro sequences) that CSS media queries
 * can't reach. CSS-only animations are already collapsed globally by the
 * prefers-reduced-motion rule in globals.css — this is for the cases
 * where we render a *different tree* (static settled state) instead of a
 * playing one. Starts false so SSR/first paint matches the motion path;
 * the effect corrects it before any animation would matter.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
