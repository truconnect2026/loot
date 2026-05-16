/**
 * Flip — character mascot. Originally lived inline in
 * src/app/flip/flip-or-skip.jsx; extracted here so the Flip Coach
 * bottom sheet on the dashboard can reuse the same character. The
 * SVG geometry is verbatim from the committed /flip v5 ("scrappy
 * logo") design — fur tufts, cheekbone planes, scar, inner ring,
 * neck V, collar with Saturn easter egg.
 *
 * Renders inside a square wrapper of `size × size` pixels. The
 * internal viewBox is fixed at 160×160 — all interior geometry
 * scales uniformly with the wrapper. Default size of 160 preserves
 * the /flip rendering; 60 is the coach-sheet header size; 28 is
 * the inline coach-bubble avatar size.
 *
 * SPRITE SWAP POINT: replace inline SVG with
 *   <img src={`/flip/${mood}.png`} ... />
 * once the public/flip/ sprite-sheet decision resolves and the 8
 * mood PNGs are committed. At that point the mood union will
 * broaden to include scanning / unicorn / shrug / callOut.
 */

export type FlipCoyoteMood = "smirk" | "hyped" | "sideEye" | "dead";

interface FlipCoyoteProps {
  mood?: FlipCoyoteMood;
  size?: number;
}

export default function FlipCoyote({
  mood = "smirk",
  size = 160,
}: FlipCoyoteProps) {
  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
      }}
    >
      {/* Scoped keyframes — duplicated when FlipCoyote renders multiple
          times in one tree, but the browser dedupes identical
          definitions so the overhead is negligible. Kept here rather
          than in globals.css so the component is self-contained when
          imported anywhere in the app. */}
      <style>{`
        @keyframes flipCoyoteSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes flipCoyoteSpinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flip-coyote-spin,
          .flip-coyote-spin-slow {
            animation: none !important;
          }
        }
      `}</style>

      {/* Stars in negative space */}
      <svg
        viewBox="0 0 160 160"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <circle cx="18" cy="28" r="1" fill="#5CE0B8" opacity="0.5" />
        <circle cx="142" cy="44" r="1.2" fill="#5CE0B8" opacity="0.4" />
        <circle cx="138" cy="124" r="1" fill="#5CE0B8" opacity="0.5" />
        <circle cx="22" cy="138" r="1" fill="#5CE0B8" opacity="0.35" />
        <circle cx="80" cy="14" r="0.8" fill="#5CE0B8" opacity="0.3" />
      </svg>

      {/* Saturn ring — main + inner, rotating 4s */}
      <svg
        viewBox="0 0 160 160"
        className="flip-coyote-spin"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          animation: "flipCoyoteSpin 4s linear infinite",
          transformOrigin: "center",
        }}
      >
        <ellipse
          cx="80"
          cy="80"
          rx="70"
          ry="20"
          fill="none"
          stroke="#5CE0B8"
          strokeWidth="1.5"
          opacity="0.85"
          transform="rotate(-23 80 80)"
        />
        <ellipse
          cx="80"
          cy="80"
          rx="70"
          ry="20"
          fill="none"
          stroke="#000"
          strokeWidth="2.5"
          strokeDasharray="6 50 4 80"
          transform="rotate(-23 80 80)"
        />
        {/* Inner ring (parallel, thinner) */}
        <ellipse
          cx="80"
          cy="80"
          rx="58"
          ry="14"
          fill="none"
          stroke="#5CE0B8"
          strokeWidth="1"
          opacity="0.5"
          transform="rotate(-23 80 80)"
        />
      </svg>

      {/* Ring particles — parallax layer, slower 6s spin */}
      <svg
        viewBox="0 0 160 160"
        className="flip-coyote-spin-slow"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          animation: "flipCoyoteSpinSlow 6s linear infinite",
          transformOrigin: "center",
        }}
      >
        <g transform="rotate(-23 80 80)">
          <circle cx="148" cy="80" r="1.4" fill="#5CE0B8" opacity="0.85" />
          <circle cx="12" cy="80" r="1.2" fill="#5CE0B8" opacity="0.6" />
          <circle cx="118" cy="93" r="0.9" fill="#5CE0B8" opacity="0.5" />
        </g>
      </svg>

      {/* Coyote head + neck */}
      <svg
        viewBox="0 0 160 160"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
        }}
      >
        {/* Outer ears */}
        <path
          d="M 50 50 L 44 22 L 66 42 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1.2"
        />
        <path
          d="M 110 50 L 116 22 L 94 42 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1.2"
        />
        {/* Inner ears — deep mint (replaces washed highlights) */}
        <path d="M 52 44 L 50 30 L 60 40 Z" fill="#2a8a6f" />
        <path d="M 108 44 L 110 30 L 100 40 Z" fill="#2a8a6f" />

        {/* Head */}
        <ellipse
          cx="80"
          cy="86"
          rx="38"
          ry="36"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1.4"
        />

        {/* Cheek shadow */}
        <ellipse cx="80" cy="92" rx="34" ry="28" fill="#0a0a0a" opacity="0.6" />

        {/* Fur tufts — break the head outline (drawn over cheek shadow) */}
        <path
          d="M 56 53 L 53 44 L 63 51 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1"
        />
        <path
          d="M 104 53 L 107 44 L 97 51 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1"
        />
        <path
          d="M 43 89 L 36 87 L 43 96 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1"
        />
        <path
          d="M 117 89 L 124 87 L 117 96 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1"
        />
        <path
          d="M 76 122 L 80 130 L 84 122 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1"
        />

        {/* Cheekbone planes */}
        <line
          x1="58"
          y1="92"
          x2="68"
          y2="102"
          stroke="#5CE0B8"
          strokeWidth="1"
          opacity="0.35"
          strokeLinecap="round"
        />
        <line
          x1="102"
          y1="92"
          x2="92"
          y2="102"
          stroke="#5CE0B8"
          strokeWidth="1"
          opacity="0.35"
          strokeLinecap="round"
        />

        {/* Snout */}
        <path
          d="M 62 102 Q 80 132 98 102 Q 94 116 80 118 Q 66 116 62 102 Z"
          fill="#1a1a1a"
          stroke="#5CE0B8"
          strokeWidth="1.1"
        />

        {/* Scar across snout bridge */}
        <line
          x1="74"
          y1="105"
          x2="79"
          y2="110"
          stroke="#5CE0B8"
          strokeWidth="1"
          opacity="0.65"
          strokeLinecap="round"
        />

        {/* Nose */}
        <ellipse cx="80" cy="108" rx="3.5" ry="2.6" fill="#5CE0B8" />

        {/* Eyes — mood driven */}
        {mood === "smirk" && (
          <g>
            <path
              d="M 60 80 Q 67 76 74 80"
              stroke="#5CE0B8"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Open eye — glow ring + sharper pupil */}
            <circle
              cx="98"
              cy="80"
              r="5.5"
              fill="none"
              stroke="#5CE0B8"
              strokeWidth="0.7"
              opacity="0.4"
            />
            <ellipse cx="98" cy="80" rx="3.5" ry="3" fill="#5CE0B8" />
            <circle cx="99" cy="80" r="0.7" fill="#0a0a0a" />
          </g>
        )}
        {mood === "hyped" && (
          <g>
            <ellipse cx="66" cy="78" rx="4.5" ry="5" fill="#5CE0B8" />
            <circle cx="67" cy="79" r="1.4" fill="#0a0a0a" />
            <ellipse cx="98" cy="78" rx="4.5" ry="5" fill="#5CE0B8" />
            <circle cx="99" cy="79" r="1.4" fill="#0a0a0a" />
          </g>
        )}
        {mood === "sideEye" && (
          <g>
            <path
              d="M 62 80 Q 70 82 74 78"
              stroke="#5CE0B8"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="102" cy="80" rx="2.6" ry="2.2" fill="#5CE0B8" />
            <circle cx="103" cy="80" r="0.9" fill="#0a0a0a" />
          </g>
        )}
        {mood === "dead" && (
          <g stroke="#5CE0B8" strokeWidth="2" strokeLinecap="round">
            <line x1="60" y1="76" x2="70" y2="84" />
            <line x1="70" y1="76" x2="60" y2="84" />
            <line x1="92" y1="76" x2="102" y2="84" />
            <line x1="102" y1="76" x2="92" y2="84" />
          </g>
        )}

        {/* Mouth — mood driven */}
        {mood === "smirk" && (
          <g>
            <path
              d="M 70 112 Q 80 119 90 113"
              stroke="#5CE0B8"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 87 113 L 89 117 L 91 113 Z" fill="#5CE0B8" />
          </g>
        )}
        {mood === "hyped" && (
          <path
            d="M 67 110 Q 80 126 93 110 Q 88 118 80 119 Q 72 118 67 110 Z"
            fill="#0a0a0a"
            stroke="#5CE0B8"
            strokeWidth="1.4"
          />
        )}
        {mood === "sideEye" && (
          <line
            x1="72"
            y1="115"
            x2="88"
            y2="115"
            stroke="#5CE0B8"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}
        {mood === "dead" && (
          <line
            x1="70"
            y1="116"
            x2="90"
            y2="116"
            stroke="#5CE0B8"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}

        {/* Neck V — subtle anchor below the head */}
        <line
          x1="72"
          y1="130"
          x2="66"
          y2="148"
          stroke="#5CE0B8"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <line
          x1="88"
          y1="130"
          x2="94"
          y2="148"
          stroke="#5CE0B8"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Collar — mint hairline + tiny Saturn tag (easter egg) */}
        <line
          x1="66"
          y1="150"
          x2="94"
          y2="150"
          stroke="#5CE0B8"
          strokeWidth="1"
          opacity="0.7"
          strokeLinecap="round"
        />
        <g transform="translate(80 150)">
          <circle
            cx="0"
            cy="0"
            r="1.4"
            fill="none"
            stroke="#5CE0B8"
            strokeWidth="0.7"
            opacity="0.9"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="3.2"
            ry="0.9"
            fill="none"
            stroke="#5CE0B8"
            strokeWidth="0.6"
            opacity="0.7"
            transform="rotate(-23)"
          />
        </g>
      </svg>
    </div>
  );
}
