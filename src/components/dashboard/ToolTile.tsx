"use client";

import { useState } from "react";

interface ToolTileProps {
  name: string;
  icon: React.ReactNode;
  onTap: () => void;
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

export default function ToolTile({ name, icon, onTap }: ToolTileProps) {
  const [pressed, setPressed] = useState(false);

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
        // 13% white fill, 15% white 1px border, and a 5% white
        // top-edge inset highlight give each tile defined edges
        // and a hint of dimension without crossing into card-tier
        // treatment. Press state nudges the fill to 17% so taps
        // still feel acknowledged.
        height: 58,
        backgroundColor: "#120e18",
        backgroundImage: pressed
          ? "linear-gradient(rgba(255,255,255,0.17), rgba(255,255,255,0.17))"
          : "linear-gradient(rgba(255,255,255,0.13), rgba(255,255,255,0.13))",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
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
      <div style={{ flexShrink: 0, display: "flex" }}>{icon}</div>
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
      <div style={{ flexShrink: 0, display: "flex" }}>
        <ChevronRight />
      </div>
    </div>
  );
}
