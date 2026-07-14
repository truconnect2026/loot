"use client";

import { motion, useTransform, useReducedMotion } from "motion/react";

/**
 * Full-viewport tint that reacts to the active card's drag. Bound to the
 * shared MotionValue from CardStack via prop.
 *
 * Reduced motion: the tint stays transparent — the on-card FLIP/SKIP
 * badges + wash overlays (opacity feedback) already show which way you're
 * calling, so a reduce user loses nothing.
 */
export default function DirectionalBackground({ x }) {
  const reduced = useReducedMotion();
  const bgRaw = useTransform(
    x,
    [-200, 0, 200],
    ["rgba(239,68,68,0.15)", "rgba(0,0,0,0)", "rgba(92,224,184,0.15)"],
  );
  const backgroundColor = reduced ? "rgba(0,0,0,0)" : bgRaw;
  return (
    <motion.div
      className="flip-directional-bg"
      style={{ backgroundColor }}
      aria-hidden="true"
    />
  );
}
