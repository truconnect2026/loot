"use client";

import { useState } from "react";

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
 * routes to /api/stripe/checkout via the parent's onSubscribe. The
 * mint border + crown match the Pro plan card's chrome so the slot
 * feels continuous before/after upgrade.
 */
export default function UpgradeCard({
  monthlyPriceId,
  annualPriceId,
  onSubscribe,
}: UpgradeCardProps) {
  return (
    <>
      <style>{`
        .upgrade-card-surface {
          position: relative;
        }
        .upgrade-card-surface::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(92,224,184,0.40) 0%,
            rgba(92,224,184,0.10) 50%,
            rgba(90,78,112,0.20) 100%
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
      <div
        className="upgrade-card-surface"
        style={{
          marginTop: 16,
          position: "relative",
          backgroundColor: "#1E1838",
          borderRadius: "4px 16px 16px 16px",
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 4px 24px -4px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
          padding: 20,
          overflow: "hidden",
        }}
      >
        {/* Crown — matches ProfileCard treatment */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(to right, #5CE0B8, transparent)",
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 9,
            fontWeight: 600,
            color: "#5CE0B8",
            letterSpacing: "0.14em",
            marginBottom: 4,
          }}
        >
          UPGRADE TO PRO
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
          <span
            style={{
              color: "var(--money)",
              fontWeight: 700,
              fontFeatureSettings: '"tnum"',
            }}
          >
            $1,200/mo
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
          />
          <PriceOption
            label="ANNUAL"
            price="$89.99"
            period="/yr"
            note="save $30 — 2 months free"
            disabled={!annualPriceId}
            onTap={() => onSubscribe(annualPriceId)}
            primary={false}
          />
        </div>
      </div>
    </>
  );
}

interface PriceOptionProps {
  label: string;
  price: string;
  period: string;
  note: string;
  disabled: boolean;
  primary: boolean;
  onTap: () => void;
}

function PriceOption({
  label,
  price,
  period,
  note,
  disabled,
  primary,
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
