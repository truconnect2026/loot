"use client";

import AnimNum from "@/components/shared/AnimNum";

interface StatsBarProps {
  scans: number;
  buys: number;
  spent: number;
  profit: number;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 7,
  color: "var(--text-muted)",
  letterSpacing: "0.10em",
  lineHeight: 1,
};

export default function StatsBar({ scans, buys, spent, profit }: StatsBarProps) {
  return (
    <div
      style={{
        marginTop: 16,
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 10,
        height: 44,
        display: "flex",
      }}
    >
      {/* SCANS */}
      <div style={{ flex: 1, textAlign: "center", paddingTop: 10, paddingBottom: 10 }}>
        <div style={labelStyle}>SCANS</div>
        <AnimNum
          value={scans}
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* BUYS */}
      <div style={{ flex: 1, textAlign: "center", paddingTop: 10, paddingBottom: 10 }}>
        <div style={labelStyle}>BUYS</div>
        <AnimNum
          value={buys}
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--accent-mint)",
          }}
        />
      </div>

      {/* SPENT */}
      <div style={{ flex: 1, textAlign: "center", paddingTop: 10, paddingBottom: 10 }}>
        <div style={labelStyle}>SPENT</div>
        <AnimNum
          value={spent}
          prefix="$"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* PROFIT — hero number */}
      <div style={{ flex: 1, textAlign: "center", paddingTop: 10, paddingBottom: 10 }}>
        <div style={labelStyle}>PROFIT</div>
        <AnimNum
          value={profit}
          prefix="$"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 300,
            fontSize: 18,
            color: "var(--accent-mint)",
            textShadow: "var(--profit-glow)",
          }}
        />
      </div>
    </div>
  );
}
