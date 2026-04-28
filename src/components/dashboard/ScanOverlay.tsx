"use client";

interface ScanOverlayProps {
  open: boolean;
  mode: "barcode" | "vision";
  progress: number; // 0-100
  onCancel: () => void;
}

const ACCENT = {
  barcode: "var(--accent-mint)",
  vision: "var(--accent-camel)",
};

export default function ScanOverlay({
  open,
  mode,
  progress,
  onCancel,
}: ScanOverlayProps) {
  if (!open) return null;

  const accent = ACCENT[mode];

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 5%; }
          50% { top: 88%; }
        }
        @keyframes pulseRing0 {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        @keyframes pulseRing1 {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        @keyframes pulseRing2 {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.2; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(18, 14, 24, 0.95)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Scanner frame */}
        <div
          style={{
            width: 200,
            height: 200,
            border: `1.5px solid color-mix(in srgb, ${accent} 30%, transparent)`,
            borderRadius: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Corner brackets */}
          {/* Top-left */}
          <div style={{ position: "absolute", top: -1, left: -1, width: 28, height: 28, borderTop: `3px solid ${accent}`, borderLeft: `3px solid ${accent}`, borderRadius: "4px 0 0 0" }} />
          {/* Top-right */}
          <div style={{ position: "absolute", top: -1, right: -1, width: 28, height: 28, borderTop: `3px solid ${accent}`, borderRight: `3px solid ${accent}`, borderRadius: "0 4px 0 0" }} />
          {/* Bottom-left */}
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 28, height: 28, borderBottom: `3px solid ${accent}`, borderLeft: `3px solid ${accent}`, borderRadius: "0 0 0 4px" }} />
          {/* Bottom-right */}
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 28, height: 28, borderBottom: `3px solid ${accent}`, borderRight: `3px solid ${accent}`, borderRadius: "0 0 4px 0" }} />

          {/* Scan line */}
          <div
            style={{
              position: "absolute",
              left: "10%",
              right: "10%",
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 20px ${accent}`,
              animation: "scanLine 1.5s ease-in-out infinite",
            }}
          />

          {/* 3 pulse rings */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `1px solid ${accent}`,
                animation: `pulseRing${i} 2s cubic-bezier(0.16, 1, 0.3, 1) infinite`,
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
            width: 180,
            height: 3,
            backgroundColor: "var(--border-default)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: accent,
              borderRadius: 2,
              transition: "width 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          style={{
            marginTop: 24,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "var(--text-muted)",
            backgroundColor: "transparent",
            border: "1px solid var(--border-dim)",
            borderRadius: 8,
            padding: "9px 22px",
            cursor: "pointer",
          }}
        >
          CANCEL
        </button>
      </div>
    </>
  );
}
