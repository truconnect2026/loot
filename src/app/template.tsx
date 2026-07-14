"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * HOUSE ROUTE TRANSITION — one motion language for every navigation.
 *
 * Next.js remounts a template on each route change, which makes it the
 * native, zero-dependency hook for arrival motion (a true outgoing
 * exit would need the experimental viewTransition flag or a frozen-
 * router wrapper — heavier and more fragile than the feel is worth;
 * the incoming rise over the app's persistent dark backdrop carries
 * the continuity on its own).
 *
 * Contract:
 * - FIRST mount of the session (initial load / hard refresh) renders
 *   inert: SplashGate and each page's own entrance stagger own the
 *   arrival. The stagger owns first mount; this owns route changes.
 * - Route-change mounts play a single whole-plane materialize (fade +
 *   scale 0.98→1, --motion-medium, house ease). Back/forward (popstate)
 *   plays the reverse — a settle back from 1.02→1. Transform/opacity
 *   only, top-anchored origin, zero layout shift.
 * - The persistent `pt-route` class suppresses the per-card entrance
 *   staggers (.hm-root / .tl-stagger / .ac-stagger) on route-change
 *   mounts so plane motion and card motion never stack. The class
 *   must stay for the page instance's lifetime — removing it would
 *   restart the suppressed stagger mid-session.
 * - The wrapper's transform makes it a containing block for
 *   position:fixed descendants (page backgrounds) while animating,
 *   so `animationend` strips the animation class entirely and fixed
 *   re-anchors to the viewport within 180ms. Keep it that way.
 * - TabBar, film grain, and splash mount OUTSIDE this wrapper in the
 *   root layout — persistent chrome never participates.
 * - Scroll: pushes land at top, back/forward restores position
 *   (both Next defaults — standard mobile navigation behavior).
 * - Reduced motion: instant swaps, zero motion.
 */

// Module state survives template remounts: first mount = initial
// load; the popstate listener marks back/forward so the next mount
// plays the reverse settle.
let navCount = 0;
let popped = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    popped = true;
  });
}

type Mode = "first" | "push" | "pop";

export default function Template({ children }: { children: ReactNode }) {
  // Lazy-init ref: computed once per mount (i.e., once per route
  // change), stable across re-renders of the same page instance.
  // READ-ONLY during render — React may attempt, suspend, and retry
  // the initial render, so mutating module state here leaks the
  // increment from discarded attempts and misclassifies the first
  // committed mount as a route change. Mutation lives in the
  // committed mount effect below.
  const mode = useRef<Mode | null>(null);
  if (mode.current === null) {
    mode.current = navCount === 0 ? "first" : popped ? "pop" : "push";
  }
  useEffect(() => {
    navCount += 1;
    popped = false;
  }, []);
  const [done, setDone] = useState(false);

  const cls =
    mode.current === "first"
      ? undefined
      : done
        ? "pt-route"
        : `pt-route ${mode.current === "pop" ? "pt-pop" : "pt-in"}`;

  return (
    <>
      <style>{`
        /* Incoming plane materializes into focus: a subtle scale + fade
           rather than a vertical slide. Scale reads as "coming forward"
           — the right cue for lateral peer tabs (a translateY implies a
           push/scroll, which is wrong for switching between equals). The
           push GROWS in (0.98→1), the pop SETTLES back (1.02→1), giving a
           depth-based direction cue without any vertical shift. Origin is
           pinned to the top so the visible viewport top never moves on
           tall scrollable pages (the element's geometric center can sit
           off-screen). Same medium duration + house ease as the tab-icon
           color transition, so nav chrome and page settle as one motion. */
        @keyframes ptRise {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ptSettle {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        .pt-in { animation: ptRise var(--motion-medium) var(--ease-out) backwards; transform-origin: 50% 0; }
        .pt-pop { animation: ptSettle var(--motion-medium) var(--ease-out) backwards; transform-origin: 50% 0; }
        /* Route-change mounts: the plane owns the motion. Page-level
           entrance staggers are first-arrival theater only. */
        .pt-route .hm-root > *:nth-child(n+4),
        .pt-route .tl-stagger > *,
        .pt-route .ac-stagger > * { animation: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .pt-in, .pt-pop { animation: none !important; }
        }
      `}</style>
      <div
        className={cls}
        // animationend bubbles from descendants (scene loops, sheet
        // slides) — only the wrapper's own rise/settle may strip the
        // animation class.
        onAnimationEnd={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.animationName === "ptRise" || e.animationName === "ptSettle")
          ) {
            setDone(true);
          }
        }}
      >
        {children}
      </div>
    </>
  );
}
