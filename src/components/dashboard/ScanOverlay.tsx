"use client";

import { useEffect, useRef, useState } from "react";

import { CoinMarkSpinner } from "@/components/shared/CoinMark";
import {
  captureFrame,
  openCameraStream,
  startBarcodeScanner,
  stopStream,
  type ScannerHandle,
} from "@/lib/scanner";
import type { ScanResponse } from "@/app/api/scan/route";

interface ScanOverlayProps {
  open: boolean;
  mode: "barcode" | "vision";
  onResult: (verdict: ScanResponse) => void;
  onCancel: () => void;
  /** Called when /api/scan returns 403 (free-user daily limit hit).
   * The dashboard closes the overlay and opens the PaywallSheet. */
  onPaywall?: (info: { used: number; limit: number }) => void;
}

const ACCENT = {
  barcode: { hex: "#5CE0B8", rgb: "92,224,184" },
  vision: { hex: "#D4A574", rgb: "212,165,116" },
};

// Light haptic — Android Chrome only, silent no-op everywhere else.
function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

const FRAME_W = 280;
const FRAME_H = 210; // 4:3 — most items people scan are wider than tall.

type Phase =
  | { kind: "framing" }
  | { kind: "captured"; payload: { type: "barcode"; upc: string } | { type: "vision"; image: string } }
  | { kind: "submitting"; progress: number }
  | { kind: "error"; message: string };

function CornerBracket({
  corner,
  color,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  // L-shape from two 28px arms, 2px stroke, 4px inset from each frame edge.
  const ARM = 28;
  const STROKE = 2;
  const INSET = 4;
  const horizontal: React.CSSProperties = {
    position: "absolute",
    width: ARM,
    height: STROKE,
    backgroundColor: color,
  };
  const vertical: React.CSSProperties = {
    position: "absolute",
    width: STROKE,
    height: ARM,
    backgroundColor: color,
  };

  switch (corner) {
    case "tl":
      return (
        <>
          <div style={{ ...horizontal, top: INSET, left: INSET }} />
          <div style={{ ...vertical, top: INSET, left: INSET }} />
        </>
      );
    case "tr":
      return (
        <>
          <div style={{ ...horizontal, top: INSET, right: INSET }} />
          <div style={{ ...vertical, top: INSET, right: INSET }} />
        </>
      );
    case "bl":
      return (
        <>
          <div style={{ ...horizontal, bottom: INSET, left: INSET }} />
          <div style={{ ...vertical, bottom: INSET, left: INSET }} />
        </>
      );
    case "br":
      return (
        <>
          <div style={{ ...horizontal, bottom: INSET, right: INSET }} />
          <div style={{ ...vertical, bottom: INSET, right: INSET }} />
        </>
      );
  }
}

function CancelButton({ onCancel, label = "CANCEL" }: { onCancel: () => void; label?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onCancel}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        marginTop: 24,
        fontFamily: "var(--font-body)",
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
      {label}
    </button>
  );
}

export default function ScanOverlay({
  open,
  mode,
  onResult,
  onCancel,
  onPaywall,
}: ScanOverlayProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "framing" });
  const [costInput, setCostInput] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  // Surfaces non-terminal errors directly under the scanner frame so the
  // user always sees what went wrong, even if the phase machine keeps going
  // (e.g. transient barcode-decode glitches). Distinct from `phase: error`,
  // which is the full-screen terminal failure.
  const [inlineError, setInlineError] = useState<string | null>(null);
  // Session counter — increments on each successful verdict during this open
  // session. We currently close the overlay after a result, so this is 0 in
  // practice; left in place for future rapid-fire mode.
  const [sessionCount] = useState(0);

  const flagError = (stage: string, err: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : `${stage} failed`;
    console.error(`[ScanOverlay] ${stage}:`, err);
    setInlineError(message);
    return message;
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<ScannerHandle | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const accent = ACCENT[mode];

  useEffect(() => {
    if (!open) return;

    // Reset the state machine each time the overlay opens or the mode flips.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPhase({ kind: "framing" });
    setCostInput("");
    setCameraReady(false);
    setInlineError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false;

    (async () => {
      try {
        const stream = await openCameraStream();
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setCameraReady(true);

        if (mode === "barcode") {
          scannerRef.current = await startBarcodeScanner(
            video,
            (upc) => {
              // Confirm the decode physically — feels native on Android,
              // silent everywhere else.
              haptic();
              scannerRef.current?.stop();
              stopStream(streamRef.current);
              streamRef.current = null;
              setInlineError(null);
              setPhase({
                kind: "captured",
                payload: { type: "barcode", upc },
              });
            },
            // Per-decode error from the barcode lib. These were previously
            // console.warn-only and invisible to the user; surface them now.
            (err) => flagError("barcode-decode", err)
          );
        }
      } catch (err) {
        const message = flagError("camera-init", err);
        setPhase({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
    };
  }, [open, mode]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) {
      flagError("capture", "video element not ready");
      return;
    }
    try {
      const image = captureFrame(video);
      // Confirm the shutter physically.
      haptic();
      stopStream(streamRef.current);
      streamRef.current = null;
      setInlineError(null);
      setPhase({
        kind: "captured",
        payload: { type: "vision", image },
      });
    } catch (err) {
      const message = flagError("capture", err);
      setPhase({ kind: "error", message });
    }
  };

  const handleSubmit = async () => {
    if (phase.kind !== "captured") return;
    const cost = Number(costInput) || 0;

    setInlineError(null);
    setPhase({ kind: "submitting", progress: 0 });

    progressTimer.current = setInterval(() => {
      setPhase((p) => {
        if (p.kind !== "submitting") return p;
        const next = Math.min(p.progress + 3 + Math.random() * 4, 90);
        return { kind: "submitting", progress: next };
      });
    }, 200);

    try {
      const body =
        phase.payload.type === "barcode"
          ? { type: "barcode", upc: phase.payload.upc, cost }
          : { type: "vision", image: phase.payload.image, cost };

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as
        | ScanResponse
        | {
            error: string;
            scans_used?: number;
            scans_limit?: number;
          };
      if (!res.ok || "error" in data) {
        // 403 with scans_used + scans_limit = the daily-limit gate.
        // Bubble up to the dashboard so it can swap our overlay for
        // the PaywallSheet rather than render a generic error here.
        if (
          res.status === 403 &&
          "error" in data &&
          typeof data.scans_used === "number" &&
          typeof data.scans_limit === "number"
        ) {
          if (progressTimer.current) clearInterval(progressTimer.current);
          progressTimer.current = null;
          onPaywall?.({ used: data.scans_used, limit: data.scans_limit });
          return;
        }
        const apiMessage =
          "error" in data ? data.error : `Scan failed (${res.status})`;
        const message = flagError(
          `api-error[${res.status}]`,
          apiMessage
        );
        setPhase({ kind: "error", message });
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = null;
        return;
      }

      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
      onResult(data);
    } catch (err) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
      const message = flagError("network", err);
      setPhase({ kind: "error", message });
    }
  };

  if (!open) return null;

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
          backgroundColor: "rgba(10, 8, 14, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Session counter — top-left */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.06em",
          }}
        >
          {sessionCount} {sessionCount === 1 ? "scan" : "scans"}
        </div>

        {/* Scanner frame — 4:3 landscape */}
        <div
          style={{
            width: FRAME_W,
            height: FRAME_H,
            border: `1.5px solid rgba(${accent.rgb}, 0.40)`,
            borderRadius: 16,
            position: "relative",
            overflow: "hidden",
            // Soft frame glow — the viewfinder looks like it's projecting light.
            boxShadow: `0 0 30px -5px rgba(${accent.rgb}, 0.12)`,
            backgroundColor: "#000",
          }}
        >
          {/* Camera loading state — Saturn spinner until stream resolves */}
          {!cameraReady && phase.kind === "framing" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CoinMarkSpinner />
            </div>
          )}

          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: phase.kind === "framing" ? "block" : "none",
              opacity: cameraReady ? 1 : 0,
              transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {/* Corner brackets — L-shape, 28px arms, 4px inset */}
          <CornerBracket corner="tl" color={accent.hex} />
          <CornerBracket corner="tr" color={accent.hex} />
          <CornerBracket corner="bl" color={accent.hex} />
          <CornerBracket corner="br" color={accent.hex} />

          {phase.kind === "framing" && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: "10%",
                  right: "10%",
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)`,
                  // Long glow trail — laser, not a bar.
                  boxShadow: `0 0 16px rgba(${accent.rgb}, 0.3), 0 0 4px rgba(${accent.rgb}, 0.6)`,
                  animation:
                    "scanLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                }}
              />
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
                    border: `1px solid rgba(${accent.rgb}, ${startAlpha})`,
                    animation:
                      "pulseRing 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            </>
          )}

          {phase.kind === "captured" && phase.payload.type === "vision" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={phase.payload.image}
              alt="Captured"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>

        {/* Inline error banner — surfaces the latest failure directly under
            the frame so transient errors (camera/decode/api/network) are
            never silent. Sits above any phase-specific UI. */}
        {inlineError && phase.kind !== "error" && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              maxWidth: 280,
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "rgba(232,99,107,0.9)",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            {inlineError}
          </div>
        )}

        {/* Phase-specific UI below the frame */}
        {phase.kind === "framing" && mode === "barcode" && (
          <>
            <div
              style={{
                marginTop: 24,
                // Uppercase mode label — stays mono.
                fontFamily: "var(--font-label)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              SCANNING UPC...
            </div>
            <CancelButton onCancel={onCancel} />
          </>
        )}

        {phase.kind === "framing" && mode === "vision" && (
          <>
            <div
              style={{
                marginTop: 24,
                // Uppercase mode label — stays mono.
                fontFamily: "var(--font-label)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              FRAME THE ITEM AND CAPTURE
            </div>
            <button
              onClick={handleCapture}
              disabled={!cameraReady}
              style={{
                marginTop: 16,
                width: 200,
                height: 44,
                borderRadius: 12,
                background: `linear-gradient(180deg, rgba(${accent.rgb},0.12) 0%, rgba(${accent.rgb},0.05) 100%)`,
                border: `1px solid rgba(${accent.rgb},0.25)`,
                boxShadow: `inset 0 1px 0 0 rgba(${accent.rgb},0.20), 0 1px 2px rgba(0,0,0,0.3)`,
                color: accent.hex,
                // Uppercase action label — stays mono.
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.12em",
                cursor: cameraReady ? "pointer" : "not-allowed",
                opacity: cameraReady ? 1 : 0.5,
              }}
            >
              CAPTURE
            </button>
            <CancelButton onCancel={onCancel} />
          </>
        )}

        {phase.kind === "captured" && (
          <div
            style={{
              marginTop: 24,
              width: 240,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                // Uppercase status label — stays mono.
                fontFamily: "var(--font-label)",
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.10em",
                marginBottom: 8,
              }}
            >
              {phase.payload.type === "barcode"
                ? `UPC ${phase.payload.upc}`
                : "ITEM CAPTURED"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              What did you pay?
            </div>
            <div
              style={{
                width: "100%",
                display: "flex",
                gap: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 44,
                  position: "relative",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "var(--text-muted)",
                    marginRight: 6,
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="0.00"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    // 16px minimum — iOS Safari auto-zooms below 16.
                    fontSize: 16,
                    color: "var(--text-primary)",
                    minWidth: 0,
                    width: "100%",
                  }}
                />
              </div>
              <button
                onClick={handleSubmit}
                style={{
                  width: 80,
                  height: 44,
                  borderRadius: 10,
                  background: `linear-gradient(180deg, rgba(${accent.rgb},0.12), rgba(${accent.rgb},0.05))`,
                  border: `1px solid rgba(${accent.rgb},0.25)`,
                  boxShadow: `inset 0 1px 0 rgba(${accent.rgb},0.20)`,
                  color: accent.hex,
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.10em",
                  cursor: "pointer",
                }}
              >
                CHECK
              </button>
            </div>
            <CancelButton onCancel={onCancel} label="BACK" />
          </div>
        )}

        {phase.kind === "submitting" && (
          <>
            <div
              style={{
                marginTop: 24,
                // Uppercase processing label — stays mono.
                fontFamily: "var(--font-label)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {mode === "barcode" ? "ANALYZING COMPS..." : "AI IDENTIFYING..."}
            </div>
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
                  width: `${phase.progress}%`,
                  height: "100%",
                  backgroundColor: accent.hex,
                  boxShadow: `0 0 8px rgba(${accent.rgb}, 0.4)`,
                  borderRadius: 9999,
                  transition: "width 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </>
        )}

        {phase.kind === "error" && (
          <div
            style={{
              marginTop: 24,
              maxWidth: 280,
              textAlign: "center",
            }}
          >
            <div
              style={{
                // Uppercase error header — stays mono.
                fontFamily: "var(--font-label)",
                fontSize: 11,
                letterSpacing: "0.10em",
                color: "var(--accent-red)",
                marginBottom: 6,
              }}
            >
              SCAN FAILED
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.4,
              }}
            >
              {phase.message}
            </div>
            <CancelButton onCancel={onCancel} label="CLOSE" />
          </div>
        )}
      </div>
    </>
  );
}
