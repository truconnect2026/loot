"use client";

import { C } from "../lib/colors.js";
import { CheckIcon, CoinMark } from "./atoms.jsx";
import { PyrexBowl } from "../../marketing-screens/_frame";

/**
 * Live-rendered scan-result card — replaces the old phone-in-hand photo
 * hero asset. Same content a real verdict screen shows, built from the
 * existing brand system (no new visual language) so it stays sharp at
 * any resolution and never carries baked-in bezel/thumb/status-bar
 * artifacts.
 */
const comps = ["sold $85 · 3d ago", "sold $78 · 1w ago", "sold $92 · 2w ago"];

export default function VerdictCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* App-header skin — mirrors the dashboard header (src/app/app/
          page.tsx: CoinMark + LOOT.WORKS wordmark over a hairline).
          The app sets it in Outfit; /pro's kit substitutes Manrope at
          the same size/tracking/color. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 14px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,5,16,0.85)",
        }}
      >
        <CoinMark size={18} />
        <span
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: C.mint,
          }}
        >
          LOOT.WORKS
        </span>
      </div>

      {/* Tab-bar hint — the app really has one (src/components/nav/
          TabBar.tsx: Home / Sourcing / SCAN / Tools / Me, mint top
          hairline, blurred dark bar). Simplified, non-interactive. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          height: 30,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          borderTop: "1px solid rgba(92,224,184,0.15)",
          background: "rgba(10,10,10,0.8)",
        }}
      >
        {["HOME", "SOURCING", "SCAN", "TOOLS", "ME"].map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 6.5,
              letterSpacing: "0.12em",
              textAlign: "center",
              color: t === "SCAN" ? C.mint : "rgba(255,255,255,0.4)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Static camera strip — matches the live card's held-phase
          composition: the scanned item stays visible in the band above
          the sheet instead of leaving a dead black strip. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: 0.85,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 110,
            height: 116,
            borderRadius: 12,
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <div style={{ position: "absolute", top: 4, left: 4, width: 10, height: 10, borderTop: `2px solid ${C.mint}`, borderLeft: `2px solid ${C.mint}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, borderTop: `2px solid ${C.mint}`, borderRight: `2px solid ${C.mint}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", bottom: 4, left: 4, width: 10, height: 10, borderBottom: `2px solid ${C.mint}`, borderLeft: `2px solid ${C.mint}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", bottom: 4, right: 4, width: 10, height: 10, borderBottom: `2px solid ${C.mint}`, borderRight: `2px solid ${C.mint}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 64 }}>
              <PyrexBowl size="100%" />
            </div>
          </div>
        </div>
      </div>

      {/* sheet body — identical skin to the live card's verdict layer:
          bottom-anchored, content-hugging (content owns the stage) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "auto",
          bottom: 0,
          maxHeight: "84%",
          display: "flex",
          flexDirection: "column",
          padding: "7% 9% 12%",
          boxSizing: "border-box",
          background: "rgba(18,14,24,0.92)",
          borderTop: `2px solid ${C.mint}`,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.15)",
            margin: "0 auto 6px",
            flexShrink: 0,
          }}
        />

      {/* 0.5 vs 1 spacer bias (matches the live card): the result block
          sits toward the top of the sheet rather than leaving a dead
          band above the title on tall 9:19.5 frames. */}
      <div style={{ flex: "0.5 1 auto" }} />

      <h3
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "clamp(18px,7cqw,26px)",
          lineHeight: 1.05,
          letterSpacing: "0.03em", // Bebas sub-32px optical tracking
          color: "#fff",
          margin: "0 0 4px",
        }}
      >
        PYREX BUTTERPRINT 403
      </h3>
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          margin: "0 0 14px",
        }}
      >
        {/* en-dash for numeric ranges is correct and permanent; the
            no-dash rule applies to em-dashes in prose only */}
        1957&ndash;68 &middot; Pyrex &middot; verified
      </p>

      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          background: C.mint,
          color: "#070510",
          fontFamily: "var(--font-mono), monospace",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.06em",
          padding: "5px 12px",
          borderRadius: 999,
          marginBottom: "9%",
        }}
      >
        CONDITION: EXCELLENT
      </div>

      <div style={{ textAlign: "center", marginBottom: "8%" }}>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: 4,
          }}
        >
          RESALE RANGE
        </div>
        <div
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(26px,11cqw,40px)",
            color: C.mint,
            lineHeight: 1,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          $75&ndash;$95
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: "7%" }}>
        {comps.map((line) => (
          <div
            key={line}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: C.mint,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <CheckIcon size={13} color={C.mint} /> AUTHENTIC
      </div>

      <div style={{ flex: "1 1 auto" }} />

      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.14em",
          color: C.mint,
          paddingTop: 16,
        }}
      >
        loot.works
      </div>
      </div>
    </div>
  );
}
