"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import {
  CTAButton,
  Eyebrow,
  FadeUp,
  GuaranteeBadge,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
// NOTE: intentionally NOT using usePrefersReducedMotion here. Its synchronous
// matchMedia init diverges SSR (false) vs client-first-render (true under
// reduce), so gating rendered className/style on it causes a hydration
// mismatch. The global `.pro-page-root *` reduced-motion rule in
// pro.module.css already neutralizes every transition/animation under reduce,
// so the toggle morph is instant for reduce users with zero hydration risk.

// Core product features — what Pro unlocks at either billing pace.
// "Sale-day planner", not "Yard sale map": the shipped feature is the
// /sourcing thrift sale-day planner (a yard-sale map does not exist —
// naming it would be a fabricated capability).
const coreFeatures = ["Unlimited scans", "Fake check", "Sale-day planner", "BOLO alerts"];

// One plan, two billing paces. The toggle SELECTS which existing checkout
// price fires (onCTA("annual") vs onCTA("monthly")) — the money logic in
// page.jsx (priceIdFor + /api/stripe/checkout) is untouched; this card only
// chooses which of the two existing paths a tap sends.
const PLANS = {
  annual: {
    big: "$8.33",
    per: "/mo",
    sub: "billed annually · $99.99/yr",
    verb: "CLAIM ANNUAL",
    price: 99.99,
    accent: C.mint,
  },
  monthly: {
    big: "$14.99",
    per: "/mo",
    sub: "billed monthly · cancel anytime",
    verb: "CLAIM MONTHLY",
    price: 14.99,
    accent: "#fff",
  },
};

const MORPH_CSS = `
@keyframes pricingMorph { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.pricing-morph { animation: pricingMorph 240ms cubic-bezier(0.22,1,0.36,1) both; }
`;

const featRow = {
  fontFamily: "var(--font-manrope), sans-serif",
  fontSize: 15,
  color: "rgba(255,255,255,0.72)",
  // 4px (was 5): trims card height so the guarantee row below CLAIM stays
  // fully unclipped in the short IG-webview fold (~680px).
  padding: "4px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export default function PricingSection({ onCTA }) {
  // Annual pre-selected — BEST VALUE.
  const [plan, setPlan] = useState("annual");
  const isAnnual = plan === "annual";
  const P = PLANS[plan];

  return (
    <section
      id="pricing"
      className="pro-snap-section"
      // Top-align (not the class's upper-third bias): the toggle card is
      // tall, so seat it near the top so the CLAIM CTA reaches the fold in
      // the short IG-webview viewport. Tighter top padding buys the CTA more
      // room. Snap architecture (pro-snap-section, id) untouched.
      style={{ padding: "clamp(18px,4vw,50px) 24px 44px", position: "relative", zIndex: 1, justifyContent: "flex-start" }}
    >
      <style dangerouslySetInnerHTML={{ __html: MORPH_CSS }} />
      <SectionShell maxWidth={920}>
        <FadeUp>
          <Eyebrow text="— pro tier" color={C.mint} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2 style={{ ...SECTION_HEADLINE_STYLE, paddingBottom: "0.25em", marginBottom: 6 }}>
            PICK YOUR <span style={{ color: C.mint }}>PACE.</span>
          </h2>
        </FadeUp>

        {/* Phase 1.3: the value equation as ONE confident anchor at the buy
            moment — the price reframed as a rounding error. Compact single
            line so the card + guarantee stay unclipped in the short IG fold. */}
        <FadeUp delay={0.2}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12.5,
              letterSpacing: "0.04em",
              color: C.gold,
              margin: "0 0 8px",
            }}
          >
            one good flip pays for the whole year.
          </p>
        </FadeUp>

        {/* ONE definitive card — annual/monthly toggle morphs it in place. */}
        <FadeUp delay={0.25}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              style={{
                width: "100%",
                maxWidth: 440,
                background: "rgba(92,224,184,0.04)",
                border: `2px solid ${C.mint}`,
                borderRadius: 22,
                padding: "clamp(20px,4vw,30px)",
                position: "relative",
                boxShadow: "0 0 44px rgba(92,224,184,0.14)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Segmented toggle — sliding mint indicator (transform only). */}
              <div
                role="tablist"
                aria-label="billing pace"
                style={{
                  position: "relative",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 999,
                  padding: 4,
                  marginBottom: 16,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: "calc(50% - 4px)",
                    borderRadius: 999,
                    background: C.mint,
                    transform: isAnnual ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 260ms cubic-bezier(0.22,1,0.36,1)",
                    boxShadow: "0 2px 8px rgba(92,224,184,0.35)",
                  }}
                />
                {["annual", "monthly"].map((p) => {
                  const active = plan === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPlan(p)}
                      style={{
                        position: "relative",
                        zIndex: 1,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "9px 0",
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: active ? C.bg : "rgba(255,255,255,0.55)",
                        transition: "color 200ms",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* BEST VALUE + save $80 — annual only, reserved height so the
                  toggle never shifts the card layout. */}
              <div style={{ minHeight: 20, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: C.gold,
                    opacity: isAnnual ? 1 : 0,
                    transition: "opacity 220ms",
                  }}
                >
                  BEST VALUE
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.bg,
                    background: C.mint,
                    borderRadius: 999,
                    padding: "3px 9px",
                    opacity: isAnnual ? 1 : 0,
                    transition: "opacity 220ms",
                  }}
                >
                  save $80
                </span>
              </div>

              {/* Price — remounts (key=plan) for a compositor crossfade. */}
              <div
                key={plan}
                className="pricing-morph"
                style={{ display: "flex", alignItems: "baseline", lineHeight: 1, marginBottom: 4 }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "clamp(52px,11vw,74px)",
                    color: P.accent,
                    letterSpacing: "0.02em",
                    fontVariantNumeric: "tabular-nums",
                    filter: isAnnual ? "drop-shadow(0 0 24px rgba(92,224,184,0.4))" : "none",
                  }}
                >
                  {P.big}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "clamp(20px,4vw,28px)",
                    color: "rgba(255,255,255,0.4)",
                    marginLeft: 4,
                  }}
                >
                  {P.per}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.5)",
                  margin: "0 0 10px",
                  minHeight: 16,
                }}
              >
                {P.sub}
              </p>

              {/* Features — the 4 core unlocks; annual perks noted below. */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {coreFeatures.map((f) => (
                  <li key={f} style={featRow}>
                    <span style={{ color: C.mint, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11.5,
                  letterSpacing: "0.03em",
                  color: C.gold,
                  margin: "10px 0 0",
                  minHeight: 16,
                  opacity: isAnnual ? 0.9 : 0,
                  transition: "opacity 220ms",
                }}
              >
                ★ annual also: priority support · new features first
              </p>

              {/* CTA — unified CLAIM verb; selects the existing price path. */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                <CTAButton
                  variant="primary"
                  onClick={() => {
                    track("pro_plan_clicked", { plan, price: P.price });
                    onCTA && onCTA(plan);
                  }}
                >
                  {P.verb}
                </CTAButton>
              </div>

              {/* Zero-risk frame — the risk reversal travels WITH the button:
                  a skeptic can't tap CLAIM without seeing "and if I hate it,
                  I get it all back for 60 days." Both objections ("what if it
                  sucks" + "what if I'm trapped") dissolve in one glance. */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <GuaranteeBadge />
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.05em",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  · cancel anytime
                </span>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Trust line — readable at the moment of payment (6f): 0.2 -> 0.42. */}
        <FadeUp delay={0.4}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              textAlign: "center",
              color: "rgba(255,255,255,0.42)",
              textTransform: "uppercase",
            }}
          >
            SECURE CHECKOUT · VISA · MC · AMEX · PAYPAL · POWERED BY STRIPE
          </p>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
