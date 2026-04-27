/**
 * Full-viewport background with two SVG pattern layers.
 * Layer 1: isometric diamond grid, stroke #5CE0B8 at 0.015 opacity, static
 * Layer 2: dot grid, 2px circles #5CE0B8, 36px spacing, 0.03 opacity, pulses 0.02→0.04
 * Pure CSS — no canvas, no JS.
 */

const DIAMOND_SIZE = 40;
const HALF = DIAMOND_SIZE / 2;

// Isometric diamond grid as inline SVG data URI
const diamondSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${DIAMOND_SIZE}' height='${DIAMOND_SIZE}'><path d='M${HALF},0 L${DIAMOND_SIZE},${HALF} L${HALF},${DIAMOND_SIZE} L0,${HALF}Z' fill='none' stroke='%235CE0B8' stroke-width='0.5' opacity='0.015'/></svg>`;

// Dot grid as inline SVG data URI
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
          backgroundImage: `url("data:image/svg+xml,${diamondSvg}")`,
          backgroundRepeat: "repeat",
        }}
      />
      {/* Layer 2: dot grid — animated pulse */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,${dotSvg}")`,
          backgroundRepeat: "repeat",
          opacity: 0.03,
          animation: "dotPulse 8s infinite ease-in-out",
        }}
      />
    </>
  );
}
