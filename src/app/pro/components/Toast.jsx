"use client";

import { C } from "../lib/colors.js";

export default function Toast({ message, visible }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
        background: C.mint,
        color: C.bg,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 14,
        fontWeight: 700,
        padding: "14px 28px",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(92,224,184,0.3)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 9999,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
