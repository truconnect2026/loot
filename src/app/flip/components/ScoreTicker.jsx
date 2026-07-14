"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, useReducedMotion } from "motion/react";

/**
 * Animated "{current}/{total}" counter. Uses a Motion spring so the number
 * smoothly settles to its new value when current changes. Mono + tabular
 * digits so width doesn't shift.
 */
export default function ScoreTicker({ current, total, onTick }) {
  const reduced = useReducedMotion();
  const spring = useSpring(current, { mass: 0.8, stiffness: 75, damping: 15 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    // Reduced motion: jump to the value instantly (no spring settle).
    if (reduced) spring.jump(current);
    else spring.set(current);
  }, [current, spring, reduced]);

  useEffect(() => {
    if (!onTick) return;
    let last = Math.round(spring.get());
    return rounded.on("change", (v) => {
      if (v !== last) {
        last = v;
        onTick(v);
      }
    });
  }, [rounded, spring, onTick]);

  return (
    <span className="flip-score-ticker" aria-live="polite">
      <motion.span>{rounded}</motion.span>
      <span className="flip-score-ticker-sep">/</span>
      <span>{total}</span>
    </span>
  );
}
