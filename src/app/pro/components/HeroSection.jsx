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
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(64px,13vw,200px)",
            lineHeight: 0.85,
            letterSpacing: "-0.01em",
            color: "#fff",
            marginBottom: "0.5em",
            paddingBottom: "0.5em",
          }}
        >
          STOP <ShimmerText>LEAVING</ShimmerText>
          <br />
          MONEY ON
        </h1>
        <p
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(64px,13vw,200px)",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            fontStyle: "italic",
            color: C.gold,
            marginBottom: 40,
          }}
        >
          THE SHELF.
        </p>
      </FadeUp>

      <FadeUp delay={0.5}>
        <p
          style={{
            fontFamily: "'Manrope', sans-serif",
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
        <div
          className="hero-cta-row"
          style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap", marginBottom: 20 }}
        >
          <button
            onClick={() => {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="cta-btn-primary"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
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
            style={{ display: "flex", alignItems: "baseline", gap: 4 }}
          >
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(36px,4vw,52px)",
                color: C.gold,
                lineHeight: 1,
              }}
            >
              $14.99
            </span>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              /mo
            </span>
          </div>
        </div>

        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 32,
          }}
        >
          or $99.99/yr · save $80
        </p>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> 7-day refund
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> cancel anytime
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> pays for itself in 1 flip
          </span>
        </div>
      </FadeUp>
    </section>
  );
}
