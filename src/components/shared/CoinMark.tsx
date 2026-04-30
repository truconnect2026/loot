/**
 * Saturn-style planet mark — tilted ellipse body with a tilted ring
 * split into back/front arcs to suggest depth via opacity (0.3 vs 1.0).
 *
 * Geometry uses a fixed 24×24 viewBox so it scales cleanly with size.
 * Ring is rotated -25°, split at the two opposite ring/planet
 * intersection points (right and left silhouette crossings) so the
 * upper half passes "behind" and the lower half passes "in front".
 *
 * Also exports CoinMarkSpinner (32px, rotating, 0.4 opacity).
 */

interface CoinMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

const BACK_ARC = "M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74";
const FRONT_ARC = "M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74";

export default function CoinMark({
  size = 24,
  color = "currentColor",
  className,
}: CoinMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d={BACK_ARC}
        stroke={color}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.3}
      />
      <ellipse
        cx={12}
        cy={12}
        rx={6.5}
        ry={6}
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d={FRONT_ARC}
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={1}
      />
    </svg>
  );
}

export function CoinMarkSpinner() {
  return (
    <>
      <style>{`
        @keyframes coinSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          opacity: 0.4,
          animation: "coinSpin 2s linear infinite",
          lineHeight: 0,
        }}
      >
        <CoinMark size={32} />
      </div>
    </>
  );
}
