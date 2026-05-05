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

/**
 * Verdict payload + the user-captured thumbnail. The thumbnail is
 * grabbed client-side (UPC: at decode time; AI Vision: the user's
 * shutter tap) and never round-trips through /api/scan, so it can't
 * live on ScanResponse — it sits next to it on this client-only
 * envelope.
 */
export interface VerdictPayload extends ScanResponse {
  capturedImage?: string | null;
}

interface ScanOverlayProps {
  open: boolean;
  mode: "barcode" | "vision";
  onResult: (verdict: VerdictPayload) => void;
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

// Viewfinder is sized via CSS (86vw, max 440px, aspect 4/3) instead
// of fixed FRAME_W/FRAME_H now that the camera feed is full-bleed.

type Phase =
  | { kind: "framing" }
  // Both payload variants carry a `capturedImage` (a JPEG dataURL of
  // the video frame). For barcode mode we grab it the moment the UPC
  // decodes — gives the verdict sheet a thumbnail of what was just
  // scanned. For vision mode `image` is already the captured frame,
  // so capturedImage just aliases it.
  | {
      kind: "captured";
      payload:
        | { type: "barcode"; upc: string; capturedImage: string | null }
        | { type: "vision"; image: string };
    }
  | { kind: "submitting"; progress: number }
  | { kind: "error"; message: string };

/** Captures a JPEG dataURL of the current video frame. Wraps the lib
 * helper in try/catch because thumbnail-grab failures must not block
 * the scan flow — the verdict sheet just renders without a thumbnail
 * if this returns null. */
function safelyCaptureFrame(video: HTMLVideoElement | null): string | null {
  if (!video) return null;
  try {
    return captureFrame(video);
  } catch {
    return null;
  }
}

function CornerBracket({
  corner,
  color,
  arm = 28,
  stroke = 2,
  inset = 4,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  color: string;
  arm?: number;
  stroke?: number;
  inset?: number;
}) {
  // L-shape from two `arm`px arms, 2px stroke, 4px inset from each frame edge.
  const ARM = arm;
  const STROKE = stroke;
  const INSET = inset;
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

function CancelButton({
  onCancel,
  label = "CANCEL",
  marginTop = 24,
}: {
  onCancel: () => void;
  label?: string;
  /** Margin-top override — the vision capture flow wants tighter
   * vertical spacing between the round CAPTURE button and the
   * CANCEL pill below it than the barcode mode's "SCANNING UPC..."
   * label-to-CANCEL gap. */
  marginTop?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onCancel}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        marginTop,
        fontFamily: "var(--font-label)",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "#5A4E70",
        backgroundColor: "transparent",
        border: hovered
          ? "1px solid rgba(255,255,255,0.18)"
          : "1px solid rgba(255,255,255,0.10)",
        borderRadius: 10,
        padding: "10px 24px",
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
              // Grab the frame BEFORE we stop the stream — once
              // tracks are stopped, the video's currentSrc becomes
              // black and captureFrame would return an empty image.
              const capturedImage = safelyCaptureFrame(videoRef.current);
              stopStream(streamRef.current);
              streamRef.current = null;
              setInlineError(null);
              setPhase({
                kind: "captured",
                payload: { type: "barcode", upc, capturedImage },
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
      // Attach the frame the user actually captured so VerdictSheet
      // can render it as a thumbnail. UPC mode supplies its grabbed
      // frame via phase.payload.capturedImage; AI Vision mode reuses
      // the same image it sent to the API.
      const capturedImage =
        phase.payload.type === "barcode"
          ? phase.payload.capturedImage
          : phase.payload.image;
      onResult({ ...data, capturedImage });
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

        {/* Full-bleed camera feed during framing — sits behind every
            other element. Switches to display:none once the user
            captures or transitions out of framing so the centered
            phase-specific UI below dominates the screen. */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: phase.kind === "framing" ? "block" : "none",
            opacity: cameraReady ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 0,
          }}
        />

        {/* Camera-loading spinner — centered over the (still-black)
            video element until the stream resolves. */}
        {!cameraReady && phase.kind === "framing" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <CoinMarkSpinner />
          </div>
        )}

        {/* Vignette — radial dim outside the viewfinder so the corner
            brackets read as the active region. Disabled during non-
            framing phases (no video showing). */}
        {phase.kind === "framing" && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse 60% 45% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        )}

        {/* Viewfinder — sized to 86% of viewport width (capped at
            440px for tablets), 4:3 aspect-ratio. Just corner brackets
            on top of the full-bleed video — no border, no bg. The
            zone defines where to point the camera; the dim vignette
            outside it does the rest of the work. */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "86vw",
            maxWidth: 440,
            aspectRatio: "4 / 3",
            // Block-flow — the centered flex parent vertically
            // centers the viewfinder + the phase-specific UI below.
          }}
        >
          {phase.kind === "framing" && (
            <>
              {/* Corner brackets — bracket arm scaled up so the
                  L-shape reads as deliberate framing at 300+ px
                  width. */}
              <CornerBracket
                corner="tl"
                color={accent.hex}
                arm={48}
                stroke={3}
                inset={0}
              />
              <CornerBracket
                corner="tr"
                color={accent.hex}
                arm={48}
                stroke={3}
                inset={0}
              />
              <CornerBracket
                corner="bl"
                color={accent.hex}
                arm={48}
                stroke={3}
                inset={0}
              />
              <CornerBracket
                corner="br"
                color={accent.hex}
                arm={48}
                stroke={3}
                inset={0}
              />

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
              FRAME THE ITEM AND TAP TO CAPTURE
            </div>
            {/* Round shutter — 60px disc with a mint accent ring.
                Mint (not the camel vision-mode accent) per the design
                spec: the user is recognizing this as a shutter, not
                an AI Vision label, so we pull the universal "go"
                color rather than the mode-specific tint. */}
            <button
              aria-label="Capture photo"
              onClick={handleCapture}
              disabled={!cameraReady}
              style={{
                marginTop: 20,
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "rgba(92,224,184,0.15)",
                border: "3px solid #5CE0B8",
                boxShadow: cameraReady
                  ? "0 0 0 1px rgba(92,224,184,0.10), 0 0 24px -4px rgba(92,224,184,0.30)"
                  : "none",
                cursor: cameraReady ? "pointer" : "not-allowed",
                opacity: cameraReady ? 1 : 0.5,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Inner solid disc — the classic camera-shutter look,
                  visible against the recessed bg of the outer ring. */}
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#5CE0B8",
                  boxShadow: "0 0 12px rgba(92,224,184,0.40)",
                }}
              />
            </button>
            <CancelButton onCancel={onCancel} marginTop={16} />
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
