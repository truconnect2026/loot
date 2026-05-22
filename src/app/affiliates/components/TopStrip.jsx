"use client";

import { C } from "../../pro/lib/colors.js";
import { CoinMark } from "../../pro/components/atoms.jsx";

const DIGISTORE_LOGIN = "https://digistore24.com/affiliate/login";

export default function TopStrip() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "14px 24px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(7,5,16,0.72)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap",
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
          LOOT.WORKS / <b>affiliates</b>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: C.mint,
            background: "rgba(92,224,184,0.12)",
            border: `1px solid ${C.mint}`,
            padding: "5px 12px",
            borderRadius: 999,
          }}
        >
          💰 40% RECURRING
        </span>
        <a
          href={DIGISTORE_LOGIN}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: C.mint,
            textDecoration: "underline",
            letterSpacing: "0.06em",
          }}
        >
          Already an affiliate? Sign in to Digistore →
        </a>
      </div>
    </header>
  );
}
