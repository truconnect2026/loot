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
      <style>{`
        .tool-tile-surface {
          transition: box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4);
        }
        .tool-tile-surface:hover {
          box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08), 0 12px 40px -4px rgba(0,0,0,0.5);
        }
      `}</style>
      <div
        className="tool-tile-surface"
        style={{
          height: 60,
          backgroundColor: "var(--bg-surface)",
          border: "1px solid rgba(255,255,255,0.06)",
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
