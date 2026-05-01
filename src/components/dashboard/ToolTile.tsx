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
        height: 56,
        // Background plane — recessed into the page so the eye reads
        // scan-buttons → cards → tools as a clear z-axis.
        backgroundColor: pressed
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.03)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.02)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        paddingLeft: 12,
        paddingRight: 12,
        cursor: "pointer",
        userSelect: "none",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ flexShrink: 0, display: "flex" }}>{icon}</div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 12,
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
