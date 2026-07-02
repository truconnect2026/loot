"use client";

import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import { CoinMark, FadeUp } from "./atoms.jsx";

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

      <FadeUp delay={0.2}>
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(48px,9vw,128px)",
            lineHeight: 1.1,
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
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(48px,9vw,128px)",
            lineHeight: 1.1,
            color: C.gold,
            margin: "0 0 48px",
            padding: 0,
          }}
        >
          get to it first.
        </p>
      </FadeUp>

      <FadeUp delay={0.4}>
        {/* Chunkiest CTA on the page — the closer punch. Gradient + top-edge
            highlight gives it a physical-button feel that out-weights every
            other button (hero CLAIM PRO, pricing CLAIM ANNUAL). */}
        <button
          onClick={() => {
            track("pro_closer_cta_clicked", { location: "closer" });
            onCTA && onCTA("annual_closer");
          }}
          className="cta-btn-primary"
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(28px,3.5vw,36px)",
            letterSpacing: "0.04em",
            color: C.bg,
            background: "linear-gradient(180deg, #6FE5C0 0%, #5CE0B8 100%)",
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.3)",
            padding: "28px 64px",
            borderRadius: 6,
            cursor: "pointer",
            boxShadow:
              "0 12px 48px rgba(92,224,184,0.45), inset 0 0 0 1px rgba(92,224,184,0.3)",
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
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 80,
          }}
        >
          $14.99/MO · $99.99/YR · CANCEL ANYTIME · 60-DAY REFUND
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
            fontFamily: "var(--font-mono), monospace",
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
