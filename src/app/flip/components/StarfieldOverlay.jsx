"use client";

import { useMemo } from "react";

const STAR_COUNT = 60;

// Seeded PRNG so star positions don't shuffle on every render (and don't
// trigger a hydration mismatch — same seed → same positions both sides).
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildStars(seed = 0xC0FFEE) {
  const rnd = mulberry32(seed);
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    const colorRoll = rnd();
    let color = "rgba(255,255,255,0.45)";
    if (colorRoll > 0.95) color = "rgba(59,130,246,0.7)"; // electric blue
    else if (colorRoll > 0.80) color = "rgba(245,197,24,0.6)"; // gold
    return {
      id: i,
      cx: rnd() * 100, // %
      cy: rnd() * 100, // %
      r: 0.5 + rnd() * 1.5,
      color,
      delay: rnd() * 4, // s
      drifts: rnd() < 0.05, // 5% of stars drift slowly
    };
  });
}

export default function StarfieldOverlay({ opacity = 1 }) {
  const stars = useMemo(() => buildStars(), []);
  return (
    <svg
      className="flip-starfield"
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={s.cx}
          cy={s.cy}
          r={s.r * 0.18} /* viewBox is 100 wide so scale radii way down */
          fill={s.color}
          className={s.drifts ? "flip-star flip-star--drift" : "flip-star"}
          style={{ animationDelay: `${s.delay}s` }}
        />
      ))}
    </svg>
  );
}
