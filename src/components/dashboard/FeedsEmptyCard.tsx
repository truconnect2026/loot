"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Consolidated empty state for the deal carousels. Shown only when
 * BOTH the Deals Near You feed AND the Free & Clearance feed return
 * zero results — instead of stacking two separate empty placeholders,
 * we render one card that nudges the user toward the action that
 * unblocks them: setting / expanding zip + radius.
 *
 * Surface language matches the EmptyHero / SAMPLE SCAN card so the
 * dashboard reads consistently when there's no live content yet.
 */
export default function FeedsEmptyCard() {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        // 24px gap from the scan zone above — matches the dashboard's
        // major-section spacing rhythm so this empty card occupies the
        // same slot a deals carousel would.
        marginTop: 24,
        marginLeft: 18,
        marginRight: 18,
        backgroundColor: "#120e18",
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 4px 16px -4px rgba(0,0,0,0.3)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontWeight: 600,
          fontSize: 9,
          color: "#5CE0B8",
          letterSpacing: "0.14em",
          marginBottom: 6,
        }}
      >
        NO DEALS YET
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 14,
          color: "#C8C0D8",
          lineHeight: 1.4,
          marginBottom: 12,
        }}
      >
        set your zip code and radius to see deals near you
      </div>
      <button
        type="button"
        onClick={() => router.push("/account")}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          width: "100%",
          height: 40,
          backgroundColor: pressed
            ? "rgba(255,255,255,0.10)"
            : "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: pressed
            ? "0 0 0 1px rgba(255,255,255,0.28), 0 0 16px -4px rgba(255,255,255,0.18)"
            : "inset 0 1px 0 0 rgba(255,255,255,0.14), 0 1px 2px rgba(0,0,0,0.3)",
          borderRadius: 12,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--ui-primary)",
          letterSpacing: "0.01em",
          cursor: "pointer",
          transform: pressed ? "scale(0.98)" : "scale(1)",
          transition:
            "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        open settings →
      </button>
    </div>
  );
}
