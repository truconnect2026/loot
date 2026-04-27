/**
 * SVG coin icon — circle with horizontal line through center,
 * line extends 2px past circle on each side. Stroke-only, 1.5px.
 *
 * Also exports CoinMarkSpinner (32px, rotating, 0.4 opacity).
 */

interface CoinMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function CoinMark({
  size = 24,
  color = "var(--accent-mint)",
  className,
}: CoinMarkProps) {
  const r = size / 2 - 2; // radius leaves room for stroke + line overshoot
  const cx = size / 2;
  const cy = size / 2;
  const lineX1 = cx - r - 2;
  const lineX2 = cx + r + 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
    >
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={1.5} />
      <line
        x1={lineX1}
        y1={cy}
        x2={lineX2}
        y2={cy}
        stroke={color}
        strokeWidth={1.5}
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
