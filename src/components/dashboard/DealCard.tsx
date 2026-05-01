"use client";

import { useState } from "react";

export interface Deal {
  id: string;
  title: string;
  price: number; // 0 when isFree
  estimatedValue: number;
  distance: string; // e.g. "2.3 mi"
  source: string; // raw, e.g. "fb_marketplace", "craigslist_free", "nextdoor"
  isFree: boolean;
  postedAt: string; // human-formatted, e.g. "3h ago"
  url: string;
}

// Map a raw source string to its short two-letter platform code.
export function sourceTag(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("marketplace") || s.includes("fb")) return "FB";
  if (s.includes("craigslist")) return "CL";
  if (s.includes("nextdoor")) return "ND";
  return "??";
}

// Map a raw source string to a "Open on …" CTA label.
export function sourceCtaLabel(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("marketplace") || s.includes("fb")) return "Open on Facebook";
  if (s.includes("craigslist")) return "Open on Craigslist";
  if (s.includes("nextdoor")) return "Open on Nextdoor";
  return "Open listing";
}

export function dealProfit(deal: Deal): number {
  return deal.estimatedValue - (deal.isFree ? 0 : deal.price);
}

interface DealCardProps {
  deal: Deal;
  onTap: (deal: Deal) => void;
}

export default function DealCard({ deal, onTap }: DealCardProps) {
  const [pressed, setPressed] = useState(false);
  const tag = sourceTag(deal.source);
  const profit = dealProfit(deal);

  return (
    <button
      type="button"
      onClick={() => onTap(deal)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 232,
        minHeight: 152,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        scrollSnapAlign: "start",
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Header row — source pill (left) + posted-at (right). The listed
          price moved out of this row entirely; it lives in the price row
          near the bottom of the card. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 7px",
            borderRadius: 6,
            backgroundColor: deal.isFree
              ? "rgba(92,224,184,0.18)"
              : "rgba(255,255,255,0.05)",
            border: deal.isFree
              ? "1px solid rgba(92,224,184,0.30)"
              : "1px solid rgba(255,255,255,0.08)",
            fontFamily: "var(--font-body)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: deal.isFree ? "#5CE0B8" : "#5A4E70",
            lineHeight: 1,
          }}
        >
          {tag}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 9,
            color: "#5A4E70",
            letterSpacing: "0.05em",
          }}
        >
          {deal.postedAt}
        </span>
      </div>

      {/* Title — 2-line clamp */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 600,
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

      {/* Price row — listed price → estimated value. marginTop:auto pushes
          it to the bottom of available space, just above the absolute
          distance/profit band. */}
      <div
        style={{
          marginTop: "auto",
          marginBottom: 22,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        {deal.isFree ? (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#5CE0B8",
              lineHeight: 1,
            }}
          >
            FREE
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              color: "#C8C0D8",
              lineHeight: 1,
              fontFeatureSettings: '"tnum"',
            }}
          >
            ${deal.price}
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#5A4E70",
            lineHeight: 1,
          }}
        >
          →
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 700,
            color: "#5CE0B8",
            lineHeight: 1,
            fontFeatureSettings: '"tnum"',
          }}
        >
          ${deal.estimatedValue}
        </span>
      </div>

      {/* Distance — bottom-left */}
      <span
        style={{
          position: "absolute",
          bottom: 12,
          left: 14,
          fontFamily: "var(--font-body)",
          fontSize: 9,
          color: "#5A4E70",
          letterSpacing: "0.05em",
        }}
      >
        {deal.distance}
      </span>

      {/* Profit indicator — bottom-right */}
      {profit > 0 && (
        <span
          style={{
            position: "absolute",
            bottom: 12,
            right: 14,
            fontFamily: "var(--font-body)",
            fontSize: 9,
            fontWeight: 600,
            color: "#5CE0B8",
            letterSpacing: "0.05em",
          }}
        >
          +${profit}
        </span>
      )}
    </button>
  );
}
