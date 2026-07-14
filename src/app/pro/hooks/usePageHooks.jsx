"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useInView — IntersectionObserver with a getBoundingClientRect fallback
 * (covers iframes, weird viewport conditions) and a scroll listener as
 * tertiary safety net. Same logic as the standalone HTML, ported 1:1.
 */
export function useInView(opts = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let obs;
    try {
      obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            setInView(true);
            if (opts.once !== false) obs.unobserve(el);
          }
        },
        { threshold: opts.threshold || 0.12 },
      );
      obs.observe(el);
    } catch (_) {
      /* observer unsupported — fallback below handles it */
    }

    const fallbackTimer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh + 100 && rect.bottom > -100) setInView(true);
    }, 600);

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        setInView(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("scroll", onScroll);
      if (obs) obs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

/**
 * usePrefersReducedMotion — mirrors the OS/browser accessibility setting so
 * new motion (bar fills, reveal transforms) can render its end-state
 * immediately instead of animating in.
 */
export function usePrefersReducedMotion() {
  // Start false on BOTH server AND the client's first render so hydration
  // matches. The previous sync matchMedia init returned true on the client
  // under reduce but false on the server, so every component that rendered
  // reduce-conditional text/attrs (e.g. "tap to reset" vs "↻ scan again")
  // tripped React #418 — which discards the prerendered HTML and re-renders
  // the whole tree client-side (a flash on the money page for reduce users).
  // The real value is read post-mount in the effect below; the global
  // `.pro-page-root *` reduced-motion CSS already suppresses the actual
  // animation on first paint, so nothing visibly animates in the meantime.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/**
 * useCounter — eased count-up animation, fires exactly once when `active`
 * becomes true. Cubic ease-out matches the source.
 */
export function useCounter(target, dur = 2000, active = false) {
  const [count, setCount] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    if (!active || fired.current) return;
    fired.current = true;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, dur]);
  return count;
}
