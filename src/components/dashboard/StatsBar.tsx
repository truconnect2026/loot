"use client";

import AnimNum from "@/components/shared/AnimNum";

interface StatsBarProps {
  scans: number;
  buys: number;
  spent: number;
  profit: number;
}

// Uppercase stats labels (SCANS / BUYS / SPENT / PROFIT) — stay mono per
// the font role system.
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-label)",
  fontWeight: 500,
  fontSize: 8,
  color: "var(--text-muted)",
  letterSpacing: "0.12em",
  lineHeight: 1,
  textTransform: "uppercase",
};

const cellStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  paddingTop: 10,
  paddingBottom: 10,
};

// Thin divider between cells — breaks the bar into readable segments.
function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 20,
        backgroundColor: "rgba(255,255,255,0.04)",
        alignSelf: "center",
      }}
    />
  );
}

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
      <div style={cellStyle}>
        <div style={labelStyle}>SCANS</div>
        <AnimNum
          value={scans}
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
          }}
        />
      </div>

      <Divider />

      {/* BUYS */}
      <div style={cellStyle}>
        <div style={labelStyle}>BUYS</div>
        <AnimNum
          value={buys}
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--accent-mint)",
          }}
        />
      </div>

      <Divider />

      {/* SPENT */}
      <div style={cellStyle}>
        <div style={labelStyle}>SPENT</div>
        <AnimNum
          value={spent}
          prefix="$"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
          }}
        />
      </div>

      <Divider />

      {/* PROFIT — glowing LED readout */}
      <div style={cellStyle}>
        <div style={labelStyle}>PROFIT</div>
        <AnimNum
          value={profit}
          prefix="$"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: 22,
            color: "var(--accent-mint)",
            textShadow: "0 0 24px rgba(92,224,184,0.20)",
          }}
        />
      </div>
    </div>
  );
}
