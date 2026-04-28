"use client";

import TilePressable from "@/components/shared/TilePressable";

interface ScanButtonsProps {
  onScanUpc: () => void;
  onAiVision: () => void;
  hasScanned: boolean;
}

function BarcodeIcon() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-mint)"
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
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-camel)"
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
  height: 0.5,
  backgroundColor: "var(--border-default)",
};

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
          marginTop: 16,
          display: "flex",
          gap: 8,
        }}
      >
        {/* SCAN UPC */}
        <TilePressable onTap={onScanUpc} className="">
          <div
            style={{
              flex: 1,
              height: 64,
              borderRadius: 14,
              backgroundColor: "var(--accent-mint-surface)",
              border: "1px solid #5CE0B826",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "transform 100ms ease-out",
            }}
          >
            <BarcodeIcon />
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--accent-mint)",
              }}
            >
              SCAN UPC
            </span>
          </div>
        </TilePressable>

        {/* AI VISION */}
        <TilePressable onTap={onAiVision} className="">
          <div
            style={{
              flex: 1,
              height: 64,
              borderRadius: 14,
              backgroundColor: "var(--accent-camel-surface)",
              border: "1px solid #D4A57426",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "transform 100ms ease-out",
            }}
          >
            <CameraIcon />
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--accent-camel)",
              }}
            >
              AI VISION
            </span>
          </div>
        </TilePressable>
      </div>

      {/* New user hint */}
      {!hasScanned && (
        <div
          style={{
            marginTop: 10,
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
      <div style={{ ...hairlineEdgeBleed, marginTop: 16 }} />
    </>
  );
}
