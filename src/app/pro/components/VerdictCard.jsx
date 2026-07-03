"use client";

import { C } from "../lib/colors.js";
import { CheckIcon, CoinMark } from "./atoms.jsx";

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
        display: "flex",
        flexDirection: "column",
        padding: "14% 9% 8%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "8%" }}>
        <CoinMark size={16} />
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: C.mint,
          }}
        >
          LOOT.WORKS
        </span>
      </div>

      {/* Flexible spacer — the identity block stays pinned near the top,
          the core verdict cluster below floats toward center instead of
          hugging the top of the tall 9:19.5 frame. */}
      <div style={{ flex: "1 1 auto" }} />

      <h3
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "clamp(18px,7cqw,26px)",
          lineHeight: 1.05,
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
  );
}
