"use client";

import { motion, useTransform } from "motion/react";

/**
 * Full-viewport tint that reacts to the active card's drag. Bound to the
 * shared MotionValue from CardStack via prop.
 */
export default function DirectionalBackground({ x }) {
  const backgroundColor = useTransform(
    x,
    [-200, 0, 200],
    ["rgba(239,68,68,0.15)", "rgba(0,0,0,0)", "rgba(92,224,184,0.15)"],
  );
  return (
    <motion.div
      className="flip-directional-bg"
      style={{ backgroundColor }}
      aria-hidden="true"
    />
  );
}
