"use client";

import { C } from "../lib/colors.js";
import { CoinMark } from "./atoms.jsx";

export default function TopStrip() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
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
        <span>12,847 RESELLERS</span>
        <span
          style={{
            width: 1,
            height: 12,
            background: "rgba(92,224,184,0.3)",
            display: "inline-block",
          }}
        />
        <span>$2.1M FLIPPED</span>
      </div>
    </header>
  );
}
