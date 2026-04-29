"use client";

import { useState } from "react";

export interface DealItem {
  id: string;
  title: string;
  listedPrice: number;
  estimatedValue: number;
  profit: number;
  distance: string;
  timeAgo: string;
  source: "FB Marketplace" | "Craigslist" | "Free" | "Target" | "CVS";
  isFree: boolean;
  imageUrl?: string;
}

interface DealCardProps {
  deal: DealItem;
  onTap: (deal: DealItem) => void;
}

function sourceTag(source: DealItem["source"], isFree: boolean): string {
  if (isFree) return "FREE";
  if (source === "FB Marketplace") return "FB";
  if (source === "Craigslist") return "CL";
  if (source === "Target") return "TGT";
  if (source === "CVS") return "CVS";
  return source;
}

export default function DealCard({ deal, onTap }: DealCardProps) {
  const [pressed, setPressed] = useState(false);

  const isFree = deal.isFree;
  const topAlpha = isFree ? 0.08 : 0.05;
  const sourcePillBg = isFree ? "rgba(92,224,184,0.20)" : "rgba(92,224,184,0.10)";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap(deal)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap(deal);
        }
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: 260,
        flexShrink: 0,
        minHeight: 150,
        background: `linear-gradient(180deg, rgba(92,224,184,${topAlpha}) 0%, rgba(255,255,255,0.02) 100%)`,
        border: "1px solid rgba(92,224,184,0.08)",
        borderRadius: 16,
        boxShadow: pressed
          ? "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.25)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.2)",
        backgroundColor: pressed ? "rgba(255,255,255,0.04)" : undefined,
        scrollSnapAlign: "start",
        padding: 14,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        userSelect: "none",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top row: source pill + time ago */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            backgroundColor: sourcePillBg,
            color: "#5CE0B8",
            borderRadius: 4,
            padding: "2px 6px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          {sourceTag(deal.source, isFree)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#5A4E70",
          }}
        >
          {deal.timeAgo}
        </span>
      </div>

      {/* Item title — clamp to 2 lines */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--font-outfit), sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: "#C8C0D8",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {deal.title}
      </div>

      {/* Price row — pinned to bottom by margin-top auto */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        {isFree ? (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 12,
              color: "#5CE0B8",
              letterSpacing: "0.08em",
            }}
          >
            FREE
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 14,
              color: "#C8C0D8",
              fontFeatureSettings: '"tnum"',
            }}
          >
            ${deal.listedPrice}
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 11,
            color: "#3D2E55",
          }}
        >
          →
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 700,
            fontSize: 14,
            color: "#5CE0B8",
            fontFeatureSettings: '"tnum"',
          }}
        >
          ${deal.estimatedValue}
        </span>
      </div>

      {/* Distance — bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          color: "#5A4E70",
          // Sit just below the price row.
          transform: "translateY(22px)",
        }}
      >
        {deal.distance}
      </div>

      {/* Profit badge — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 14,
          backgroundColor: "rgba(92,224,184,0.12)",
          border: "1px solid rgba(92,224,184,0.20)",
          borderRadius: 6,
          padding: "3px 8px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 700,
          fontSize: 11,
          color: "#5CE0B8",
          fontFeatureSettings: '"tnum"',
        }}
      >
        +${deal.profit}
      </div>
    </div>
  );
}
