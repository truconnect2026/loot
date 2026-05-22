"use client";

import StarfieldOverlay from "./StarfieldOverlay.jsx";
import CosmicRing from "./CosmicRing.jsx";

/**
 * Full-page cosmic environment that persists across phases.
 * Parent passes phase-specific opacity multipliers so the same DOM stays
 * mounted (no layout thrash, no re-init) while the vibe shifts.
 *
 * Layers (z-index ascending):
 *  0. Hero bg image (cosmic-arrival-bg.png) — falls back to CSS gradient if missing
 *  1. Starfield SVG
 *  2. Mint dot grid
 *  3. Cosmic ring (Saturn-scale page architecture)
 *  4. Aurora sweep (only in results)
 */
export default function CosmicBackdrop({
  bgOpacity = 0.6,
  starOpacity = 1,
  ringOpacity = 1,
  ringScale = 1,
  ringSpin = 120,
  aurora = false,
}) {
  return (
    <div className="flip-cosmic" aria-hidden="true">
      <div
        className="flip-cosmic-bg"
        style={{
          opacity: bgOpacity,
          backgroundImage: 'url("/flip/cosmic-arrival-bg.png")',
        }}
      />
      <div className="flip-cosmic-bg-fallback" style={{ opacity: bgOpacity }} />
      <StarfieldOverlay opacity={starOpacity} />
      <div className="flip-dot-grid" />
      <CosmicRing opacity={ringOpacity} spinSpeed={ringSpin} scale={ringScale} />
      {aurora && <div className="flip-aurora" />}
    </div>
  );
}
