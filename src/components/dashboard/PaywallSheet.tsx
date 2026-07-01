"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import {
  buildDigistoreCheckoutUrl,
  readAffiliateCookies,
} from "@/lib/digistore-affiliate";

/**
 * Paywall — slides up when /api/scan returns 403 (free-user daily
 * limit reached). Shows the limit fraction, both Pro prices, and
 * fires onSubscribe(priceId) when the user picks one. The parent
 * (dashboard) handles the actual checkout redirect.
 *
 * Distinct from a generic error toast: limit-reached isn't a
 * failure, it's a conversion moment, so it gets the full sheet
 * treatment instead of a dismissible banner.
 */

interface PaywallSheetProps {
  open: boolean;
  used: number;
  limit: number;
  monthlyPriceId: string;
  annualPriceId: string;
  onSubscribe: (priceId: string) => void;
  onClose: () => void;
}

export default function PaywallSheet({
  open,
  used,
  limit,
  monthlyPriceId,
  annualPriceId,
  onSubscribe,
  onClose,
}: PaywallSheetProps) {
  // If the user landed via an affiliate (?aff=...), the middleware
  // stamped a digistore cookie. We re-route both CTAs to the
  // Digistore-hosted checkout so the affiliate gets credit.
  const [digistoreUrl, setDigistoreUrl] = useState<string | null>(null);
  useEffect(() => {
    const aff = readAffiliateCookies();
    if (aff.source === "digistore") {
      setDigistoreUrl(
        buildDigistoreCheckoutUrl({
          affId: aff.id,
          campaign: aff.campaign,
        }),
      );
    }
  }, []);

  const handleTap = (priceId: string) => {
    if (digistoreUrl) {
      window.location.href = digistoreUrl;
      return;
    }
    onSubscribe(priceId);
  };

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#5CE0B8">
      <div style={{ padding: "20px 20px 32px" }}>
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 9,
            color: "#5CE0B8",
            letterSpacing: "0.14em",
            marginBottom: 6,
          }}
        >
          {limit === 0 ? "GO PRO" : "DAILY LIMIT REACHED"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--text-primary)",
            lineHeight: 1.25,
            marginBottom: 8,
          }}
        >
          {limit === 0
            ? "Unlock unlimited scans"
            : `${used}/${limit} free scans used today`}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "rgba(255,255,255,0.62)",
            lineHeight: 1.45,
            marginBottom: 18,
          }}
        >
          Pro members scan unlimited and get AI condition grading,
          flip coaching, and batch listing generation.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <PlanButton
            label="MONTHLY"
            price="$14.99"
            period="/mo"
            note="cancel anytime"
            disabled={!digistoreUrl && !monthlyPriceId}
            primary
            onTap={() => handleTap(monthlyPriceId)}
          />
          <PlanButton
            label="ANNUAL"
            price="$99.99"
            period="/yr"
            note="save $80 — 5 months free"
            disabled={!digistoreUrl && !annualPriceId}
            primary={false}
            onTap={() => handleTap(annualPriceId)}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: "block",
            margin: "16px auto 0",
            padding: "8px 12px",
            background: "none",
            border: "none",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            cursor: "pointer",
          }}
        >
          maybe later
        </button>
      </div>
    </BottomSheet>
  );
}

interface PlanButtonProps {
  label: string;
  price: string;
  period: string;
  note: string;
  disabled: boolean;
  primary: boolean;
  onTap: () => void;
}

function PlanButton({
  label,
  price,
  period,
  note,
  disabled,
  primary,
  onTap,
}: PlanButtonProps) {
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
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        backgroundColor: "#120e18",
        backgroundImage: pressed
          ? "linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18))"
          : primary
            ? "linear-gradient(180deg, rgba(92,224,184,0.16) 0%, rgba(92,224,184,0.06) 100%)"
            : "linear-gradient(rgba(255,255,255,0.06), rgba(255,255,255,0.06))",
        border: primary
          ? "1px solid rgba(92,224,184,0.40)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: primary
          ? "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 4px 12px rgba(92,224,184,0.12)"
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
