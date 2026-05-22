"use client";

import { C } from "../lib/colors.js";
import { CheckIcon, Eyebrow, FadeUp, ShimmerText } from "./atoms.jsx";

export default function HeroSection() {
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
      <FadeUp delay={0.1}>
        <Eyebrow text="Pro Tier · Founding Pricing" color={C.mint} />
      </FadeUp>

      <FadeUp delay={0.3}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(64px,13vw,200px)",
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            color: "#fff",
            margin: 0,
          }}
        >
          STOP <ShimmerText>LEAVING</ShimmerText>
          <br />
          MONEY
        </h1>
        {/* Line 3 — italic gold, ~75% size so the preposition "ON THE SHELF" stays
            with what it modifies and the sentence resolves rather than competing. */}
        <p
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(48px,9.75vw,150px)",
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
            fontStyle: "italic",
            color: C.gold,
            margin: "0.1em 0 40px",
          }}
        >
          ON THE SHELF.
        </p>
      </FadeUp>

      <FadeUp delay={0.5}>
        <p
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: "clamp(17px,2.2vw,24px)",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.65)",
            maxWidth: 620,
            marginBottom: 48,
          }}
        >
          every thrift run, every yard sale, every estate find. real comps in 1.4 seconds. maps. alerts.
          the unfair advantage every flipper has been waiting for.
        </p>
      </FadeUp>

      <FadeUp delay={0.8}>
        {/* Grouped CTA + price block — subtle mint outline ties them as one unit
            so the eye reads "$14.99 = the price to claim" rather than two
            disconnected components. */}
        <div
          className="hero-cta-row"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 20,
            padding: "8px 8px 8px 0",
            border: "1px solid rgba(92,224,184,0.2)",
            borderRadius: 10,
          }}
        >
          <button
            onClick={() => {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="cta-btn-primary"
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: 28,
              letterSpacing: "0.04em",
              background: C.mint,
              color: C.bg,
              border: "none",
              padding: "24px 48px",
              borderRadius: 6,
              cursor: "pointer",
              animation: "pulseGlow 3s ease-in-out infinite",
              transition: "transform 0.15s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            CLAIM PRO →
          </button>

          <div
            className="hero-price-stack"
            style={{ display: "flex", alignItems: "baseline", gap: 4, padding: "0 8px" }}
          >
            <span
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(36px,4vw,52px)",
                color: C.gold,
                lineHeight: 1,
              }}
            >
              $14.99
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              /mo
            </span>
          </div>
        </div>

        {/* Annual alternative caption — SAVE $80 lives in a mint pill so it
            reads as a chip-style affordance, not body text. */}
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 32,
          }}
        >
          <span>or</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>$99.99/yr</span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(92,224,184,0.15)",
              border: `1px solid ${C.mint}`,
              color: C.mint,
              letterSpacing: "0.1em",
            }}
          >
            SAVE $80
          </span>
        </p>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon size={14} color="rgba(92,224,184,0.8)" /> 7-day refund
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon size={14} color="rgba(92,224,184,0.8)" /> cancel anytime
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon size={14} color="rgba(92,224,184,0.8)" /> pays for itself in 1 flip*
          </span>
        </div>
        {/* Compliance caveat for the "pays for itself in 1 flip" claim. */}
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.35)",
            marginTop: 12,
          }}
        >
          *based on average flip profit. results vary.
        </p>
      </FadeUp>
    </section>
  );
}
