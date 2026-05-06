"use client";

import { useState, type ReactNode } from "react";

interface UpgradeCardProps {
  /** Stripe price IDs — pulled from the build-time
   * NEXT_PUBLIC_STRIPE_PRICE_{MONTHLY,ANNUAL} env vars by the parent. */
  monthlyPriceId: string;
  annualPriceId: string;
  onSubscribe: (priceId: string) => void;
}

/**
 * Free-user variant of the plan card. Sits in the same slot as
 * ProfileCard's plan section; sells two prices side-by-side and
 * routes to /api/stripe/checkout via the parent's onSubscribe.
 *
 * Visual treatment is intentionally premium — this is the revenue
 * lever:
 *   - 1.5px gradient border (mint → camel → periwinkle) painted via
 *     a wrapping div with padding, instead of a CSS-mask trick. The
 *     gradient slowly drifts across the border via a 6s background-
 *     position shimmer.
 *   - Inner card surface keeps an opaque #1E1838 base with a faint
 *     mint radial wash from the top-center for a "lit from above"
 *     feel.
 *   - Monthly tile carries a tiny "POPULAR" badge in mint mono.
 *   - Annual tile bolds the dollar savings in camel.
 */
export default function UpgradeCard({
  monthlyPriceId,
  annualPriceId,
  onSubscribe,
}: UpgradeCardProps) {
  return (
    <>
      <style>{`
        @keyframes upgradeBorderShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Gradient border wrapper — full-saturation hex stops at
          0/30/60/100% so the mint→gold→periwinkle hand-off paints
          three distinct color zones instead of muddying into a
          single lavender. Only the 2px edge ever shows (the inner
          card covers the rest), so saturation here is fine — the
          card surface still reads dark. 145deg angle gives the top-
          left mint zone visibility against the page; 400% bg-size +
          4s shimmer keeps the colors drifting. */}
      <div
        style={{
          marginTop: 16,
          padding: 2,
          borderRadius: 16,
          background:
            "linear-gradient(145deg, " +
            "#5CE0B8 0%, " +
            "#D4A574 30%, " +
            "#7B8FFF 60%, " +
            "#5CE0B8 100%" +
            ")",
          backgroundSize: "400% 400%",
          animation: "upgradeBorderShimmer 4s ease-in-out infinite",
          // Elevated card depth — UpgradeCard sits one layer above
          // the rest of the account page surfaces, matching the
          // weight of an open BottomSheet panel.
          boxShadow:
            "0 4px 16px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <div
          style={{
            position: "relative",
            // Inner content card. 14 = 16 wrapper - 2 padding so the
            // inner corner sits flush inside the 2px gradient frame.
            borderRadius: 14,
            // Inner glow — radial wash with origin just above the top
            // edge (50% -10%) creates a downward-facing "lit from
            // above" highlight. 0.10 center alpha (up from 0.07) is
            // the threshold where the wash actually registers on
            // OLED phone screens against the dark base — 0.07 was
            // close to invisible. Base bg stays 0.9 alpha for a
            // solid surface under the gradient frame; the glow
            // paints OVER the base via the comma-separated bg-image
            // stack so it can't get clipped behind the card content.
            backgroundColor: "rgba(23, 18, 42, 0.9)",
            backgroundImage:
              "radial-gradient(ellipse 90% 50% at 50% -10%, rgba(92, 224, 184, 0.10) 0%, transparent 55%)",
            padding: 20,
            overflow: "hidden",
          }}
        >
          {/* Section label — gold sparkle + mint header. The ✦ is
              rendered at 14px (much larger than the 9px label text)
              so it reads as a deliberate accent rather than a
              speck. marginRight on the sparkle gives it a fixed 6px
              gap to the wordmark independent of the label's letter-
              spacing. */}
          <div
            style={{
              fontFamily: "var(--font-label)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.14em",
              marginBottom: 4,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#D4A574",
                fontSize: 14,
                marginRight: 6,
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            <span style={{ color: "#5CE0B8" }}>UPGRADE TO PRO</span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--text-primary)",
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            unlimited scans, unlocked feeds
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.4,
              marginBottom: 16,
            }}
          >
            PRO members average{" "}
            {/* Hero price call-out — JBMono 18/700 mint number,
                Outfit /mo suffix at 12/400 muted. The number is the
                hook; the suffix recedes. */}
            <span style={{ display: "inline-flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#5CE0B8",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                $1,200
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#5A4E70",
                }}
              >
                /mo
              </span>
            </span>{" "}
            in flips found
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PriceOption
              label="MONTHLY"
              price="$14.99"
              period="/mo"
              note="cancel anytime"
              disabled={!monthlyPriceId}
              onTap={() => onSubscribe(monthlyPriceId)}
              primary
              popular
            />
            <PriceOption
              label="ANNUAL"
              price="$99.99"
              period="/yr"
              note={
                <>
                  save{" "}
                  <span style={{ color: "#D4A574", fontWeight: 600 }}>
                    $80
                  </span>{" "}
                  — 5 months free
                </>
              }
              disabled={!annualPriceId}
              onTap={() => onSubscribe(annualPriceId)}
              primary={false}
            />
          </div>
          {/* Feature list — sits beneath the price tiles. The four
              checkmarks read as the value bundle the user gets for
              the price above; mono checks + Outfit body keeps the row
              quiet but legible. */}
          <div
            style={{
              marginTop: 12,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#5A4E70",
              textAlign: "center",
              lineHeight: 1.8,
            }}
          >
            ✓ unlimited scans &nbsp;✓ condition grading &nbsp;✓ flip coach &nbsp;✓ batch listings
          </div>
        </div>
      </div>
    </>
  );
}

interface PriceOptionProps {
  label: string;
  price: string;
  period: string;
  note: ReactNode;
  disabled: boolean;
  primary: boolean;
  popular?: boolean;
  onTap: () => void;
}

function PriceOption({
  label,
  price,
  period,
  note,
  disabled,
  primary,
  popular = false,
  onTap,
}: PriceOptionProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        // Two-row plan tile: top row label + price, bottom row note.
        // The mint glow under the primary tile separates it from the
        // secondary annual option without using a different hue.
        position: "relative",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        backgroundColor: "#120e18",
        backgroundImage: pressed
          ? "linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18))"
          : primary
            ? "linear-gradient(180deg, rgba(92,224,184,0.14) 0%, rgba(92,224,184,0.04) 100%)"
            : "linear-gradient(rgba(255,255,255,0.06), rgba(255,255,255,0.06))",
        border: primary
          ? "1px solid rgba(92,224,184,0.35)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: primary
          ? "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 0 0 1px rgba(92,224,184,0.06), 0 4px 12px rgba(92,224,184,0.10)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.3)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transform: pressed ? "scale(0.99)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* "POPULAR" recommended indicator — single mint pill floating
          half above the tile's top edge. No outer cutout span: the
          earlier nested-span trick was meant to mask the gradient
          border behind the badge, but every solid bg color we tried
          read as a mismatched box on real OLED screens. A bare pill
          overlapping the border is cleaner — the 0.15-alpha mint
          surface lets the border show through faintly, which reads
          as "deliberately on top" rather than "something is wrong
          here." */}
      {popular && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -9,
            right: 14,
            zIndex: 2,
            display: "inline-block",
            backgroundColor: "rgba(92, 224, 184, 0.15)",
            padding: "2px 8px",
            borderRadius: 6,
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#5CE0B8",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          POPULAR
        </span>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.12em",
            color: primary ? "#5CE0B8" : "rgba(255,255,255,0.55)",
          }}
        >
          {label}
        </span>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: 22,
              color: "#E8E0F0",
              fontFeatureSettings: '"tnum"',
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            {period}
          </span>
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: primary ? "rgba(92,224,184,0.75)" : "rgba(255,255,255,0.45)",
        }}
      >
        {note}
      </div>
    </button>
  );
}
