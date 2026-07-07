"use client";

import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import {
  CoinMark,
  CTAButton,
  FadeUp,
  SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

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
          <CoinMark size={18} color="rgba(255,255,255,0.25)" />
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

      <FadeUp delay={0.15}>
        <p style={{ margin: "0 0 14px" }}>
          <a
            href="/flip"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "rgba(92,224,184,0.65)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(92,224,184,0.3)",
            }}
          >
            not ready? play today&apos;s flip or skip free &rarr;
          </a>
        </p>
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
          $14.99/MO · $99.99/YR · CANCEL ANYTIME · 60-DAY REFUND
        </p>
      </FadeUp>
      </SectionShell>
    </section>
  );
}
