"use client";

import { useState } from "react";
import { C } from "../../pro/lib/colors.js";
import { CheckIcon, Eyebrow, FadeUp, ShimmerText } from "../../pro/components/atoms.jsx";

const DIGISTORE_SIGNUP = "https://digistore24.com/signup/691098/";

// Commission per monthly Pro sub: $14.99 × 40% = $5.996
const MONTHLY_COMMISSION = 14.99 * 0.4;

const sliderTrack = (val, min, max, color) => ({
  background: `linear-gradient(to right, ${color} ${((val - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((val - min) / (max - min)) * 100}%)`,
});

export default function HeroSection() {
  const [referrals, setReferrals] = useState(25);
  const monthly = Math.round(referrals * MONTHLY_COMMISSION);
  const annual = monthly * 12;

  return (
    <section
      style={{
        padding: "clamp(64px,10vw,96px) 24px clamp(80px,12vw,128px)",
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="aff-hero-grid">
        {/* LEFT — copy */}
        <div>
          <FadeUp delay={0.1}>
            <Eyebrow text="Affiliate Program" color={C.mint} />
          </FadeUp>

          <FadeUp delay={0.25}>
            <h1
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(56px,9vw,144px)",
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
                color: "#fff",
                margin: 0,
              }}
            >
              PROMOTE LOOT.
              <br />
              KEEP 40%.
              <br />
              <ShimmerText>FOREVER.</ShimmerText>
            </h1>
          </FadeUp>

          <FadeUp delay={0.45}>
            <p
              style={{
                fontFamily: "var(--font-manrope), sans-serif",
                fontWeight: 300,
                fontSize: 18,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.75)",
                maxWidth: 540,
                margin: "32px 0",
              }}
            >
              Every month your referral stays subscribed = your commission renews.
              {/* TODO(David): "8+ months" avg retention claim is unverified — pull
                  real Stripe + Digistore retention data before publishing externally. */}
              Average user retention: 8+ months. Math gets fun fast.
            </p>
          </FadeUp>

          <FadeUp delay={0.6}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <a
                href={DIGISTORE_SIGNUP}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn-primary"
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: 22,
                  letterSpacing: "0.04em",
                  background: C.mint,
                  color: C.bg,
                  textDecoration: "none",
                  padding: "18px 36px",
                  borderRadius: 6,
                  animation: "pulseGlow 3s ease-in-out infinite",
                  transition: "transform 0.15s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                GRAB YOUR LINK
              </a>
              <a
                href="#swipe-copy"
                className="cta-btn-outline"
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: 22,
                  letterSpacing: "0.04em",
                  background: "transparent",
                  color: C.mint,
                  border: `2px solid ${C.mint}`,
                  textDecoration: "none",
                  padding: "16px 36px",
                  borderRadius: 6,
                  transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                VIEW SWIPE COPY ↓
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.75}>
            <div
              style={{
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckIcon size={12} color="rgba(92,224,184,0.7)" /> 40% MONTHLY
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckIcon size={12} color="rgba(92,224,184,0.7)" /> 40% ANNUAL
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckIcon size={12} color="rgba(92,224,184,0.7)" /> 60-DAY COOKIE
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckIcon size={12} color="rgba(92,224,184,0.7)" /> WEEKLY PAYOUT
              </span>
            </div>
          </FadeUp>
        </div>

        {/* RIGHT — Earnings preview card */}
        <FadeUp delay={0.4}>
          <div
            style={{
              background: C.card,
              border: "1px solid rgba(92,224,184,0.25)",
              borderRadius: 20,
              padding: "clamp(24px,3vw,32px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: C.mint,
                marginBottom: 24,
              }}
            >
              EARNINGS PREVIEW
            </div>

            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 14,
                }}
              >
                <label
                  htmlFor="aff-referrals-slider"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  referrals you send
                </label>
                <span
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "clamp(40px,6vw,56px)",
                    color: C.mint,
                    lineHeight: 1,
                  }}
                >
                  {referrals}
                </span>
              </div>
              <input
                id="aff-referrals-slider"
                type="range"
                min="1"
                max="100"
                value={referrals}
                onChange={(e) => setReferrals(+e.target.value)}
                className="slider-mint"
                style={sliderTrack(referrals, 1, 100, C.mint)}
                aria-label="Referrals you send per month"
              />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 6,
                }}
              >
                monthly commission
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(40px,6vw,56px)",
                  color: C.gold,
                  lineHeight: 1,
                }}
              >
                ${monthly.toLocaleString()}
                <span style={{ fontSize: "0.4em", color: "rgba(255,255,255,0.35)" }}>/mo</span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: C.mint,
                  marginTop: 12,
                  opacity: 0.85,
                }}
              >
                ${annual.toLocaleString()}/yr if they all stick
              </div>
            </div>

            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.35)",
                marginTop: 18,
                lineHeight: 1.4,
              }}
            >
              *assumes monthly Pro subs at $14.99 × 40%. annual subs pay $40 once.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
