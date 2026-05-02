"use client";

import { useState } from "react";

interface ToolTileProps {
  name: string;
  icon: React.ReactNode;
  onTap: () => void;
}

function ChevronRight() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2A2240"
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
        // Tools are utilities, not money-making opportunities — they
        // should clearly sit below deals in the visual hierarchy.
        // Stripped the border, inset highlight, and rest-state fill
        // so the row reads as a list entry rather than a deal-tier
        // card. 60px height keeps the touch target generous; press
        // state is the only background shift, so taps still feel
        // acknowledged. Left-aligned name (was centered) reinforces
        // the list-row feel.
        height: 60,
        backgroundColor: pressed
          ? "rgba(255,255,255,0.04)"
          : "transparent",
        border: "none",
        boxShadow: "none",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingLeft: 12,
        paddingRight: 12,
        cursor: "pointer",
        userSelect: "none",
        transition:
          "background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
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
