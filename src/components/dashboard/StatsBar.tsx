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
  fontWeight: 500,
  fontSize: 8,
  color: "var(--text-muted)",
  letterSpacing: "0.12em",
  lineHeight: 1,
  textTransform: "uppercase",
};

export default function StatsBar({ scans, buys, spent, profit }: StatsBarProps) {
  return (
    <div
      style={{
        marginTop: 16,
        // Recessed into the page — same color as page bg, with trough shadow.
        backgroundColor: "#120e18",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 12,
        height: 44,
        display: "flex",
        boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
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

      {/* PROFIT — glowing LED readout */}
      <div style={{ flex: 1, textAlign: "center", paddingTop: 10, paddingBottom: 10 }}>
        <div style={labelStyle}>PROFIT</div>
        <AnimNum
          value={profit}
          prefix="$"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 300,
            fontSize: 20,
            color: "var(--accent-mint)",
            textShadow: "0 0 24px rgba(92,224,184,0.12)",
          }}
        />
      </div>
    </div>
  );
}
