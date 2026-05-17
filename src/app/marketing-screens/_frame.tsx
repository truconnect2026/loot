"use client";

import type { ReactNode } from "react";

export const TOKENS = {
  bg: "#0a0a0a",
  mint: "#5CE0B8",
  camel: "#D4A574",
  periwinkle: "#7B8FFF",
  red: "#ff6b6b",
  text: "#ffffff",
} as const;

const DOT_GRID_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff'/%3E%3C/svg%3E\")";

export function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at top, #0a1612 0%, #000000 60%)",
        color: TOKENS.text,
        fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Dot-grid background @ 4% */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_GRID_SVG,
          backgroundSize: "16px 16px",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

export function SaturnGlyph({
  size = 14,
  color = TOKENS.mint,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <circle
        cx="8"
        cy="8"
        r="3"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      <ellipse
        cx="8"
        cy="8"
        rx="7"
        ry="2"
        fill="none"
        stroke={color}
        strokeWidth="1"
        transform="rotate(-23 8 8)"
      />
    </svg>
  );
}

export function TabBar({
  active,
}: {
  active: "scan" | "feed" | "map" | "profile";
}) {
  const items: Array<{ key: typeof active; label: string; icon: ReactNode }> =
    [
      {
        key: "scan",
        label: "Scan",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <rect
              x="8"
              y="9"
              width="8"
              height="6"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ),
      },
      {
        key: "feed",
        label: "Feed",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect
              x="4"
              y="5"
              width="16"
              height="3"
              rx="0.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <rect
              x="4"
              y="10.5"
              width="16"
              height="3"
              rx="0.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <rect
              x="4"
              y="16"
              width="16"
              height="3"
              rx="0.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ),
      },
      {
        key: "map",
        label: "Map",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        ),
      },
      {
        key: "profile",
        label: "Profile",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
        background: "rgba(10, 10, 10, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(92, 224, 184, 0.15)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        zIndex: 10,
      }}
    >
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <div
            key={it.key}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              color: isActive ? TOKENS.mint : "rgba(255,255,255,0.45)",
            }}
          >
            {it.icon}
            <span
              style={{
                fontFamily:
                  "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
      @keyframes ms-pulse-mint {
        0%, 100% { box-shadow: 0 0 0 0 rgba(92, 224, 184, 0.55); }
        50% { box-shadow: 0 0 0 10px rgba(92, 224, 184, 0); }
      }
      .ms-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      .ms-pulse { animation: ms-pulse-mint 2.4s infinite; }
      .ms-pulse-dot { animation: ms-pulse-dot 1.6s ease-in-out infinite; }
      @keyframes ms-pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(0.7); }
      }
    `}</style>
  );
}

/**
 * Vector cartoon Pyrex Butterprint 403 Cinderella mixing bowl.
 * 3 colors: turquoise body, white interior, mint farm-scene lines.
 */
export function PyrexBowl({ size = 180 }: { size?: number }) {
  const TURQ = "#6FC9C0";
  const TURQ_DARK = "#4FA7A0";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ display: "block" }}
    >
      {/* Cinderella spout handle (left) */}
      <path
        d="M 32 102 Q 16 100 18 116 Q 22 130 38 124 Z"
        fill={TURQ}
        stroke={TURQ_DARK}
        strokeWidth="1.4"
      />
      {/* Cinderella spout handle (right) */}
      <path
        d="M 168 102 Q 184 100 182 116 Q 178 130 162 124 Z"
        fill={TURQ}
        stroke={TURQ_DARK}
        strokeWidth="1.4"
      />
      {/* Bowl body — wide rim tapering to narrower base */}
      <path
        d="M 30 100 L 36 168 Q 100 184 164 168 L 170 100 Z"
        fill={TURQ}
        stroke={TURQ_DARK}
        strokeWidth="1.6"
      />
      {/* Top rim ellipse — interior white */}
      <ellipse
        cx="100"
        cy="100"
        rx="70"
        ry="14"
        fill="#ffffff"
        stroke={TURQ_DARK}
        strokeWidth="1.6"
      />
      {/* Inner shadow ellipse to suggest depth */}
      <ellipse
        cx="100"
        cy="102"
        rx="60"
        ry="10"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1"
      />
      {/* Butterprint farm-scene band */}
      <g stroke="#5CE0B8" strokeWidth="1.4" fill="none" strokeLinecap="round">
        {/* Top band */}
        <line x1="40" y1="118" x2="160" y2="118" opacity="0.65" />
        <line x1="40" y1="156" x2="160" y2="156" opacity="0.65" />
        {/* Farmer figure (stylized stick) */}
        <circle cx="64" cy="130" r="2.5" />
        <line x1="64" y1="132.5" x2="64" y2="142" />
        <line x1="64" y1="135" x2="58" y2="140" />
        <line x1="64" y1="135" x2="70" y2="140" />
        {/* Wheat sheaf */}
        <line x1="84" y1="142" x2="84" y2="128" />
        <line x1="80" y1="134" x2="84" y2="138" />
        <line x1="88" y1="134" x2="84" y2="138" />
        <line x1="80" y1="130" x2="84" y2="134" />
        <line x1="88" y1="130" x2="84" y2="134" />
        {/* Sun */}
        <circle cx="108" cy="132" r="3" />
        <line x1="108" y1="125" x2="108" y2="127" />
        <line x1="115" y1="132" x2="113" y2="132" />
        <line x1="101" y1="132" x2="103" y2="132" />
        {/* Tree */}
        <line x1="128" y1="142" x2="128" y2="130" />
        <circle cx="128" cy="128" r="4" />
        {/* Barn (simple) */}
        <rect x="142" y="132" width="10" height="10" />
        <line x1="142" y1="132" x2="147" y2="126" />
        <line x1="152" y1="132" x2="147" y2="126" />
      </g>
    </svg>
  );
}

/**
 * Vector cartoon kitschy ceramic bird statue.
 * 3 colors: cream body, brown accents, beak/eye black.
 */
export function CeramicBird({ size = 180 }: { size?: number }) {
  const CREAM = "#E8D6B8";
  const BROWN = "#8A6440";
  const DARK = "#3a2a1c";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ display: "block" }}
    >
      {/* Base pedestal */}
      <ellipse
        cx="100"
        cy="178"
        rx="42"
        ry="8"
        fill={BROWN}
        stroke={DARK}
        strokeWidth="1.4"
      />
      <rect
        x="68"
        y="158"
        width="64"
        height="18"
        rx="2"
        fill={CREAM}
        stroke={DARK}
        strokeWidth="1.4"
      />
      {/* Body (egg-shaped) */}
      <ellipse
        cx="100"
        cy="120"
        rx="42"
        ry="48"
        fill={CREAM}
        stroke={DARK}
        strokeWidth="1.6"
      />
      {/* Wing */}
      <path
        d="M 100 96 Q 132 110 124 150 Q 108 144 96 134 Z"
        fill={BROWN}
        stroke={DARK}
        strokeWidth="1.4"
      />
      {/* Wing detail lines */}
      <path
        d="M 104 110 Q 118 122 116 140"
        fill="none"
        stroke={DARK}
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M 110 116 Q 122 128 120 144"
        fill="none"
        stroke={DARK}
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Head */}
      <circle
        cx="86"
        cy="74"
        r="22"
        fill={CREAM}
        stroke={DARK}
        strokeWidth="1.6"
      />
      {/* Beak */}
      <path
        d="M 64 76 L 50 80 L 64 84 Z"
        fill={BROWN}
        stroke={DARK}
        strokeWidth="1.4"
      />
      {/* Eye */}
      <circle cx="80" cy="70" r="2.4" fill={DARK} />
      <circle cx="80.7" cy="69.3" r="0.7" fill="#ffffff" />
      {/* Cheek blush */}
      <ellipse cx="78" cy="80" rx="4" ry="2" fill="#d49a8a" opacity="0.55" />
      {/* Tail feather */}
      <path
        d="M 142 132 Q 162 124 158 148 Q 148 142 138 138 Z"
        fill={BROWN}
        stroke={DARK}
        strokeWidth="1.4"
      />
      {/* Crest */}
      <path
        d="M 90 52 L 92 42 L 96 50 L 100 40 L 102 52"
        fill="none"
        stroke={DARK}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
