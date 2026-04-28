"use client";

import TilePressable from "@/components/shared/TilePressable";

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
  mint: "var(--accent-mint)",
  camel: "var(--accent-camel)",
};

export default function FeedCard({
  name,
  subtitle,
  icon,
  accent,
  count,
  isRecent = false,
  onTap,
}: FeedCardProps) {
  const IconComponent = ICONS[icon];
  const accentColor = ACCENT_COLORS[accent];
  const barOpacity = isRecent ? 1 : 0.5;

  return (
    <TilePressable onTap={onTap}>
      <div
        style={{
          height: 100,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "4px 14px 14px 14px",
          position: "relative",
          overflow: "hidden",
          padding: 14,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 10,
            bottom: 10,
            width: 3,
            backgroundColor: accentColor,
            borderRadius: 2,
            opacity: barOpacity,
          }}
        />

        {/* Icon */}
        <div style={{ marginBottom: 6 }}>
          <IconComponent color={accentColor} />
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

        {/* Badge with sonar ping — bottom right */}
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
          <div style={{ position: "relative", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Center dot */}
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                backgroundColor: accentColor,
                position: "relative",
                zIndex: 1,
              }}
            />
            {/* Sonar ring */}
            <style>{`
              @keyframes sonarPing {
                0% {
                  transform: scale(1);
                  opacity: 0.6;
                }
                100% {
                  transform: scale(2.5);
                  opacity: 0;
                }
              }
            `}</style>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `1px solid ${accentColor}`,
                animation: "sonarPing 2.5s ease-out infinite",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: accentColor,
            }}
          >
            {count}
          </span>
        </div>
      </div>
    </TilePressable>
  );
}
