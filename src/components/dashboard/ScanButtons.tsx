"use client";

import { useState } from "react";

interface ScanButtonsProps {
  onScanUpc: () => void;
  onAiVision: () => void;
  /** Today's scan count — used for both the gentle hint and the per-button counter. */
  todayScans: number;
  /** First-time-user mode: SCAN UPC border breathes a quiet "tap me" pulse. */
  pulsePrimary?: boolean;
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
  subtitle: string;
  todayScans: number;
  onTap: () => void;
  /** Run the slow border pulse — only used by the primary button in new-user mode. */
  pulse?: boolean;
}

function HeroButton({
  variant,
  icon,
  label,
  subtitle,
  todayScans,
  onTap,
  pulse,
}: HeroButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const accent = variant === "mint" ? "92,224,184" : "212,165,116";
  const accentColor = variant === "mint" ? "#5CE0B8" : "#D4A574";
  // Mint (SCAN UPC, primary) sits a touch brighter than camel (AI VISION).
  // The brighter top stop is what makes the scan zone the foreground plane.
  const topAlpha = variant === "mint" ? 0.15 : 0.12;

  // Foreground-plane shadow — the scan buttons should feel like they're
  // floating above the rest of the dashboard.
  const restShadow = `inset 0 1px 0 0 rgba(${accent},0.15), 0 2px 4px rgba(0,0,0,0.2), 0 8px 20px -4px rgba(0,0,0,0.3)`;
  const hoverShadow = `0 0 0 1px rgba(${accent},0.15), 0 0 20px -4px rgba(${accent},0.25), 0 8px 20px -4px rgba(0,0,0,0.3)`;

  // Counter is dim when zero, accent-tinted at 0.5 alpha once it's been used.
  const counterColor =
    todayScans > 0 ? `rgba(${accent},0.5)` : "rgba(255,255,255,0.25)";

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
        background: `linear-gradient(180deg, rgba(${accent},${topAlpha}) 0%, rgba(${accent},0.05) 100%)`,
        border: `1px solid rgba(${accent},0.18)`,
        boxShadow: hovered ? hoverShadow : restShadow,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        cursor: "pointer",
        padding: 0,
        // First-scan nudge — the keyframe overrides border-color while running.
        animation: pulse ? "scanUpcPulse 2s ease-in-out infinite" : undefined,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Today's scan count — top-right corner */}
      <span
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 9,
          fontWeight: 500,
          color: counterColor,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {todayScans}
      </span>

      {/* Top-edge shine */}
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
          top: 14,
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
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 8,
          color: `rgba(${accent},0.4)`,
          letterSpacing: "0.04em",
          position: "relative",
          zIndex: 1,
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}

export default function ScanButtons({
  onScanUpc,
  onAiVision,
  todayScans,
  pulsePrimary,
}: ScanButtonsProps) {
  const showHint = todayScans === 0;

  return (
    <>
      {/* Top hairline — full-bleed channel framing the scan zone */}
      <div style={{ ...hairlineEdgeBleed, marginTop: 16 }} />

      <div
        style={{
          // CSS grid: 1fr 1fr columns are mathematically equal regardless of
          // content. Definitive fix — content size cannot affect column width.
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          width: "100%",
        }}
      >
        <HeroButton
          variant="mint"
          icon={<BarcodeIcon />}
          label="SCAN UPC"
          subtitle="point at any barcode"
          todayScans={todayScans}
          onTap={onScanUpc}
          pulse={pulsePrimary}
        />
        <HeroButton
          variant="camel"
          icon={<CameraIcon />}
          label="AI VISION"
          subtitle="snap a photo of anything"
          todayScans={todayScans}
          onTap={onAiVision}
        />
      </div>

      {/* New-user hint — only while today's scans is still 0 */}
      {showHint && (
        <div
          style={{
            marginTop: 12,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.10)",
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
