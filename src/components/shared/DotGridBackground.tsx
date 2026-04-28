/**
 * Full-viewport background with two SVG pattern layers.
 * Layer 1: isometric diamond grid (60° angles, 2:1 aspect), stroke #5CE0B8 at 0.015 opacity, static
 * Layer 2: dot grid, 2px circles #5CE0B8, 36px spacing, pulses 0.02 → 0.04 over 8s
 * Pure CSS — no canvas, no JS.
 */

const DIAMOND_W = 40;
const DIAMOND_H = 24;
const DIAMOND_HW = DIAMOND_W / 2;
const DIAMOND_HH = DIAMOND_H / 2;

// True isometric diamond: 2:1 aspect ratio so the side angles are ~60°.
// Points: top-center, right-middle, bottom-center, left-middle.
const diamondSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${DIAMOND_W}' height='${DIAMOND_H}'><path d='M${DIAMOND_HW},0 L${DIAMOND_W},${DIAMOND_HH} L${DIAMOND_HW},${DIAMOND_H} L0,${DIAMOND_HH}Z' fill='none' stroke='%235CE0B8' stroke-width='0.5' opacity='0.015'/></svg>`;

// Dot grid: 2px circle (r=1) on a 36px tile.
const dotSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><circle cx='18' cy='18' r='1' fill='%235CE0B8'/></svg>`;

export default function DotGridBackground() {
  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }
      `}</style>
      {/* Layer 1: isometric diamond grid — static */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundColor: "var(--bg-page)",
          backgroundImage: `url("data:image/svg+xml,${diamondSvg}")`,
          backgroundRepeat: "repeat",
        }}
      />
      {/* Layer 2: dot grid — animated pulse 0.02 → 0.04 over 8s */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,${dotSvg}")`,
          backgroundRepeat: "repeat",
          animation: "dotPulse 8s infinite ease-in-out",
        }}
      />
    </>
  );
}
