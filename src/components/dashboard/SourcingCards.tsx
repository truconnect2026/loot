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
  /** True when the count is zero — dims the bg, switches the border
   * to dashed so the empty state reads as "this slot is available
   * but empty," like an outlined parking space. */
  empty?: boolean;
  /** Optional second line under the count, used by empty-state cards
   * to tell the user when content will arrive (e.g. "check back
   * Saturday") rather than just saying it's empty. */
  emptyHint?: string;
  /** When true, paints a small mint dot in the top-right corner —
   * notification-badge style. Used on Penny Drops when fresh items
   * are available so the card peripherally signals "new activity." */
  hasFresh?: boolean;
  onTap: () => void;
}

function Card({
  variant,
  icon,
  title,
  subtitle,
  count,
  countHex,
  empty = false,
  emptyHint,
  hasFresh = false,
  onTap,
}: CardProps) {
  const [pressed, setPressed] = useState(false);

  // Warm accent tint per variant — the whole card glows in its accent so
  // these read as "live sourcing intel," distinct from the cold tool tiles.
  // Tint sits on top of an opaque page-bg base so the dashboard's grid
  // pattern can never bleed through the card surface.
  const accentRgb = variant === "mint" ? "92,224,184" : "212,165,116";
  const backgroundImage = `linear-gradient(180deg, rgba(${accentRgb},0.07) 0%, rgba(255,255,255,0.01) 100%)`;
  // Empty cards swap the solid hairline for a dashed white outline
  // so they read as "this slot is open / waiting for content"
  // rather than as a styled callout. The dashed treatment is the
  // standard empty-parking-space metaphor.
  const border = empty
    ? "1px dashed rgba(255,255,255,0.06)"
    : `1px solid rgba(${accentRgb},0.10)`;
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
        // Opaque page-bg base (slightly brighter on press) + accent
        // tint gradient on top. backgroundImage paints over
        // backgroundColor, so the grid pattern below the card can't
        // show through. Press state nudges the base toward white
        // instead of swapping in a translucent overlay.
        backgroundColor: pressed ? "#1A1422" : "#120e18",
        backgroundImage,
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
      {/* Empty-state hint — sits under the count, even dimmer.
          Tells the user WHEN content will arrive instead of just
          saying it's empty. */}
      {emptyHint && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "#3D2E55",
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          {emptyHint}
        </div>
      )}
      {/* Fresh-activity dot — top-right corner. Mint at 0.4 alpha
          gives a notification-badge cue without competing with the
          card's accent tint. */}
      {hasFresh && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "rgba(92, 224, 184, 0.4)",
          }}
        />
      )}
    </div>
  );
}

// Empty-state count color — deeper plum than --text-muted so the
// "0 sales near you" / "0 items this week" reads as receded
// background information rather than a styled callout. Same
// treatment for both Penny Drops and Yard Sales empty states.
const EMPTY_COUNT_HEX = "#3D2E55";

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
        // Mint when there's something to act on — sourcing intel that
        // turns into money still earns the money color. Empty state
        // recedes to deep plum + dashed border.
        countHex={pennyItemCount > 0 ? "#5CE0B8" : EMPTY_COUNT_HEX}
        empty={pennyItemCount === 0}
        emptyHint={
          pennyItemCount === 0 ? "check back Tuesday" : undefined
        }
        // Notification-badge dot when fresh items are available so
        // the card signals "new activity" peripherally without a
        // text label.
        hasFresh={pennyItemCount > 0}
        onTap={onPennyTap}
      />
      <Card
        variant="mint"
        icon={<MapIcon />}
        title="Yard Sales"
        subtitle="updates Saturdays"
        count={`${yardSaleTodayCount} sales near you`}
        // Mint at non-zero (real money opportunity nearby); deep
        // plum at zero so "0 sales near you" reads as receded
        // background fact, with a dashed border to signal the slot
        // is empty rather than active.
        countHex={yardSaleTodayCount > 0 ? "#5CE0B8" : EMPTY_COUNT_HEX}
        empty={yardSaleTodayCount === 0}
        emptyHint={
          yardSaleTodayCount === 0 ? "check back Saturday" : undefined
        }
        hasFresh={yardSaleTodayCount > 0}
        onTap={onYardSaleTap}
      />
    </div>
  );
}
