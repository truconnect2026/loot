"use client";

import { useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";

/**
 * Yard Sales sheet — placeholder while the AI yard-sale finder is in
 * development. Sets expectations and captures soft interest via a
 * "notify me" pill that doesn't yet hit a backend (state-only). The
 * pin glyph at 0.3 opacity is intentionally faint — this is a
 * "coming soon" surface, not the real feature.
 */

interface YardSalesSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function YardSalesSheet({ open, onClose }: YardSalesSheetProps) {
  const [notified, setNotified] = useState(false);

  function handleNotify() {
    if (notified) return;
    setNotified(true);
    window.setTimeout(() => setNotified(false), 2000);
  }

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#5CE0B8">
      <div
        style={{
          padding: "32px 18px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <svg
          width={36}
          height={36}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5CE0B8"
          strokeOpacity={0.3}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx={12} cy={10} r={3} />
        </svg>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 17,
            fontWeight: 600,
            color: "#C8C0D8",
          }}
        >
          yard sale map
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#5A4E70",
            lineHeight: 1.6,
            maxWidth: 280,
          }}
        >
          we&apos;re building an AI-powered Saturday morning yard sale
          finder that ranks sales by flip potential and builds the
          fastest driving route
        </div>
        <button
          type="button"
          onClick={handleNotify}
          style={{
            marginTop: 8,
            padding: "8px 20px",
            backgroundColor: "rgba(92,224,184,0.08)",
            border: "1px solid rgba(92,224,184,0.15)",
            borderRadius: 20,
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "#5CE0B8",
            cursor: "pointer",
            transition: "opacity 200ms ease",
          }}
        >
          {notified ? "you'll be the first to know" : "notify me when it launches"}
        </button>
      </div>
    </BottomSheet>
  );
}
