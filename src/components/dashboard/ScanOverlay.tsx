"use client";

import { useState } from "react";

interface ScanOverlayProps {
  open: boolean;
  mode: "barcode" | "vision";
  progress: number; // 0-100
  onCancel: () => void;
}

const ACCENT = {
  barcode: { hex: "#5CE0B8", rgb: "92,224,184" },
  vision: { hex: "#D4A574", rgb: "212,165,116" },
};

function CancelButton({ onCancel }: { onCancel: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onCancel}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        marginTop: 24,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontWeight: 500,
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
        backgroundColor: "transparent",
        border: hovered
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "9px 22px",
        cursor: "pointer",
        transition: "border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      CANCEL
    </button>
  );
}

export default function ScanOverlay({
  open,
  mode,
  progress,
  onCancel,
}: ScanOverlayProps) {
  if (!open) return null;

  const { hex: accent, rgb: accentRgb } = ACCENT[mode];

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 5%; }
          50% { top: 88%; }
        }
        @keyframes pulseRing {
          0%   { transform: translate(-50%, -50%) scale(0.9);  opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5);  opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          // Heavy dim + blur over the whole app — mesh stays faintly visible.
          backgroundColor: "rgba(10, 8, 14, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Scanner frame */}
        <div
          style={{
            width: 220,
            height: 220,
            border: `1.5px solid rgba(${accentRgb}, 0.40)`,
            borderRadius: 16,
            position: "relative",
            overflow: "hidden",
            // Faint accent halo around the viewfinder.
            boxShadow: `0 0 40px -8px rgba(${accentRgb}, 0.15)`,
          }}
        >
          {/* Corner brackets — thinner, more premium */}
          <div style={{ position: "absolute", top: -1, left: -1, width: 32, height: 32, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, borderRadius: "4px 0 0 0" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 32, height: 32, borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, borderRadius: "0 4px 0 0" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 32, height: 32, borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, borderRadius: "0 0 0 4px" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 32, height: 32, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, borderRadius: "0 0 4px 0" }} />

          {/* Scan line — thin glowing thread */}
          <div
            style={{
              position: "absolute",
              left: "10%",
              right: "10%",
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 12px ${accent}`,
              animation: "scanLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
            }}
          />

          {/* 3 pulse rings — descending starting opacity, staggered launch */}
          {[0.30, 0.20, 0.12].map((startAlpha, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `1px solid rgba(${accentRgb}, ${startAlpha})`,
                animation: "pulseRing 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Mode text */}
        <div
          style={{
            marginTop: 24,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {mode === "barcode" ? "SCANNING UPC..." : "AI IDENTIFYING..."}
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 16,
            width: 200,
            height: 3,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: accent,
              boxShadow: `0 0 8px rgba(${accentRgb}, 0.4)`,
              borderRadius: 9999,
              transition: "width 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>

        <CancelButton onCancel={onCancel} />
      </div>
    </>
  );
}
