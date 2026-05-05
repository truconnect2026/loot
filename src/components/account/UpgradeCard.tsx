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
      {/* Gradient border wrapper — the 1.5px padding becomes the
          border width when the inner content paints its own bg.
          Closing the gradient stop with the same mint as the start
          makes the shimmer wrap-around seamless. */}
      <div
        style={{
          marginTop: 16,
          padding: 1.5,
          borderRadius: 16,
          background:
            "linear-gradient(135deg, " +
            "rgba(92, 224, 184, 0.5), " +
            "rgba(212, 165, 116, 0.4), " +
            "rgba(123, 143, 255, 0.4), " +
            "rgba(92, 224, 184, 0.5)" +
            ")",
          backgroundSize: "300% 300%",
          animation: "upgradeBorderShimmer 6s ease-in-out infinite",
          boxShadow: "0 4px 24px -4px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            position: "relative",
            // Inner content card. 14.5 = 16 wrapper - 1.5 padding so
            // the inner corner sits flush inside the gradient frame.
            borderRadius: 14.5,
            // Top-center mint wash over the opaque base creates a
            // subtle "lit from above" highlight that sells the
            // premium-tier feel without competing with the gradient
            // border. backgroundImage paints over backgroundColor.
            backgroundColor: "#1E1838",
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(92, 224, 184, 0.04) 0%, transparent 50%)",
            padding: 20,
            overflow: "hidden",
          }}
        >
          {/* Section label — gold sparkle pip + mint header. The ✦
              earns its color from the sparkle vocabulary the rest of
              the app uses for premium / first-class moments. */}
          <div
            style={{
              fontFamily: "var(--font-label)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.14em",
              marginBottom: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "#D4A574" }}>✦</span>
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
              price="$9.99"
              period="/mo"
              note="cancel anytime"
              disabled={!monthlyPriceId}
              onTap={() => onSubscribe(monthlyPriceId)}
              primary
              popular
            />
            <PriceOption
              label="ANNUAL"
              price="$89.99"
              period="/yr"
              note={
                <>
                  save{" "}
                  <span style={{ color: "#D4A574", fontWeight: 600 }}>
                    $30
                  </span>{" "}
                  — 2 months free
                </>
              }
              disabled={!annualPriceId}
              onTap={() => onSubscribe(annualPriceId)}
              primary={false}
            />
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
      {/* "POPULAR" recommended indicator — top-right of the
          monthly tile. Tiny mint mono pip; reads as a brand stamp,
          not a sales banner. */}
      {popular && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: "0.10em",
            color: "#5CE0B8",
            backgroundColor: "rgba(92,224,184,0.10)",
            padding: "2px 6px",
            borderRadius: 4,
            textTransform: "uppercase",
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
