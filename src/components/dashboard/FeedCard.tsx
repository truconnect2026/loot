"use client";

import { useState } from "react";

interface FeedCardProps {
  name: string;
  subtitle: string;
  icon: "map-pin" | "tag" | "gift" | "shopping-bag";
  accent: "mint" | "camel";
  count: number;
  isRecent?: boolean;
  onTap: () => void;
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

function GiftIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x={2} y={7} width={20} height={5} />
      <line x1={12} y1={22} x2={12} y2={7} />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function ShoppingBagIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1={3} y1={6} x2={21} y2={6} />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

const ICONS = {
  "map-pin": MapPinIcon,
  "tag": TagIcon,
  "gift": GiftIcon,
  "shopping-bag": ShoppingBagIcon,
};

const ACCENT_COLORS = {
  mint: { hex: "#5CE0B8", rgb: "92,224,184" },
  camel: { hex: "#D4A574", rgb: "212,165,116" },
};

const REST_SHADOW =
  "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)";

export default function FeedCard({
  name,
  subtitle,
  icon,
  accent,
  count,
  isRecent = false,
  onTap,
}: FeedCardProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const IconComponent = ICONS[icon];
  const accentInfo = ACCENT_COLORS[accent];
  const accentHex = accentInfo.hex;
  const accentRgb = accentInfo.rgb;
  const barOpacity = isRecent ? 1 : 0.4;

  // Press: faint accent halo around the card.
  const pressShadow = `0 0 0 1px rgba(${accentRgb},0.10), 0 0 16px -4px rgba(${accentRgb},0.20)`;
  const hoverShadow =
    "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 12px 40px -4px rgba(0,0,0,0.5)";

  const shadow = pressed ? pressShadow : hovered ? hoverShadow : REST_SHADOW;

  return (
    <>
      <style>{`
        @keyframes feedSonar {
          from { transform: scale(1); opacity: 0.5; }
          to { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
      <div
        role="button"
        tabIndex={0}
        onClick={onTap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTap();
          }
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => {
          setPressed(false);
          setHovered(false);
        }}
        onPointerEnter={() => setHovered(true)}
        style={{
          height: 110,
          // Accent-tinted lit-from-above gradient — mint cards skew cool,
          // camel cards skew warm so the 2×2 grid is instantly scannable.
          background: `linear-gradient(180deg, rgba(${accentRgb},0.06) 0%, rgba(255,255,255,0.02) 100%), rgba(255,255,255,0.05)`,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px 16px 16px 16px",
          boxShadow: shadow,
          position: "relative",
          overflow: "hidden",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          userSelect: "none",
          transform: pressed ? "scale(0.98)" : "scale(1)",
          transition:
            "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left accent bar — pill, 8px breathing room top and bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 4,
            backgroundColor: accentHex,
            borderRadius: 2,
            opacity: barOpacity,
          }}
        />

        {/* Icon */}
        <div style={{ marginBottom: 6 }}>
          <IconComponent color={accentHex} />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "var(--text-muted)",
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>

        {/* Badge with sonar ring — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Sonar ring — sits behind the dot */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 8,
                height: 8,
                marginTop: -4,
                marginLeft: -4,
                borderRadius: "50%",
                border: `1.5px solid ${accentHex}`,
                animation:
                  "feedSonar 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                pointerEvents: "none",
              }}
            />
            {/* Center dot */}
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                backgroundColor: accentHex,
                position: "relative",
                zIndex: 1,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: accentHex,
            }}
          >
            {count}
          </span>
        </div>
      </div>
    </>
  );
}
