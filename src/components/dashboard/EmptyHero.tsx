"use client";

import { useState } from "react";

interface EmptyHeroProps {
  /** Tap handler for the primary CTA — opens the scanner directly. */
  onScanTap: () => void;
}

/**
 * Empty-state hero for first-time users (lifetimeScans === 0). Replaces the
 * dim "$0" treatment that read as failure with two things, in order:
 *   1. A demo verdict card that shows the WHAT (sample item + flow).
 *   2. A primary CTA that opens the scanner directly.
 *
 * Once a scan exists in history, page.tsx swaps this out for HeroProfit.
 *
 * Voice rule: lowercase, no terminal periods. Color rule: mint stays
 * reserved for money — the sell price + profit are mint, the cost is not.
 * Font rule: SAMPLE SCAN label is uppercase + mono; everything else is Outfit.
 */
export default function EmptyHero({ onScanTap }: EmptyHeroProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <>
      <style>{`
        /* Demo card — dashed white border + diagonal DEMO watermark so
           the card is unmistakably a preview, not a real scan result.
           Border style switched from solid mint gradient to 2px dashed
           white at 15% alpha; the dashed pattern reads as "this is a
           placeholder" the way drafts and templates do. Watermark
           lives in ::after, rotated -15° and clipped to the card via
           overflow:hidden on the parent — combination of dashed border
           + SAMPLE SCAN pill + DEMO watermark makes accidental
           confusion with real scan history practically impossible. */
        .loot-empty-hero-demo {
          position: relative;
          overflow: hidden;
        }
        .loot-empty-hero-demo::after {
          content: "DEMO";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-15deg);
          font-family: var(--font-label);
          font-weight: 700;
          font-size: 88px;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.04);
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }
        /* All real content inside the card sits above the watermark. */
        .loot-empty-hero-demo > * {
          position: relative;
          z-index: 1;
        }
        /* Profit chip — slow shimmer sweep. The chip's solid mint fill
           stays put; a transparent → white-highlight → transparent
           gradient slides across it every ~3.5s. Eye-catch without
           pulse mechanics. animation cycles the gradient's
           background-position from off-left to off-right. */
        @keyframes emptyHeroChipShimmer {
          0% { background-position: -150% 0, 0 0; }
          60%, 100% { background-position: 250% 0, 0 0; }
        }
      `}</style>
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
      {/* ─── Demo verdict card ─── First taste of a scan result.
          Three signals make the demo nature unmistakable:
            1. 2px dashed white border (instead of solid) — the
               classic visual language for "draft/template/placeholder."
            2. SAMPLE SCAN pill in the top-left corner.
            3. Diagonal DEMO watermark across the card center at 4%.
          The faint mint atmospherics (radial wash + outer glow)
          stay so the card still reads as a money-related preview
          rather than a generic stub. */}
      <div
        className="loot-empty-hero-demo"
        style={{
          // Layered background: scan-lines on top of a faint mint tint
          // on top of the dark base. Comma-separated bg images stack
          // top→bottom in source order. 4px line spacing reads as
          // "scanner refresh" texture; 0.02 alpha keeps it felt-not-seen
          // (was 0.05 — too visible, competed with the price comparison).
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px), radial-gradient(ellipse 100% 80% at 30% 0%, rgba(92,224,184,0.06), transparent 60%)",
          backgroundColor: "#120e18",
          // 2px dashed white at 15% alpha — explicit "this is a
          // template" marker. Replaces the solid mint gradient border.
          border: "2px dashed rgba(255,255,255,0.15)",
          boxShadow:
            // Inset top sheen + recessed-pit shadow + outer mint glow.
            "inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 1px 2px 0 rgba(0,0,0,0.4), 0 0 24px -4px rgba(92,224,184,0.18), 0 4px 16px -4px rgba(0,0,0,0.4)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        {/* SAMPLE SCAN pill — promoted from plain text to a bordered
            chip so the demo card is unambiguously "a preview of what
            you'll get" rather than a generic info card. Mint-bordered
            because the slot delivers money outcomes; the inline-block
            keeps the chip flush left and prevents it from stretching
            across the row. */}
        <span
          style={{
            display: "inline-block",
            padding: "3px 8px",
            border: "1px solid rgba(92,224,184,0.30)",
            backgroundColor: "rgba(92,224,184,0.08)",
            borderRadius: 4,
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            fontSize: 8,
            color: "#5CE0B8",
            letterSpacing: "0.14em",
            lineHeight: 1,
          }}
        >
          SAMPLE SCAN
        </span>

        {/* Item name — body sentence-case (proper nouns stay capitalized
            elsewhere; here it's a generic item description, lowercase) */}
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            color: "#C8C0D8",
            lineHeight: 1.3,
          }}
        >
          vintage Pyrex casserole set
        </div>

        {/* Flow rows: cost → sell. Differentiated visual weight is the
            whole point of the comparison — $5 reads as the cheap input
            (smaller, muted plum), $45 reads as the exciting output
            (larger, bolder, mint). The eye should naturally bounce
            from "$5 cost (small)" → "$45 sell (big)" → "+$40 profit
            chip (shimmering)." 8px gap between rows gives the stair-
            step a moment to breathe. */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <FlowRow
            leftLabel="found at Goodwill"
            rightValue="$5"
            rightColor="#6B5F80"
            valueSize={12}
            valueWeight={600}
          />
          <FlowRow
            leftLabel="sold on eBay"
            rightValue="$45"
            rightColor="#5CE0B8"
            valueSize={18}
            valueWeight={800}
          />
        </div>

        {/* Profit chip — money. The shimmer layer is a transparent →
            white highlight → transparent linear-gradient stacked on
            top of the chip's existing solid mint fill via comma-
            separated background images. background-size makes the
            shimmer 200% wide so it can fully translate off-screen on
            both sides; the keyframe slides background-position from
            -150% to 250%. The static mint fill keeps backgroundSize
            of 100% so it doesn't move. */}
        <div
          style={{
            marginTop: 12,
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
              backgroundImage:
                "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%), linear-gradient(rgba(92,224,184,0.12), rgba(92,224,184,0.12))",
              backgroundSize: "200% 100%, 100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "-150% 0, 0 0",
              border: "1px solid rgba(92,224,184,0.28)",
              borderRadius: 6,
              padding: "3px 10px",
              fontFeatureSettings: '"tnum"',
              boxShadow:
                "0 0 16px -4px rgba(92,224,184,0.35)",
              animation: "emptyHeroChipShimmer 3.5s ease-in-out infinite",
            }}
          >
            +$40 profit
          </span>
        </div>
      </div>

      {/* ─── Primary CTA ─── interactive (white per role system).
          Border alpha bumped from 0.10 → 0.22 so the edge reads as
          unambiguously white. The +$40 mint chip sits directly above
          this button; at 0.10 the white edge was faint enough to
          inherit a perceptual mint cast from the chip. 0.22 forces the
          button to read white on its own. Same logic on the inset
          highlight (0.10 → 0.16). */}
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
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: pressed
            ? "0 0 0 1px rgba(255,255,255,0.28), 0 0 24px -4px rgba(255,255,255,0.20)"
            : "inset 0 1px 0 0 rgba(255,255,255,0.16), 0 1px 2px rgba(0,0,0,0.3)",
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
    </div>
    </>
  );
}

interface FlowRowProps {
  leftLabel: string;
  rightValue: string;
  rightColor: string;
  /** Override the right-value font size (default 13). Used to scale
   * $5 down vs $45 up so the price comparison reads as a stair-step. */
  valueSize?: number;
  /** Override the right-value font weight (default 700). */
  valueWeight?: number;
}

function FlowRow({
  leftLabel,
  rightValue,
  rightColor,
  valueSize = 13,
  valueWeight = 700,
}: FlowRowProps) {
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
          fontWeight: valueWeight,
          fontSize: valueSize,
          color: rightColor,
          fontFeatureSettings: '"tnum"',
          lineHeight: 1,
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
