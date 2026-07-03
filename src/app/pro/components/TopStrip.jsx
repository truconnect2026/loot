"use client";

import { C } from "../lib/colors.js";
import { CoinMark } from "./atoms.jsx";

export default function TopStrip() {
  return (
    <header
      style={{
        // Sits outside .pro-scroll-main (the page's owned scroll container)
        // as a fixed-height flex sibling, so it's structurally always
        // visible — no "sticky" positioning needed, which sidesteps
        // sticky-in-nested-scroll-container quirks on some engines.
        position: "relative",
        flexShrink: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 48,
        padding: "14px 24px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(7,5,16,0.72)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CoinMark size={20} />
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            color: C.mint,
            letterSpacing: "0.06em",
          }}
        >
          LOOT.WORKS / <b>pro</b>
        </span>
      </div>
      {/* Compliance: replaced fabricated stats ("12,847 RESELLERS · $2.1M
          FLIPPED") with honest framing — no number claims that can't be
          back-validated against real user count + transaction volume.
          Restore real stats here once we can verify them (Digistore + Stripe
          + Supabase aggregates). */}
      <div
        className="strip-stats"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: C.mint,
            display: "inline-block",
            boxShadow: `0 0 10px ${C.mint}`,
            animation: "breathe 2.5s ease-in-out infinite",
          }}
        />
        <span>BUILT FOR RESELLERS</span>
        <span
          style={{
            width: 1,
            height: 12,
            background: "rgba(92,224,184,0.3)",
            display: "inline-block",
          }}
        />
        <span>FOUNDING COHORT</span>
      </div>
    </header>
  );
}
