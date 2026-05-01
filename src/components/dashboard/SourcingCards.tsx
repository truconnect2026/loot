"use client";

import { useState } from "react";

interface SourcingCardsProps {
  pennyItemCount: number;
  yardSaleTodayCount: number;
  onPennyTap: () => void;
  onYardSaleTap: () => void;
}

function TagIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D4A574"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1={8} y1={2} x2={8} y2={18} />
      <line x1={16} y1={6} x2={16} y2={22} />
    </svg>
  );
}

interface CardProps {
  variant: "mint" | "camel";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: string;
  countHex: string;
  onTap: () => void;
}

function Card({
  variant,
  icon,
  title,
  subtitle,
  count,
  countHex,
  onTap,
}: CardProps) {
  const [pressed, setPressed] = useState(false);

  // Warm accent tint per variant — the whole card glows in its accent so
  // these read as "live sourcing intel," distinct from the cold tool tiles.
  const accentRgb = variant === "mint" ? "92,224,184" : "212,165,116";
  const background = `linear-gradient(180deg, rgba(${accentRgb},0.07) 0%, rgba(255,255,255,0.01) 100%)`;
  const border = `1px solid rgba(${accentRgb},0.10)`;
  const restShadow = `inset 0 1px 0 0 rgba(${accentRgb},0.08), 0 2px 8px rgba(0,0,0,0.15)`;

  return (
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
      onPointerLeave={() => setPressed(false)}
      style={{
        flex: 1,
        height: 100,
        background,
        border,
        borderRadius: 14,
        boxShadow: restShadow,
        padding: 14,
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transform: pressed ? "scale(0.98)" : "scale(1)",
        backgroundColor: pressed ? "rgba(255,255,255,0.04)" : undefined,
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>{icon}</div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 14,
          color: "#C8C0D8",
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 9,
          color: "#5A4E70",
          lineHeight: 1.2,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          marginTop: "auto",
          fontFamily: "var(--font-body)",
          fontSize: 10,
          color: countHex,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {count}
      </div>
    </div>
  );
}

export default function SourcingCards({
  pennyItemCount,
  yardSaleTodayCount,
  onPennyTap,
  onYardSaleTap,
}: SourcingCardsProps) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Card
        variant="camel"
        icon={<TagIcon />}
        title="Penny Drops"
        subtitle="updated Tuesdays"
        count={`${pennyItemCount} items this week`}
        countHex="#D4A574"
        onTap={onPennyTap}
      />
      <Card
        variant="mint"
        icon={<MapIcon />}
        title="Yard Sales"
        subtitle="updates Saturdays"
        count={`${yardSaleTodayCount} sales near you`}
        countHex="#5CE0B8"
        onTap={onYardSaleTap}
      />
    </div>
  );
}
