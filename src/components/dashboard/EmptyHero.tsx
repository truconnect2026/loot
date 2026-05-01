"use client";

import { useState } from "react";

interface EmptyHeroProps {
  /** Tap handler for the primary CTA — opens the scanner directly. */
  onScanTap: () => void;
}

/**
 * Empty-state hero for first-time users (lifetimeScans === 0). Replaces the
 * dim "$0" treatment that read as failure with three things, in order:
 *   1. A demo verdict card that shows the WHAT (sample item + flow).
 *   2. A primary CTA that opens the scanner directly.
 *   3. A quiet social-proof line that mirrors the login page.
 *
 * Once a scan exists in history, page.tsx swaps this out for HeroProfit.
 *
 * Voice rule: lowercase, no terminal periods. Color rule: mint stays
 * reserved for money — the sell price + profit are mint, the cost is not.
 * Font rule: SAMPLE label is uppercase + mono; everything else is Outfit.
 */
export default function EmptyHero({ onScanTap }: EmptyHeroProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        // Outer wrapper matches HeroProfit's glass treatment so the slot
        // doesn't shift dimensions when the swap happens after first scan.
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%), rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.2), 0 8px 24px -4px rgba(0,0,0,0.3)",
        padding: 16,
      }}
    >
      {/* ─── Demo verdict card ─── */}
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.20)",
          border: "1px solid rgba(255,255,255,0.04)",
          boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        {/* SAMPLE label — uppercase category header */}
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 500,
            fontSize: 8,
            color: "#5A4E70",
            letterSpacing: "0.12em",
          }}
        >
          SAMPLE
        </div>

        {/* Item name — body sentence-case (proper nouns stay capitalized
            elsewhere; here it's a generic item description, lowercase) */}
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            color: "#C8C0D8",
            lineHeight: 1.3,
          }}
        >
          vintage Pyrex casserole set
        </div>

        {/* Flow rows: cost → sell. Sell is mint (money); cost is white. */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <FlowRow
            leftLabel="found at Goodwill"
            rightValue="$5"
            rightColor="#C8C0D8"
          />
          <FlowRow
            leftLabel="sold on eBay"
            rightValue="$45"
            rightColor="#5CE0B8"
          />
        </div>

        {/* Profit chip — money */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
              color: "#5CE0B8",
              backgroundColor: "rgba(92,224,184,0.10)",
              border: "1px solid rgba(92,224,184,0.20)",
              borderRadius: 6,
              padding: "3px 10px",
              fontFeatureSettings: '"tnum"',
            }}
          >
            +$40 profit
          </span>
        </div>
      </div>

      {/* ─── Primary CTA ─── interactive (white per role system) */}
      <button
        type="button"
        onClick={onScanTap}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          marginTop: 14,
          width: "100%",
          height: 48,
          backgroundColor: pressed
            ? "rgba(255,255,255,0.10)"
            : "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: pressed
            ? "0 0 0 1px rgba(255,255,255,0.18), 0 0 24px -4px rgba(255,255,255,0.18)"
            : "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.3)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          padding: 0,
          transform: pressed ? "scale(0.98)" : "scale(1)",
          transition:
            "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            color: "#FFFFFF",
          }}
        >
          scan your first item
        </span>
        <ArrowIcon />
      </button>

      {/* ─── Social proof ─── quiet, matching the login treatment */}
      <div
        style={{
          marginTop: 10,
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "rgba(255, 255, 255, 0.30)",
          letterSpacing: "0.04em",
        }}
      >
        join 12,000+ resellers
      </div>
    </div>
  );
}

interface FlowRowProps {
  leftLabel: string;
  rightValue: string;
  rightColor: string;
}

function FlowRow({ leftLabel, rightValue, rightColor }: FlowRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          // Helper text bumped to ~62% white per the spec (was barely
          // visible before).
          color: "rgba(255,255,255,0.62)",
        }}
      >
        {leftLabel}
      </span>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 13,
          color: rightColor,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {rightValue}
      </span>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={5} y1={12} x2={19} y2={12} />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
