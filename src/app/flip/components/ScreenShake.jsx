"use client";

import { useEffect, useRef } from "react";

/**
 * ScreenShake — wraps children in a div whose transform decays from a
 * random offset to 0 over ~150ms when `trigger` changes. Pure rAF loop,
 * no motion library calls per frame.
 *
 * intensity is the peak pixel offset on each axis.
 */
export default function ScreenShake({ trigger, intensity = 4, duration = 150, children }) {
  const ref = useRef(null);
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (!ref.current) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = (now - start) / duration;
      if (t >= 1) {
        if (ref.current) ref.current.style.transform = "translate3d(0,0,0)";
        return;
      }
      const decay = 1 - t;
      const dx = (Math.random() * 2 - 1) * intensity * decay;
      const dy = (Math.random() * 2 - 1) * intensity * decay;
      if (ref.current) ref.current.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger, intensity, duration]);

  return (
    <div ref={ref} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
