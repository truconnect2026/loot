"use client";

import { useEffect, useRef, useState } from "react";

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
}

const ACCENT = {
  barcode: { hex: "#5CE0B8", rgb: "92,224,184" },
  vision: { hex: "#D4A574", rgb: "212,165,116" },
};

type Phase =
  | { kind: "framing" }
  | { kind: "captured"; payload: { type: "barcode"; upc: string } | { type: "vision"; image: string } }
  | { kind: "submitting"; progress: number }
  | { kind: "error"; message: string };

function CancelButton({ onCancel, label = "CANCEL" }: { onCancel: () => void; label?: string }) {
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
      {label}
    </button>
  );
}

export default function ScanOverlay({
  open,
  mode,
  onResult,
  onCancel,
}: ScanOverlayProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "framing" });
  const [costInput, setCostInput] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<ScannerHandle | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const accent = ACCENT[mode];

  // Reset on every open: camera lifecycle is tied to the overlay being mounted+open.
  useEffect(() => {
    if (!open) return;

    setPhase({ kind: "framing" });
    setCostInput("");
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

        if (mode === "barcode") {
          scannerRef.current = await startBarcodeScanner(
            video,
            (upc) => {
              // Stop camera + scanner immediately so we don't keep decoding.
              scannerRef.current?.stop();
              stopStream(streamRef.current);
              streamRef.current = null;
              setPhase({
                kind: "captured",
                payload: { type: "barcode", upc },
              });
            },
            (err) => console.warn("Scanner warning:", err)
          );
        }
        // Vision mode: camera stays live until the user taps Capture.
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Camera access failed";
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
    if (!video) return;
    try {
      const image = captureFrame(video);
      stopStream(streamRef.current);
      streamRef.current = null;
      setPhase({
        kind: "captured",
        payload: { type: "vision", image },
      });
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Capture failed",
      });
    }
  };

  const handleSubmit = async () => {
    if (phase.kind !== "captured") return;
    const cost = Number(costInput) || 0;

    setPhase({ kind: "submitting", progress: 0 });

    // Smooth progress while the API does its thing — UPC + eBay + Claude
    // typically lands in 4-8s; cap at 90% so completion lands the bar.
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
      const data = (await res.json()) as ScanResponse | { error: string };
      if (!res.ok || "error" in data) {
        const message = "error" in data ? data.error : `Scan failed (${res.status})`;
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
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
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
            border: `1.5px solid rgba(${accent.rgb}, 0.40)`,
            borderRadius: 16,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 0 40px -8px rgba(${accent.rgb}, 0.15)`,
            backgroundColor: "#000",
          }}
        >
          {/* Camera feed — only relevant during framing */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: phase.kind === "framing" ? "block" : "none",
            }}
          />

          {/* Corner brackets */}
          <div style={{ position: "absolute", top: -1, left: -1, width: 32, height: 32, borderTop: `2px solid ${accent.hex}`, borderLeft: `2px solid ${accent.hex}`, borderRadius: "4px 0 0 0" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 32, height: 32, borderTop: `2px solid ${accent.hex}`, borderRight: `2px solid ${accent.hex}`, borderRadius: "0 4px 0 0" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 32, height: 32, borderBottom: `2px solid ${accent.hex}`, borderLeft: `2px solid ${accent.hex}`, borderRadius: "0 0 0 4px" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 32, height: 32, borderBottom: `2px solid ${accent.hex}`, borderRight: `2px solid ${accent.hex}`, borderRadius: "0 0 4px 0" }} />

          {phase.kind === "framing" && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: "10%",
                  right: "10%",
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)`,
                  boxShadow: `0 0 12px ${accent.hex}`,
                  animation: "scanLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
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
                    animation: "pulseRing 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            </>
          )}

          {phase.kind === "captured" && phase.payload.type === "vision" && (
            // Show the captured shot while the user fills in cost.
            <img
              src={phase.payload.image}
              alt="Captured"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>

        {/* Phase-specific UI below the frame */}
        {phase.kind === "framing" && mode === "barcode" && (
          <>
            <div
              style={{
                marginTop: 24,
                fontFamily: "var(--font-jetbrains-mono), monospace",
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
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              FRAME THE ITEM AND CAPTURE
            </div>
            <button
              onClick={handleCapture}
              style={{
                marginTop: 16,
                width: 200,
                height: 44,
                borderRadius: 12,
                background: `linear-gradient(180deg, rgba(${accent.rgb},0.12) 0%, rgba(${accent.rgb},0.05) 100%)`,
                border: `1px solid rgba(${accent.rgb},0.25)`,
                boxShadow: `inset 0 1px 0 0 rgba(${accent.rgb},0.20), 0 1px 2px rgba(0,0,0,0.3)`,
                color: accent.hex,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.12em",
                cursor: "pointer",
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
                fontFamily: "var(--font-jetbrains-mono), monospace",
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
                fontFamily: "var(--font-outfit), sans-serif",
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
                    fontFamily: "var(--font-jetbrains-mono), monospace",
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
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontWeight: 700,
                    fontSize: 14,
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
                  fontFamily: "var(--font-jetbrains-mono), monospace",
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
                fontFamily: "var(--font-jetbrains-mono), monospace",
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
                fontFamily: "var(--font-jetbrains-mono), monospace",
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
                fontFamily: "var(--font-outfit), sans-serif",
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
