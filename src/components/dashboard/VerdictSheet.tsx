"use client";

import { useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";

export interface VerdictData {
  method: "barcode" | "vision";
  name: string;
  verdict: "BUY" | "PASS" | "MAYBE";
  cost: number;
  sell: number;
  profit: number;
  roi: number;
  platform: string;
  fee: number;
  comps: number;
}

interface VerdictSheetProps {
  open: boolean;
  onClose: () => void;
  data: VerdictData | null;
}

const VERDICT_COLORS = {
  BUY: {
    text: "var(--accent-mint)",
    bg: "var(--accent-mint-surface)",
    border: "var(--accent-mint-border)",
    borderSolid: "var(--accent-mint)",
  },
  PASS: {
    text: "var(--accent-red)",
    bg: "var(--accent-red-surface)",
    border: "var(--accent-red-border)",
    borderSolid: "var(--accent-red)",
  },
  MAYBE: {
    text: "var(--accent-camel)",
    bg: "var(--accent-camel-surface)",
    border: "var(--accent-camel-border)",
    borderSolid: "var(--accent-camel)",
  },
};

function LightningIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-mint)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const recessedCell: React.CSSProperties = {
  backgroundColor: "var(--bg-recessed)",
  borderRadius: 10,
  padding: 12,
  textAlign: "center",
  boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
};

const smallRecessedCell: React.CSSProperties = {
  backgroundColor: "var(--bg-recessed)",
  borderRadius: 8,
  padding: 10,
  textAlign: "center",
  boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
};

const cellLabel: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 9,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 4,
};

function ListingCta() {
  const [pressed, setPressed] = useState(false);

  // Resting: lit accent inset + soft outer accent halo. Press: full glow envelope.
  const restShadow =
    "inset 0 1px 0 0 rgba(92,224,184,0.20), 0 0 16px -4px rgba(92,224,184,0.30)";
  const pressShadow =
    "0 0 0 1px rgba(92,224,184,0.20), 0 0 24px -4px rgba(92,224,184,0.35), 0 0 60px -8px rgba(92,224,184,0.15)";

  return (
    <button
      onClick={() => console.log("Generate FB Listing")}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        marginTop: 16,
        width: "100%",
        background:
          "linear-gradient(180deg, rgba(92,224,184,0.12) 0%, rgba(92,224,184,0.06) 100%)",
        border: "1px solid rgba(92,224,184,0.15)",
        boxShadow: pressed ? pressShadow : restShadow,
        borderRadius: 12,
        padding: 14,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top-edge shine — light catching the leading edge */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -1,
          left: 12,
          right: 12,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          pointerEvents: "none",
        }}
      />
      <LightningIcon />
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--accent-mint)",
        }}
      >
        GENERATE FB LISTING
      </span>
    </button>
  );
}

export default function VerdictSheet({ open, onClose, data }: VerdictSheetProps) {
  if (!data) return null;

  const colors = VERDICT_COLORS[data.verdict];

  return (
    <BottomSheet open={open} onClose={onClose} borderColor={colors.borderSolid}>
      <div style={{ padding: "12px 20px 28px" }}>
        {/* Method label */}
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {data.method === "barcode" ? "UPC SCAN" : "AI VISION"}
        </div>

        {/* Item name */}
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 600,
            fontSize: 17,
            color: "var(--text-primary)",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {data.name}
        </div>

        {/* Verdict badge */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 20px",
            }}
          >
            {data.verdict}
          </div>
        </div>

        {/* 3-col price grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginTop: 16,
          }}
        >
          <div style={recessedCell}>
            <div style={cellLabel}>COST</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.cost}
            </div>
          </div>
          <div style={recessedCell}>
            <div style={cellLabel}>SELL</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--accent-mint)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.sell}
            </div>
          </div>
          <div style={recessedCell}>
            <div style={cellLabel}>PROFIT</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: colors.text,
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.profit}
            </div>
          </div>
        </div>

        {/* 2×2 detail grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 8,
          }}
        >
          <div style={smallRecessedCell}>
            <div style={cellLabel}>ROI</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {data.roi}%
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>PLATFORM</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
              }}
            >
              {data.platform}
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>FEE</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.fee}
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>COMPS</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--accent-mint)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {data.comps}
            </div>
          </div>
        </div>

        {/* CTA — hero button with top-edge shine + glow on press */}
        <ListingCta />
      </div>
    </BottomSheet>
  );
}
