"use client";

import BottomSheet from "@/components/shared/BottomSheet";
import {
  type Deal,
  sourceCtaLabel,
  sourceTag,
  dealProfit,
} from "@/components/dashboard/DealCard";

interface DealDetailSheetProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
}

function MapPinIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5A4E70"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function sourceFullName(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("marketplace") || s.includes("fb"))
    return "Facebook Marketplace";
  if (s.includes("craigslist")) return "Craigslist";
  if (s.includes("nextdoor")) return "Nextdoor";
  return "Listing";
}

export default function DealDetailSheet({
  open,
  deal,
  onClose,
}: DealDetailSheetProps) {
  const borderColor = deal?.isFree
    ? "rgba(92,224,184,0.30)"
    : "rgba(255,255,255,0.08)";

  return (
    <BottomSheet open={open} onClose={onClose} borderColor={borderColor}>
      {deal ? (
        <DealSheetContent deal={deal} onClose={onClose} />
      ) : (
        <div style={{ height: 120 }} />
      )}
    </BottomSheet>
  );
}

interface DealSheetContentProps {
  deal: Deal;
  onClose: () => void;
}

function DealSheetContent({ deal, onClose }: DealSheetContentProps) {
  const profit = dealProfit(deal);
  const platform = sourceFullName(deal.source);
  const ctaLabel = sourceCtaLabel(deal.source);
  const tag = sourceTag(deal.source);

  function handlePrimary() {
    if (deal.url) {
      window.open(deal.url, "_blank", "noopener,noreferrer");
    } else {
      // Mock data has no real URL yet — log for now.
      console.log(`open listing: ${deal.id}`);
    }
  }

  return (
    <div style={{ padding: "8px 18px 28px" }}>
      {/* Title */}
      <div
        style={{
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 17,
          fontWeight: 600,
          color: "#C8C0D8",
          lineHeight: 1.3,
        }}
      >
        {deal.title}
      </div>

      {/* Source · time */}
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
          color: "#5A4E70",
          letterSpacing: "0.04em",
        }}
      >
        {platform} · {deal.postedAt}
      </div>

      {/* Price comparison panel */}
      <div
        style={{
          marginTop: 16,
          padding: 14,
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 8,
            color: "#5A4E70",
            letterSpacing: "0.12em",
            marginBottom: 6,
          }}
        >
          LISTED → ESTIMATED RESALE
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: deal.isFree ? "#5CE0B8" : "#C8C0D8",
              lineHeight: 1,
            }}
          >
            {deal.isFree ? "FREE" : `$${deal.price}`}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 14,
              color: "#5A4E70",
              lineHeight: 1,
            }}
          >
            →
          </span>
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#C8C0D8",
              lineHeight: 1,
            }}
          >
            ${deal.estimatedValue}
          </span>
        </div>

        {profit > 0 && (
          <div style={{ marginTop: 10, display: "flex" }}>
            <div
              style={{
                backgroundColor: "rgba(92,224,184,0.10)",
                border: "1px solid rgba(92,224,184,0.18)",
                borderRadius: 8,
                padding: "4px 10px",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                color: "#5CE0B8",
                letterSpacing: "0.04em",
              }}
            >
              +${profit} profit
            </div>
          </div>
        )}
      </div>

      {/* Distance */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 11,
          color: "#5A4E70",
        }}
      >
        <MapPinIcon />
        <span>{deal.distance} away</span>
        <span style={{ marginLeft: 8, opacity: 0.7 }}>· {tag}</span>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={handlePrimary}
        style={{
          marginTop: 20,
          width: "100%",
          height: 48,
          backgroundColor: "rgba(92,224,184,0.10)",
          border: "1px solid rgba(92,224,184,0.15)",
          borderRadius: 12,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#5CE0B8",
          cursor: "pointer",
          boxShadow:
            "inset 0 1px 0 0 rgba(92,224,184,0.18), 0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        {ctaLabel}
      </button>

      {/* Secondary text link — dismiss */}
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 14,
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 8,
          fontFamily: "var(--font-outfit), sans-serif",
          fontSize: 13,
          color: "#5A4E70",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        Not interested
      </button>
    </div>
  );
}
