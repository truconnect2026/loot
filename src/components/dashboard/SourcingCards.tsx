"use client";

import { useState } from "react";

interface SourcingCardsProps {
  dayOfWeek: number;
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
  subtitleHighlighted: boolean;
  badge: string;
  onTap: () => void;
}

function Card({
  variant,
  icon,
  title,
  subtitle,
  subtitleHighlighted,
  badge,
  onTap,
}: CardProps) {
  const [pressed, setPressed] = useState(false);
  const accentRgb = variant === "mint" ? "92,224,184" : "212,165,116";
  const badgeColor = variant === "mint" ? "#5CE0B8" : "#D4A574";
  const subtitleColor = subtitleHighlighted ? badgeColor : "#5A4E70";

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
        height: 90,
        background: `linear-gradient(180deg, rgba(${accentRgb},0.04) 0%, rgba(255,255,255,0.02) 100%), rgba(255,255,255,0.03)`,
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
        padding: 14,
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        backgroundColor: pressed ? "rgba(255,255,255,0.04)" : undefined,
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--font-outfit), sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: "#C8C0D8",
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 2,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          color: subtitleColor,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 12,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          color: badgeColor,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {badge}
      </div>
    </div>
  );
}

export default function SourcingCards({
  dayOfWeek,
  pennyItemCount,
  yardSaleTodayCount,
  onPennyTap,
  onYardSaleTap,
}: SourcingCardsProps) {
  const isTuesday = dayOfWeek === 2;
  const isSaturday = dayOfWeek === 6;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Card
        variant="camel"
        icon={<TagIcon />}
        title="Penny Drops"
        subtitle={isTuesday ? "NEW THIS WEEK" : "updated Tuesdays"}
        subtitleHighlighted={isTuesday}
        badge={`${pennyItemCount}`}
        onTap={onPennyTap}
      />
      <Card
        variant="mint"
        icon={<MapIcon />}
        title="Yard Sales"
        subtitle={
          isSaturday
            ? `${yardSaleTodayCount} sales near you today`
            : "updates Saturdays"
        }
        subtitleHighlighted={isSaturday}
        badge={`${yardSaleTodayCount}`}
        onTap={onYardSaleTap}
      />
    </div>
  );
}
