"use client";

import TilePressable from "@/components/shared/TilePressable";

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
      stroke="var(--text-dim)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function ToolTile({ name, icon, onTap }: ToolTileProps) {
  return (
    <TilePressable onTap={onTap}>
      <div
        style={{
          height: 60,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <div style={{ flexShrink: 0, display: "flex" }}>{icon}</div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-outfit), sans-serif",
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
    </TilePressable>
  );
}
