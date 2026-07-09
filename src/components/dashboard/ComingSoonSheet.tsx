"use client";

import { useState, type ReactNode } from "react";
import BottomSheet from "@/components/shared/BottomSheet";

/**
 * Generic "coming soon" sheet — title + dimmed icon + description +
 * "notify me" pill. Used by Restock Days, Estate Sales, BOLO Alerts,
 * Seasonal Flips, and (going forward) Yard Sales. The notify pill
 * is purely client-side state — no backend write — so taps just
 * flash a confirmation that fades back.
 */

interface ComingSoonSheetProps {
  open: boolean;
  onClose: () => void;
  /** Border accent color for the BottomSheet — typically the
   * feed's icon color, so each placeholder still has its own
   * visual identity at the sheet edge. */
  accent: string;
  /** Glyph rendered above the title at 36px / 0.3 opacity — caller
   * passes a sized SVG with stroke="currentColor" so the accent can
   * be applied via the wrapper's color prop. */
  icon: ReactNode;
  title: string;
  description: string;
}

export default function ComingSoonSheet({
  open,
  onClose,
  accent,
  icon,
  title,
  description,
}: ComingSoonSheetProps) {
  const [notified, setNotified] = useState(false);

  function handleNotify() {
    if (notified) return;
    setNotified(true);
    window.setTimeout(() => setNotified(false), 2000);
  }

  return (
    <BottomSheet open={open} onClose={onClose} borderColor={accent}>
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
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            color: accent,
            opacity: 0.3,
          }}
        >
          {icon}
        </span>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 17,
            fontWeight: 600,
            color: "#C8C0D8",
          }}
        >
          {title}
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
          {description}
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
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "#5CE0B8",
            cursor: "pointer",
            transition: "opacity 200ms ease",
          }}
        >
          {notified
            ? "you'll be the first to know"
            : "notify me when it launches"}
        </button>
      </div>
    </BottomSheet>
  );
}
