"use client";

import { C } from "../lib/colors.js";
import { CoinMark, FadeUp, ShimmerText } from "./atoms.jsx";

export default function CloserSection({ onCTA }) {
  return (
    <section
      style={{
        padding: "clamp(120px,14vw,192px) 24px",
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

      <FadeUp>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <CoinMark size={18} color="rgba(255,255,255,0.25)" />
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
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

      <FadeUp delay={0.2}>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(56px,11vw,160px)",
            lineHeight: 1.3,
            paddingBottom: "0.5em",
            marginBottom: "0.5em",
          }}
        >
          EVERY <ShimmerText>WEEKEND</ShimmerText>
          <br />
          WITHOUT PRO IS
        </h2>
        <p
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(56px,11vw,160px)",
            lineHeight: 1.3,
            color: C.gold,
            marginBottom: 48,
          }}
        >
          MONEY MISSED.
        </p>
      </FadeUp>

      <FadeUp delay={0.4}>
        <button
          onClick={() => onCTA && onCTA("annual_closer")}
          className="cta-btn-primary"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(24px,3vw,32px)",
            letterSpacing: "0.04em",
            background: C.mint,
            color: C.bg,
            border: "none",
            padding: "24px 64px",
            borderRadius: 6,
            cursor: "pointer",
            animation: "pulseGlow 3s ease-in-out infinite",
            transition: "transform 0.15s cubic-bezier(0.16,1,0.3,1)",
            marginBottom: 24,
          }}
        >
          CLAIM PRO NOW →
        </button>
      </FadeUp>

      <FadeUp delay={0.5}>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 80,
          }}
        >
          $14.99/MO · $99.99/YR · CANCEL ANYTIME · 7-DAY REFUND
        </p>
      </FadeUp>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <CoinMark size={22} />
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
            color: C.mint,
            letterSpacing: "0.15em",
            fontWeight: 700,
          }}
        >
          LOOT.WORKS
        </span>
      </div>
    </section>
  );
}
