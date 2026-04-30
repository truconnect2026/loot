"use client";

import { useState } from "react";

interface ScanButtonsProps {
  onScanUpc: () => void;
  onAiVision: () => void;
  hasScanned: boolean;
}

function BarcodeIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d="M3 5v-2h4" />
      <path d="M17 3h4v2" />
      <path d="M21 19v2h-4" />
      <path d="M7 21H3v-2" />
      <line x1={7} y1={8} x2={7} y2={16} />
      <line x1={10} y1={8} x2={10} y2={16} />
      <line x1={13} y1={8} x2={13} y2={16} strokeWidth={2} />
      <line x1={17} y1={8} x2={17} y2={16} />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D4A574"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

// Hairlines bleed past the page's 18px horizontal padding to the screen edge.
const hairlineEdgeBleed: React.CSSProperties = {
  marginLeft: -18,
  marginRight: -18,
  height: 1,
  backgroundColor: "rgba(255,255,255,0.04)",
};

interface HeroButtonProps {
  variant: "mint" | "camel";
  icon: React.ReactNode;
  label: string;
  onTap: () => void;
}

function HeroButton({ variant, icon, label, onTap }: HeroButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const accent = variant === "mint" ? "92,224,184" : "212,165,116";
  const accentColor = variant === "mint" ? "#5CE0B8" : "#D4A574";

  // Resting state: lit accent inset highlight + faint outer drop.
  const restShadow = `inset 0 1px 0 0 rgba(${accent},0.15), 0 1px 2px rgba(0,0,0,0.3)`;
  // Hover: full glow envelope (the named glow-mint / glow-camel token).
  const hoverShadow = `0 0 0 1px rgba(${accent},0.15), 0 0 20px -4px rgba(${accent},0.25)`;

  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => {
        setPressed(false);
        setHovered(false);
      }}
      onPointerEnter={() => setHovered(true)}
      style={{
        // Triple-constrained half-row so both buttons are pixel-identical
        // even when their label widths differ. flex-grow is intentionally
        // not used anywhere in this file.
        width: "calc(50% - 4px)",
        flex: "0 0 calc(50% - 4px)",
        minWidth: 0,
        maxWidth: "calc(50% - 4px)",
        boxSizing: "border-box",
        height: 80,
        borderRadius: 16,
        // Top-to-bottom accent gradient — bright at the top, fading down.
        background: `linear-gradient(180deg, rgba(${accent},0.12) 0%, rgba(${accent},0.05) 100%)`,
        border: `1px solid rgba(${accent},0.18)`,
        boxShadow: hovered ? hoverShadow : restShadow,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        padding: 0,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top-edge shine — light catching the leading edge of the panel */}
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
      {/* Soft radial halo behind the icon */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 48,
          height: 48,
          // Centered on the icon: icon sits above the label so this aligns
          // with the icon row rather than the geometric center.
          top: 12,
          left: "50%",
          marginLeft: -24,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${accent},0.12), transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{icon}</div>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: accentColor,
          position: "relative",
          zIndex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function ScanButtons({
  onScanUpc,
  onAiVision,
  hasScanned,
}: ScanButtonsProps) {
  return (
    <>
      {/* Top hairline — full-bleed channel framing the scan zone */}
      <div style={{ ...hairlineEdgeBleed, marginTop: 16 }} />

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 8,
          width: "100%",
        }}
      >
        <HeroButton
          variant="mint"
          icon={<BarcodeIcon />}
          label="SCAN UPC"
          onTap={onScanUpc}
        />
        <HeroButton
          variant="camel"
          icon={<CameraIcon />}
          label="AI VISION"
          onTap={onAiVision}
        />
      </div>

      {/* New user hint */}
      {!hasScanned && (
        <div
          style={{
            marginTop: 12,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          works at thrift stores, yard sales, and retail clearance
        </div>
      )}

      {/* Bottom hairline — full-bleed channel framing the scan zone */}
      <div style={{ ...hairlineEdgeBleed, marginTop: 20 }} />
    </>
  );
}
