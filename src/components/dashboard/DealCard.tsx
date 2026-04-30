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
  source:
    | "FB Marketplace"
    | "Craigslist"
    | "Nextdoor"
    | "Target"
    | "CVS";
  isFree: boolean;
  imageUrl?: string;
}

interface DealCardProps {
  deal: DealItem;
  onTap: (deal: DealItem) => void;
}

// Tag text is the platform abbreviation. isFree only changes the price row
// and pill background — never the tag text itself.
function sourceTag(source: DealItem["source"]): string {
  if (source === "FB Marketplace") return "FB";
  if (source === "Craigslist") return "CL";
  if (source === "Nextdoor") return "ND";
  if (source === "Target") return "TGT";
  if (source === "CVS") return "CVS";
  return source;
}

export default function DealCard({ deal, onTap }: DealCardProps) {
  const [pressed, setPressed] = useState(false);

  const isFree = deal.isFree;
  const topAlpha = isFree ? 0.08 : 0.05;
  const sourcePillBg = isFree ? "rgba(92,224,184,0.20)" : "rgba(92,224,184,0.10)";

  // Profit-tier visuals — > $100 gets the brighter "this is real money" pop.
  const isBigProfit = deal.profit > 100;
  const profitBg = isBigProfit
    ? "rgba(92,224,184,0.20)"
    : "rgba(92,224,184,0.15)";
  const profitBorder = isBigProfit
    ? "rgba(92,224,184,0.30)"
    : "rgba(92,224,184,0.20)";
  const profitGlow = isBigProfit
    ? "0 0 16px -2px rgba(92,224,184,0.35)"
    : "0 0 12px -2px rgba(92,224,184,0.25)";

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
      {/* Lit-from-above wash — same trick as the hero card. Makes each tile
          read as a glass panel under overhead light, not a flat rectangle. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
        }}
      />

      {/* Top row: source pill + time ago */}
      <div
        style={{
          position: "relative",
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
          {sourceTag(deal.source)}
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
          position: "relative",
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

      {/* Price row — pinned to bottom by margin-top auto. Bottom margin
          reserves space for the distance + profit badge row beneath. */}
      <div
        style={{
          position: "relative",
          marginTop: "auto",
          marginBottom: 24,
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
              fontSize: 14,
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
            color: "#5A4E70",
          }}
        >
          →
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 700,
            fontSize: 15,
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
          bottom: 12,
          left: 14,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          color: "#5A4E70",
        }}
      >
        {deal.distance}
      </div>

      {/* Profit badge — bottom-right. The single most emotional element on
          the card. Bigger profit = brighter pop. */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 14,
          backgroundColor: profitBg,
          border: `1px solid ${profitBorder}`,
          borderRadius: 6,
          padding: "4px 10px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 700,
          fontSize: 12,
          color: "#5CE0B8",
          fontFeatureSettings: '"tnum"',
          boxShadow: profitGlow,
        }}
      >
        +${deal.profit}
      </div>
    </div>
  );
}
