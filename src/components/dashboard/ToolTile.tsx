"use client";

import { useState } from "react";

interface ToolTileProps {
  name: string;
  icon: React.ReactNode;
  onTap: () => void;
  /** Accent color used for the bottom hairline. Defaults to a
   * neutral white when omitted so tiles without a clear identity
   * (rare) still render. */
  accent?: string;
}

function ChevronRight() {
  // Chevron is the tile's primary tap-affordance cue — bumped to
  // 32% white from the previous near-black plum so users can
  // actually see the "tappable" signal at a glance.
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.32)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function ToolTile({
  name,
  icon,
  onTap,
  accent,
}: ToolTileProps) {
  const [pressed, setPressed] = useState(false);

  // Bottom hairline — accent color at 0.08 alpha. The accent prop is
  // already an rgb hex (e.g. "#5CE0B8"); appending "14" gives ~0.08
  // alpha in #RRGGBBAA form. Falls back to a neutral white when the
  // caller doesn't pass an accent.
  const bottomLine = accent
    ? `1px solid ${accent}14`
    : "1px solid rgba(255,255,255,0.06)";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        // Tools are utilities — clearly below deals in the visual
        // hierarchy (no glows, no gradients, no elevation), but they
        // need their own contrast against the opaque page bg now
        // that the grid no longer bleeds through to provide it.
        // 13% white fill, 15% white 1px border, and a 3% white
        // top-edge inset highlight give each tile defined edges
        // and a hint of dimension without crossing into card-tier
        // treatment. Press state nudges the fill 2% toward white
        // (0.13 → 0.15) — subtle enough that the rest state stays
        // calm but strong enough that taps register.
        height: 58,
        backgroundColor: "#120e18",
        backgroundImage: pressed
          ? "linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.15))"
          : "linear-gradient(rgba(255,255,255,0.13), rgba(255,255,255,0.13))",
        border: "1px solid rgba(255,255,255,0.15)",
        // Bottom edge replaced with the accent-tinted hairline — gives
        // each tile a quiet identity stripe matching its icon color.
        borderBottom: bottomLine,
        // Secondary card depth — softer drop than primary cards
        // (deals, sourcing) since tool tiles sit below them in the
        // visual hierarchy. Inset highlight stays for the lit edge.
        boxShadow:
          "0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 0 rgba(255,255,255,0.03)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingLeft: 12,
        paddingRight: 12,
        cursor: "pointer",
        userSelect: "none",
        transition:
          "background-image 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Icon brightens from 0.6 → 1.0 on press — the tile's accent
          color was already painted at 0.6 by ToolIcon; bumping to 1
          on press feels like the icon "lights up" under the finger. */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          opacity: pressed ? 1 : 0.85,
          transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "left",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      >
        {name}
      </div>
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          // Chevron nudges 3px right on press — micro "this opens
          // something" cue mirroring iOS table-row tap feedback.
          transform: pressed ? "translateX(3px)" : "translateX(0)",
          transition: "transform 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <ChevronRight />
      </div>
    </div>
  );
}
