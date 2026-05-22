"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useTransform } from "motion/react";
import { useCursorPosition } from "../hooks/useMouseManager.jsx";
import { useDeviceClass } from "../lib/perf.js";

const TRAIL_LENGTH = 3;

/**
 * Mint-dot cursor + faint trail. Only renders on fine-pointer desktop with
 * motion enabled. Hides the native cursor via `body.fos-cursor-active`.
 *
 * PERF: skips on mobile/low-end devices automatically.
 */
export default function CosmicCursor() {
  const { coarsePointer, reducedMotion } = useDeviceClass();
  const enabled = !coarsePointer && !reducedMotion;
  const { x, y, interactive } = useCursorPosition();
  const [clickRipple, setClickRipple] = useState(0);
  const trailRef = useRef([]);
  const [trailTick, setTrailTick] = useState(0);

  // Outer ring scales when hovering an interactive elt.
  const ringScale = useTransform(interactive, [0, 1], [1, 1.6]);
  const ringGlow = useTransform(interactive, [0, 1], [
    "drop-shadow(0 0 0 rgba(92,224,184,0))",
    "drop-shadow(0 0 8px #5CE0B8)",
  ]);

  // Trail: snapshot the latest few positions every 60ms.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      trailRef.current = [
        { x: x.get(), y: y.get() },
        ...trailRef.current.slice(0, TRAIL_LENGTH - 1),
      ];
      setTrailTick((k) => k + 1);
    }, 60);
    return () => window.clearInterval(id);
  }, [enabled, x, y]);

  // Click ripple
  useEffect(() => {
    if (!enabled) return;
    const onClick = () => setClickRipple((k) => k + 1);
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [enabled]);

  // Hide native cursor while active
  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("fos-cursor-active");
    return () => document.body.classList.remove("fos-cursor-active");
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Trail dots */}
      {trailRef.current.map((pos, i) => (
        <div
          key={`${trailTick}-${i}`}
          className="fos-cursor-trail"
          style={{
            transform: `translate3d(${pos.x - 2}px, ${pos.y - 2}px, 0)`,
            opacity: 0.6 - i * 0.2,
          }}
        />
      ))}
      {/* Outer ring */}
      <motion.div
        className="fos-cursor-ring"
        style={{ x, y, scale: ringScale, filter: ringGlow }}
        aria-hidden="true"
      />
      {/* Inner dot */}
      <motion.div className="fos-cursor-dot" style={{ x, y }} aria-hidden="true" />
      {/* Ripple on click */}
      {clickRipple > 0 && (
        <motion.div
          key={clickRipple}
          className="fos-cursor-ripple"
          style={{ x, y }}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        />
      )}
    </>
  );
}
