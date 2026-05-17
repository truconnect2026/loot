"use client";

import FlipCoyote from "@/components/shared/FlipCoyote";
import {
  FontLoader,
  PyrexBowl,
  ScreenFrame,
  TabBar,
  TOKENS,
} from "../_frame";

export default function ScanScreen() {
  const RETICLE = 240;
  return (
    <ScreenFrame>
      <FontLoader />
      <style>{`
        @keyframes ms-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes ms-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ms-ring-spin { animation: ms-ring-spin 6s linear infinite; }
      `}</style>

      {/* Camera viewport — dark with faint horizontal scanline pattern */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 55%, #0c1a16 0%, #050706 70%)",
        }}
      />
      {/* Repeating scanline texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(92,224,184,0.04) 0 1px, transparent 1px 4px)",
          pointerEvents: "none",
        }}
      />
      {/* Travelling scanline */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "32%",
          height: 80,
          background:
            "linear-gradient(180deg, rgba(92,224,184,0) 0%, rgba(92,224,184,0.18) 50%, rgba(92,224,184,0) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top header strip with Flip in scanning mood */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 0,
          right: 0,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 4,
        }}
      >
        <div
          className="ms-mono"
          style={{
            fontSize: 10,
            color: TOKENS.mint,
            letterSpacing: "0.22em",
          }}
        >
          ◉ REC
        </div>
        <div
          className="ms-mono"
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.18em",
          }}
        >
          AUTO · 1×
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            position: "relative",
          }}
        >
          {/* Rotating ring overlay */}
          <svg
            className="ms-ring-spin"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            style={{ position: "absolute", inset: 0 }}
          >
            <ellipse
              cx="24"
              cy="24"
              rx="22"
              ry="6"
              fill="none"
              stroke={TOKENS.mint}
              strokeWidth="1.2"
              strokeDasharray="3 4"
              transform="rotate(-23 24 24)"
              opacity="0.85"
            />
          </svg>
          <FlipCoyote mood="scanning" size={48} />
        </div>
      </div>

      {/* Reticle — centered */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: RETICLE,
          height: RETICLE,
          transform: "translate(-50%, -54%)",
          zIndex: 3,
        }}
      >
        {/* 4 corner brackets */}
        {(
          [
            { top: 0, left: 0, rot: 0 },
            { top: 0, right: 0, rot: 90 },
            { bottom: 0, right: 0, rot: 180 },
            { bottom: 0, left: 0, rot: 270 },
          ] as const
        ).map((pos, i) => (
          <svg
            key={i}
            width="28"
            height="28"
            viewBox="0 0 28 28"
            style={{
              position: "absolute",
              ...pos,
              transform: `rotate(${pos.rot}deg)`,
            }}
          >
            <path
              d="M 0 14 L 0 0 L 14 0"
              fill="none"
              stroke={TOKENS.mint}
              strokeWidth="1.5"
            />
          </svg>
        ))}

        {/* Faint reticle outline */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            border: `1px dashed rgba(92,224,184,0.18)`,
          }}
        />

        {/* Crosshair center */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 22,
            height: 22,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1,
              background: TOKENS.mint,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: TOKENS.mint,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Pyrex bowl centered, ~60% of reticle */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <PyrexBowl size={Math.round(RETICLE * 0.6)} />
        </div>
      </div>

      {/* SCANNING… status */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          zIndex: 4,
        }}
      >
        <span
          className="ms-pulse-dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: TOKENS.mint,
            boxShadow: `0 0 12px ${TOKENS.mint}`,
            display: "inline-block",
          }}
        />
        <span
          className="ms-mono"
          style={{
            fontSize: 11,
            color: TOKENS.mint,
            letterSpacing: "0.24em",
            fontWeight: 500,
          }}
        >
          SCANNING…
        </span>
      </div>

      {/* Detected item label above tab bar */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 78,
          padding: "10px 12px",
          border: "1px solid rgba(92, 224, 184, 0.35)",
          background: "rgba(10,22,18,0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 4,
        }}
      >
        <div
          className="ms-mono"
          style={{
            fontSize: 9,
            color: TOKENS.mint,
            letterSpacing: "0.22em",
            marginBottom: 3,
          }}
        >
          DETECTED · 94%
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.15,
            color: "#fff",
          }}
        >
          Glass mixing bowl · turquoise pattern
        </div>
      </div>

      <TabBar active="scan" />
    </ScreenFrame>
  );
}
