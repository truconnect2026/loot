"use client";

import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import {
  CTAButton,
  Eyebrow,
  FadeUp,
  SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

// "Sale-day planner", not "Yard sale map": the shipped feature is the
// /sourcing thrift sale-day planner. A yard-sale map does not exist in
// the app (coming-soon placeholder only) — naming it here would be a
// fabricated capability.
const monthlyBullets = ["Unlimited scans", "BOLO alerts", "Sale-day planner", "Fake check"];
const annualBullets = ["Everything in Monthly", "Priority support", "New features first"];

export default function PricingSection({ onCTA }) {
  return (
    <section
      id="pricing"
      className="pro-snap-section"
      style={{
        padding: SECTION_PADDING,
        // Internal-scroll section: extra bottom room so an in-app-browser
        // fold (~620px usable) never rests decapitating the last card.
        // 176 = 96 + 80: compensates the founding-line + founding-bullet
        // removal so the section snap height (and every rest position
        // after it) is unchanged.
        paddingBottom: 176,
        position: "relative",
        zIndex: 1,
        // Two pricing cards + fine print reliably exceed one viewport —
        // top-align + scroll internally rather than center-force.
        justifyContent: "flex-start",
      }}
    >
      <SectionShell maxWidth={920}>
        <FadeUp>
          <Eyebrow text="— two ways in" color={C.mint} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              paddingBottom: "0.5em",
              // 24: the comparison strip below the headline now carries the
              // spacing the old 58 provided.
              marginBottom: 24,
            }}
          >
            PICK YOUR <span style={{ color: C.mint }}>WEAPON.</span>
          </h2>
        </FadeUp>

        {/* Comparison moment — the two cards never share a screen on
            mobile, so the head-to-head happens HERE: a toggle-free visual
            anchor, no interactivity, no CTA. Outside .pricing-grid so it
            never picks up the per-card snap points. */}
        <FadeUp delay={0.2}>
          <div
            aria-hidden="true"
            style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: C.mint,
                border: `1px solid ${C.mint}`,
                background: "rgba(92,224,184,0.08)",
                borderRadius: 999,
                padding: "5px 12px",
                whiteSpace: "nowrap",
              }}
            >
              annual $8.33/mo · save $80
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 999,
                padding: "5px 12px",
                whiteSpace: "nowrap",
              }}
            >
              monthly $14.99
            </span>
          </div>
        </FadeUp>

        <div
          className="pricing-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 30 }}
        >
          {/* Annual */}
          <FadeUp delay={0.25}>
            <div
              className="pricing-card pricing-card--annual"
              style={{
                // dominant card: annual leads on mobile and carries the emphasis
                transform: "scale(1.015)",
                transformOrigin: "center top",
                background: "rgba(92,224,184,0.035)",
                border: `2px solid ${C.mint}`,
                borderRadius: 20,
                padding: "clamp(22px,3.5vw,32px)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
                boxShadow: "0 0 40px rgba(92,224,184,0.12)",
                transition: "box-shadow 0.25s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -13,
                  right: 20,
                  background: C.mint,
                  color: C.bg,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 8,
                }}
              >
                ↓ Save $80
              </div>

              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.gold,
                  marginBottom: 10,
                }}
              >
                BEST VALUE
              </p>
              <p
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(48px,8vw,72px)",
                  color: "#fff",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: 8,
                  filter: "drop-shadow(0 0 24px rgba(92,224,184,0.4))",
                }}
              >
                $99.99
                <span style={{ fontSize: "0.4em", color: "rgba(255,255,255,0.35)" }}>/yr</span>
              </p>
              {/* $8.33 is the best number on the page — promoted from a
                  gray footnote to its own beat: second thing the eye hits
                  after $99.99. Bebas sub-32px carries 0.03em optical
                  tracking per the brand type system. */}
              <p style={{ margin: "0 0 2px", lineHeight: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "clamp(26px,7vw,36px)",
                    letterSpacing: "0.03em",
                    color: C.mint,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  $8.33/mo
                </span>{" "}
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  billed annually
                </span>
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 18,
                }}
              >
                vs $14.99 monthly · 44% off
              </p>
              <ul style={{ listStyle: "none", padding: 0, flex: 1, marginBottom: 20 }}>
                {annualBullets.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.65)",
                      padding: "5px 0",
                      borderBottom: "1px solid rgba(92,224,184,0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ color: C.gold, fontSize: 16, textShadow: "0 0 8px rgba(245,197,24,0.5)" }}>★</span> {f}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CTAButton
                  variant="primary"
                  onClick={() => {
                    track("pro_plan_clicked", { plan: "annual", price: 99.99 });
                    onCTA && onCTA("annual");
                  }}
                >
                  CLAIM ANNUAL
                </CTAButton>
              </div>
            </div>
          </FadeUp>

          {/* Monthly */}
          <FadeUp delay={0.35}>
            <div
              className="pricing-card"
              style={{
                opacity: 0.94,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "clamp(22px,3.5vw,32px)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                transition: "border-color 0.25s",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 10,
                }}
              >
                MONTHLY
              </p>
              <p
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(48px,8vw,72px)",
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: 8,
                }}
              >
                $14.99
                <span style={{ fontSize: "0.4em", color: "rgba(255,255,255,0.35)" }}>/mo</span>
              </p>
              <p
                style={{
                  fontFamily: "var(--font-manrope), sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 18,
                  lineHeight: 1.4,
                }}
              >
                pay as you flip. cancel whenever.
              </p>
              <ul style={{ listStyle: "none", padding: 0, flex: 1, marginBottom: 20 }}>
                {monthlyBullets.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.65)",
                      padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ color: C.mint, fontWeight: 700 }}>→</span> {f}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CTAButton
                  variant="outline"
                  onClick={() => {
                    track("pro_plan_clicked", { plan: "monthly", price: 14.99 });
                    onCTA && onCTA("monthly");
                  }}
                >
                  START MONTHLY
                </CTAButton>
              </div>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.4}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              textAlign: "center",
              color: "rgba(255,255,255,0.2)",
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
