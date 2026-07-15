"use client";

import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import {
  CoinMark,
  CTAButton,
  FadeUp,
  GuaranteeBadge,
  SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import FlipCoyote from "@/components/shared/FlipCoyote";

export default function CloserSection({ onCTA }) {
  return (
    <section
      className="pro-snap-section"
      style={{
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Background Saturn decoration */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: "120vmax", height: "120vmax", flexShrink: 0, opacity: 0.04 }}>
          <svg viewBox="0 0 800 800" fill="none" style={{ width: "100%", height: "100%" }} aria-hidden="true">
            <ellipse cx="400" cy="400" rx="380" ry="100" stroke={C.mint} strokeWidth="0.8" />
            <ellipse cx="400" cy="400" rx="320" ry="80" stroke={C.purple} strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      <SectionShell style={{ position: "relative" }}>
      {/* Phase 3.2: Kronos closes on the buy moment — the same face that
          opened the ad and the hero seals the loop right at the decision.
          Transparent PNG; halo glow gated static under the global reduce. */}
      <FadeUp>
        <div
          className="pro-kronos-idle"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 14,
            filter: "drop-shadow(0 6px 24px rgba(92,224,184,0.3))",
          }}
        >
          <FlipCoyote mood="hyped" size={104} />
        </div>
      </FadeUp>
      <FadeUp>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <CoinMark size={18} color="rgba(255,255,255,0.25)" />
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            the choice
          </span>
        </div>
      </FadeUp>

      <FadeUp delay={0.06}>
        <h2
          style={{
            ...SECTION_HEADLINE_STYLE,
            margin: 0,
            padding: 0,
          }}
        >
          the next find is
          <br />
          already in the bin.
        </h2>
        <p
          style={{
            ...SECTION_HEADLINE_STYLE,
            color: C.gold,
            margin: "0 0 20px",
            padding: 0,
          }}
        >
          get to it first.
        </p>
      </FadeUp>

      {/* Recap strip — one quiet line naming what the page just proved,
          right where the decision happens. No new claims, no links. */}
      <FadeUp delay={0.09}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "rgba(92,224,184,0.5)",
            textAlign: "center",
            margin: "0 0 18px",
          }}
        >
          scan &middot; shelf &middot; fake check &middot; real comps
        </p>
      </FadeUp>

      <FadeUp delay={0.12}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <CTAButton
            variant="primary"
            onClick={() => {
              track("pro_closer_cta_clicked", { location: "closer" });
              onCTA && onCTA("annual_closer");
            }}
          >
            CLAIM PRO NOW
          </CTAButton>
        </div>
      </FadeUp>

      {/* Guarantee at the final decision point — the last thing before the
          click is "you're covered for 60 days," not a bare price. */}
      <FadeUp delay={0.14}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <GuaranteeBadge />
        </div>
      </FadeUp>

      {/* Phase 2.2: the FREE fallback as bounce-recovery — a captured
          non-buyer (into the free daily loop) is worth more than a lost one,
          so it's elevated from a dim link to an unmissable ghost pill.
          Secondary to the mint-fill CLAIM above; routes to the free game. */}
      <FadeUp delay={0.15}>
        <div style={{ display: "flex", justifyContent: "center", margin: "0 0 16px" }}>
          <a
            href="/flip"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              letterSpacing: "0.04em",
              color: C.mint,
              textDecoration: "none",
              border: "1px solid rgba(92,224,184,0.4)",
              background: "rgba(92,224,184,0.06)",
              borderRadius: 999,
              padding: "10px 18px",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "0.85em" }}>&#9654;</span> not ready? today&apos;s flip or skip is free
          </a>
        </div>
      </FadeUp>

      <FadeUp delay={0.18}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            margin: 0,
          }}
        >
          $14.99/MO · $99.99/YR · CANCEL ANYTIME
        </p>
      </FadeUp>
      </SectionShell>
    </section>
  );
}
