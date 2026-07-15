"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll progress hairline — a 2px mint fill pinned to the very top edge
 * of the viewport that tracks how far the visitor is through the page,
 * so a cold visitor on a long page feels forward motion toward the payoff.
 *
 * NON-INVASIVE BY CONSTRUCTION:
 *  - position:fixed SIBLING of the scroller (never inside .pro-scroll-main,
 *    never a snap child) — it cannot move a snap rest or shift layout.
 *  - pointer-events:none — it can never intercept a tap or a swipe.
 *  - READS scrollTop only (one passive listener + rAF, direct style write,
 *    zero React re-renders); the fill is transform:scaleX — compositor-only.
 *  - top anchors below the notch/status bar via safe-area-inset-top (the
 *    root viewport is viewport-fit=cover): resolves to 0 in the IG webview
 *    and browser tabs (their chrome sits above our viewport — no collision),
 *    and to the status-bar height in the installed PWA. Opposite screen
 *    edge from the sticky CLAIM bar, so they can never collide.
 *  - z 110: above the TopStrip's top edge (z 100) so the hairline reads,
 *    below nothing that matters — Toast/CookieBanner live mid/low screen.
 *
 * REDUCED MOTION: intentionally still fills — it's a scroll POSITION
 * indicator, not decoration. There is no transition/easing/spring in
 * either mode: the fill tracks scroll 1:1 by construction.
 */
export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    const scroller = document.querySelector(".pro-scroll-main");
    if (!bar || !scroller) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const p = max > 0 ? Math.min(scroller.scrollTop / max, 1) : 0;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    apply();
    return () => {
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        height: 2,
        zIndex: 110,
        pointerEvents: "none",
      }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          width: "100%",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          willChange: "transform",
          // Understated: dimmer mint body, brighter leading edge — reads
          // as an instrument needle, not a loading bar.
          background: "linear-gradient(90deg, rgba(92,224,184,0.35), rgba(92,224,184,0.9))",
        }}
      />
    </div>
  );
}
