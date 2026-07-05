"use client";

import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import {
  CTAButton,
  Eyebrow,
  FadeUp,
  SECTION_HEADLINE_SIZE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

const monthlyBullets = ["Unlimited scans", "BOLO alerts", "Yard sale map", "Brand authenticator"];
const annualBullets = ["Everything in Monthly", "Priority support", "Early features access", "Founding member status"];

export default function PricingSection({ onCTA }) {
  return (
    <section
      id="pricing"
      className="pro-snap-section"
      style={{
        padding: SECTION_PADDING,
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
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: SECTION_HEADLINE_SIZE,
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: 48,
            }}
          >
            PICK YOUR <span style={{ color: C.mint }}>WEAPON.</span>
          </h2>
        </FadeUp>

        <div
          className="pricing-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 40 }}
        >
          {/* Monthly */}
          <FadeUp delay={0.25}>
            <div
              className="pricing-card"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "clamp(28px,4vw,40px)",
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
                  marginBottom: 16,
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
                  marginBottom: 12,
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
                  marginBottom: 32,
                  lineHeight: 1.4,
                }}
              >
                pay as you flip. cancel whenever.
              </p>
              <ul style={{ listStyle: "none", padding: 0, flex: 1, marginBottom: 32 }}>
                {monthlyBullets.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.65)",
                      padding: "10px 0",
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

          {/* Annual */}
          <FadeUp delay={0.35}>
            <div
              className="pricing-card pricing-card--annual"
              style={{
                background: "rgba(92,224,184,0.035)",
                border: `2px solid ${C.mint}`,
                borderRadius: 20,
                padding: "clamp(28px,4vw,40px)",
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
                  marginBottom: 16,
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
                  marginBottom: 12,
                  filter: "drop-shadow(0 0 24px rgba(92,224,184,0.4))",
                }}
              >
                $99.99
                <span style={{ fontSize: "0.4em", color: "rgba(255,255,255,0.35)" }}>/yr</span>
              </p>
              <p
                style={{
                  fontFamily: "var(--font-manrope), sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 4,
                  lineHeight: 1.4,
                }}
              >
                that&apos;s $8.33/mo
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 32,
                }}
              >
                vs $14.99 monthly · 44% off
              </p>
              <ul style={{ listStyle: "none", padding: 0, flex: 1, marginBottom: 32 }}>
                {annualBullets.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.65)",
                      padding: "10px 0",
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
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                60-DAY REFUND · NO QUESTIONS
              </p>
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
            SECURE CHECKOUT · VISA · MC · AMEX · PAYPAL · POWERED BY DIGISTORE24 + STRIPE
          </p>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
