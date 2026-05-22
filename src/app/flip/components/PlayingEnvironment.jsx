"use client";

import { useMemo } from "react";

/**
 * Cinematic atmosphere wrapper around the playing phase. All layers are pure
 * CSS / SVG — no per-frame JS — and live UNDER the card stack but ABOVE the
 * persistent cosmic backdrop.
 *
 *  A. Drift field — slow purple gradient sweep
 *  B. Streak aura — radial glow that intensifies with streak
 *  D. Floating context particles
 *
 * (Score arc lives in its own component so the parent owns answer state.)
 */
export default function PlayingEnvironment({ streak = 0 }) {
  const auraIntensity =
    streak >= 6 ? "high" : streak >= 3 ? "mid" : "low";

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) {
      const roll = (i * 137) % 100;
      let type = "mint";
      if (roll > 90) type = "blue";
      else if (roll > 80) type = "gold";
      arr.push({
        id: i,
        left: ((i * 73) % 100),
        delay: i * 4,
        duration: 30 + (i % 4) * 8,
        type,
      });
    }
    return arr;
  }, []);

  return (
    <div className="flip-env" aria-hidden="true">
      <div className="flip-env-drift" />
      <div className={`flip-env-aura flip-env-aura--${auraIntensity}`} />
      <div className="flip-env-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className={`flip-env-particle flip-env-particle--${p.type}`}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
