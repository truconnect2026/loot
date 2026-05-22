"use client";

/**
 * Full-viewport Saturn-ring SVG layer. Two concentric ellipses rotate
 * extremely slowly (purely cosmetic — the "we're inside the loot.works
 * universe" cue). All animation is CSS so there's no per-frame JS.
 *
 * Props:
 *   opacity   — base opacity multiplier (parent fades this across phases)
 *   spinSpeed — seconds per full revolution (default 120, intro warp uses 0.8)
 *   scale     — scale multiplier (warp animation pushes this to 3 for blow-out)
 */
export default function CosmicRing({ opacity = 1, spinSpeed = 120, scale = 1 }) {
  return (
    <div
      className="flip-cosmic-ring"
      aria-hidden="true"
      style={{
        opacity,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: "opacity 600ms ease, transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <svg
        viewBox="0 0 3000 600"
        preserveAspectRatio="xMidYMid meet"
        style={{ animationDuration: `${spinSpeed}s` }}
        className="flip-cosmic-ring-svg"
      >
        <ellipse cx="1500" cy="300" rx="1490" ry="290" fill="none" stroke="#5CE0B8" strokeWidth="1.5" opacity="0.3" />
        <ellipse cx="1500" cy="300" rx="1300" ry="220" fill="none" stroke="#F5C518" strokeWidth="1" opacity="0.15" />
      </svg>
    </div>
  );
}
