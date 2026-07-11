"use client";

import { useEffect, useRef, useState } from "react";
import { CrateResultsStack, type StripRect } from "@/components/dashboard/CrateResultsStack";

import { CoinMarkSpinner } from "@/components/shared/CoinMark";
import {
  captureFrame,
  openCameraStream,
  startBarcodeScanner,
  stopStream,
  type ScannerHandle,
} from "@/lib/scanner";
import type { ScanResponse } from "@/app/api/scan/route";
import type { MultiDetectItem, BatchValuation } from "@/lib/claude";
import VerdictSheet from "@/components/dashboard/VerdictSheet";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import SignupWallCard from "@/components/dashboard/SignupWallCard";

export interface VerdictPayload extends ScanResponse {
  capturedImage?: string | null;
}

interface ScanOverlayProps {
  open: boolean;
  mode: "barcode" | "vision" | "shelf" | "crate";
  onResult: (verdict: VerdictPayload) => void;
  onCancel: () => void;
  onPaywall?: (info: { used: number; limit: number }) => void;
  /** Library-upload handoff (shelf mode only): a pre-supplied image to
   * run detection on instead of opening the camera. When set, the
   * overlay skips getUserMedia entirely and drives the same
   * detect→value pipeline a camera capture would. */
  initialImage?: string;
}

const ACCENT = {
  barcode: { hex: "#5CE0B8", rgb: "92,224,184" },
  vision: { hex: "#D4A574", rgb: "212,165,116" },
  shelf: { hex: "#5CE0B8", rgb: "92,224,184" },
  crate: { hex: "#5CE0B8", rgb: "92,224,184" },
};

const SHELF_VERDICT_COLOR: Record<"BUY" | "PASS" | "MAYBE", string> = {
  BUY: "#5CE0B8",
  MAYBE: "#F5C518",
  PASS: "#6b7280",
};
const SHELF_DOT_GRAY = "#4b5563";

// Build sorted list: BUY → MAYBE → PASS, anchors/singles only (members excluded).
function buildSortedRows(vals: Map<number, BatchValuation>): BatchValuation[] {
  const TIER: Record<string, number> = { BUY: 0, MAYBE: 1, PASS: 2 };
  return [...vals.values()]
    .filter((v) => v.groupRole !== "lot-member")
    .sort((a, b) => {
      const ta = TIER[a.verdict] ?? 1;
      const tb = TIER[b.verdict] ?? 1;
      if (ta !== tb) return ta - tb;
      return b.estResale - a.estResale;
    });
}

type DotCluster = {
  indices: number[]; // detection indices in this cluster
  cx: number; // centroid pixel x
  cy: number; // centroid pixel y (pre-clamped)
  color: string; // dominant verdict color
};

// Greedy proximity clustering: dots whose clamped centers are within `radius` px collapse.
function clusterDots(
  items: MultiDetectItem[],
  vals: Map<number, BatchValuation>,
  renderedSize: { w: number; h: number; drawnX: number; drawnY: number; drawnW: number; drawnH: number },
  radius = 28,
): DotCluster[] {
  const VERDICT_PRIORITY: Record<string, number> = { BUY: 0, MAYBE: 1, PASS: 2 };
  const { drawnX, drawnY, drawnW, drawnH } = renderedSize;
  const points = items.map((item, idx) => {
    const [bx, by, bw, bh] = item.bbox;
    const cx = drawnX + (bx + bw / 2) * drawnW;
    const cy = Math.min(Math.max(drawnY + (by + bh / 2) * drawnH, 12), renderedSize.h - 12);
    console.log(
      "[DOTS]", idx, "bbox=", item.bbox,
      "drawn=", { drawnX: drawnX.toFixed(1), drawnY: drawnY.toFixed(1), drawnW: drawnW.toFixed(1), drawnH: drawnH.toFixed(1) },
      "screen=", { x: cx.toFixed(1), y: cy.toFixed(1) },
    );
    return { idx, cx, cy };
  });

  const used = new Set<number>();
  const clusters: DotCluster[] = [];

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    const group: number[] = [i];
    used.add(i);
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      const dx = points[j].cx - points[i].cx;
      const dy = points[j].cy - points[i].cy;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        group.push(j);
        used.add(j);
      }
    }
    const cx = group.reduce((s, k) => s + points[k].cx, 0) / group.length;
    const cy = group.reduce((s, k) => s + points[k].cy, 0) / group.length;
    let bestP = 999;
    let color = SHELF_DOT_GRAY;
    for (const k of group) {
      const val = vals.get(points[k].idx);
      if (val) {
        const p = VERDICT_PRIORITY[val.verdict] ?? 999;
        if (p < bestP) {
          bestP = p;
          color = SHELF_VERDICT_COLOR[val.verdict];
        }
      }
    }
    clusters.push({ indices: group.map((k) => points[k].idx), cx, cy, color });
  }

  return clusters;
}

// Row display name: strip AI hedge clauses + long parentheticals for tight rows.
// Full name is preserved for copy-haul and the callout drill-down.
function cleanDisplayName(rawName: string): string {
  // Lot-anchor names ("Series — N vols") are already clean.
  if (/\s—\s\d+ vols$/.test(rawName)) return rawName;
  let n = rawName;
  n = n.replace(/\s+or similar.*$/i, "");
  n = n.replace(/\s+\(likely\s[^)]*\)\s*$/i, "");
  n = n.replace(/\s+-\s*likely\s+.*$/i, "");
  // For long names strip the trailing parenthetical series tag — it's in the data already.
  if (n.length > 34) n = n.replace(/\s*\([^)]{8,}\)\s*$/, "");
  return n.trim();
}

// Light haptic — Android Chrome only, silent no-op everywhere else.
function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

type Phase =
  | { kind: "framing" }
  | {
      kind: "captured";
      payload:
        | { type: "barcode"; upc: string; capturedImage: string | null }
        | { type: "vision"; image: string };
    }
  | { kind: "submitting"; progress: number }
  | { kind: "cameraError" }
  | { kind: "error"; message: string }
  // Anonymous caller spent their one free scan — signup wall replaces
  // the result area instead of a paywall/error.
  | { kind: "signup-wall" }
  // Shelf phases — two-stage detect then value.
  | { kind: "shelf-detecting"; capturedImage: string }
  | { kind: "shelf-valuing"; capturedImage: string; items: MultiDetectItem[] }
  | {
      kind: "shelf-done";
      capturedImage: string;
      items: MultiDetectItem[];
      valuations: Map<number, BatchValuation>;
    }
  | { kind: "shelf-empty"; capturedImage: string }
  | { kind: "shelf-limit"; used: number; limit: number }
  // Crate phases — two-stage detect → value, VERIFY-by-default results
  | { kind: "crate-scanning" }
  | { kind: "crate-valuing"; items: MultiDetectItem[] }
  | { kind: "crate-done"; items: MultiDetectItem[]; valuations: Map<number, BatchValuation> }
  | { kind: "crate-empty" }
  | { kind: "crate-limit"; used: number; limit: number };

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

function CaptureShutter({
  cameraReady,
  onTap,
}: {
  cameraReady: boolean;
  onTap: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      aria-label="Capture photo"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={!cameraReady}
      style={{
        width: 68,
        height: 68,
        borderRadius: "50%",
        backgroundColor: "rgba(92,224,184,0.12)",
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
        transition:
          "box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        transform: pressed ? "scale(0.96)" : "scale(1)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: 42,
          height: 42,
          borderRadius: "50%",
          backgroundColor: pressed
            ? "rgba(92,224,184,0.60)"
            : "rgba(92,224,184,0.30)",
          transition:
            "background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </button>
  );
}

function CameraOffIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E8636B"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1={5} y1={5} x2={19} y2={19} />
      <line x1={19} y1={5} x2={5} y2={19} />
    </svg>
  );
}

function CancelButton({
  onCancel,
  label = "CANCEL",
  marginTop = 24,
}: {
  onCancel: () => void;
  label?: string;
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

// ─── Crate mode components ────────────────────────────────────────────────────
// Phase 1: user manually arms slots to indicate which covers to analyze.
// Phase 2 will auto-detect covers from a captured frame and arm them.

// ─── Crate cascade geometry ───────────────────────────────────────────────────
// Mental model: phone held ABOVE the crate pointing DOWN. Records recede away
// from the user (upward in frame). Card 0 = front (nearest, bottom of frame,
// largest strip). Card 4 = back (furthest, top of frame, smallest strip).
// Only each card's top strip is visible; the body is occluded by the card
// immediately in front (higher z-index = front).

const CRATE_CARD_COUNT = 5;
// Visible strip height per card — index 0=front to 4=back
const CRATE_STRIPS  = [22, 20, 18, 17, 16] as const;
// Width scale per card (front widest, back narrowest — sells depth recession)
const CRATE_SCALES  = [1.00, 0.96, 0.92, 0.88, 0.84] as const;
const CRATE_MAX_W   = 224;  // px — widest card (front)
const CRATE_BODY_H  = 52;   // px — card body below strip (occluded by front cards)
// Precomputed top offset for each card within the cascade container
// topOf(4)=0, topOf(3)=16, topOf(2)=33, topOf(1)=51, topOf(0)=71
const CRATE_TOPS    = [71, 51, 33, 16, 0] as const;
// Total container height = TOPS[0] + STRIPS[0] + BODY_H = 71+22+52 = 145
const CRATE_H       = CRATE_TOPS[0] + CRATE_STRIPS[0] + CRATE_BODY_H;

interface CrateOverlayProps {
  armedSlots: Set<number>;
  justArmedSlot: number | null;
  onToggleSlot: (i: number) => void;
  slotRefs: { current: Array<HTMLDivElement | null> };
}

function CrateOverlay({ armedSlots, justArmedSlot, onToggleSlot, slotRefs }: CrateOverlayProps) {
  return (
    <div
      aria-label="Crate cover selector — tap a strip to arm"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      <div style={{ position: "relative", width: CRATE_MAX_W, height: CRATE_H }}>
        {Array.from({ length: CRATE_CARD_COUNT }, (_, i) => {
          const armed   = armedSlots.has(i);
          const pulsing = justArmedSlot === i && armed;

          const top     = CRATE_TOPS[i];
          const stripH  = CRATE_STRIPS[i];
          const cardW   = Math.round(CRATE_MAX_W * CRATE_SCALES[i]);
          const leftOff = Math.round((CRATE_MAX_W - cardW) / 2);
          const cardH   = stripH + CRATE_BODY_H;

          // Depth fade: back cards are dimmer so they read as receding
          const depth       = i / (CRATE_CARD_COUNT - 1); // 0=front 1=back
          const edgeAlpha   = armed ? 0.90 : Math.round((0.55 - depth * 0.25) * 100) / 100;
          const sideAlpha   = Math.max(0.06, 0.18 - depth * 0.12);

          return (
            <div
              key={i}
              ref={(el) => { slotRefs.current[i] = el; }}
              onClick={() => onToggleSlot(i)}
              role="button"
              aria-pressed={armed}
              aria-label={`Cover ${i + 1}`}
              style={{
                position: "absolute",
                left: leftOff,
                top,
                width: cardW,
                height: cardH,
                // Front cards (low i) occlude back cards (high i)
                zIndex: CRATE_CARD_COUNT - i,
                background: armed
                  ? "rgba(92,224,184,0.12)"
                  : `rgba(14,10,20,${0.52 + depth * 0.22})`,
                borderTop: `${armed ? 2 : 1.5}px solid rgba(92,224,184,${edgeAlpha})`,
                borderLeft:   `1px solid rgba(92,224,184,${sideAlpha})`,
                borderRight:  `1px solid rgba(92,224,184,${sideAlpha})`,
                borderBottom: "none",
                boxShadow: armed
                  ? "0 -2px 16px rgba(92,224,184,0.22), inset 0 0 0 0.5px rgba(92,224,184,0.18)"
                  : "none",
                cursor: "pointer",
                pointerEvents: "all",
                animation: pulsing
                  ? "slotArm 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                  : "none",
                transition: "background 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
              }}
            >
              {/* Slot number — right-aligned within the visible strip */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: Math.max(2, Math.round(stripH / 2 - 5)),
                  right: 7,
                  fontFamily: "var(--font-label)",
                  fontSize: 8,
                  letterSpacing: "0.06em",
                  color: armed
                    ? "rgba(92,224,184,0.90)"
                    : `rgba(92,224,184,${Math.round((0.55 - depth * 0.30) * 100) / 100})`,
                  pointerEvents: "none",
                  userSelect: "none",
                  transition: "color 120ms ease",
                }}
              >
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CrateCaptureButtonProps {
  armedCount: number;
  onTap: () => void;
}

function CrateCaptureButton({ armedCount, onTap }: CrateCaptureButtonProps) {
  const enabled = armedCount >= 2;
  const [pressed, setPressed] = useState(false);
  const MINT = "#5CE0B8";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 68, height: 68 }}>
        {/* Breathing Saturn ring — visible only when ≥2 slots armed */}
        {enabled && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              border: `1.5px solid rgba(92,224,184,0.50)`,
              animation: "crateBreath 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite",
              pointerEvents: "none",
            }}
          />
        )}
        <button
          type="button"
          aria-label={enabled ? `Capture ${armedCount} covers` : "Arm 2 or more covers to capture"}
          onClick={enabled ? onTap : undefined}
          onPointerDown={() => { if (enabled) setPressed(true); }}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          disabled={!enabled}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            backgroundColor: enabled ? "rgba(92,224,184,0.12)" : "rgba(92,224,184,0.04)",
            border: `3px solid ${MINT}`,
            boxShadow: enabled
              ? "0 0 0 1px rgba(92,224,184,0.10), 0 0 28px -4px rgba(92,224,184,0.45)"
              : "none",
            cursor: enabled ? "pointer" : "not-allowed",
            opacity: enabled ? 1 : 0.40,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition:
              "box-shadow 220ms cubic-bezier(0.16,1,0.3,1), opacity 220ms cubic-bezier(0.16,1,0.3,1), transform 100ms cubic-bezier(0.16,1,0.3,1)",
            transform: pressed ? "scale(0.93)" : "scale(1)",
          }}
        >
          <svg
            width={30}
            height={30}
            viewBox="0 0 24 24"
            fill="none"
            stroke={MINT}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx={12} cy={12} r={5} />
            <ellipse cx={12} cy={12} rx={10} ry={3.5} transform="rotate(-20 12 12)" />
          </svg>
        </button>
      </div>

      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 9,
          color: enabled ? MINT : "#5A4E70",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          transition: "color 200ms ease",
        }}
      >
        {enabled ? `CAPTURE ${armedCount} COVERS` : "ARM 2+ COVERS"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ScanOverlay({
  open,
  mode,
  onResult,
  onCancel,
  onPaywall,
  initialImage,
}: ScanOverlayProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "framing" });
  const [costInput, setCostInput] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"barcode" | "vision" | "shelf" | "crate">(mode);

  // Shelf-specific overlay UI state — separate from phase so they survive
  // the valuing→done transition without resetting.
  const shelfImgRef = useRef<HTMLImageElement>(null);
  const shelfRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [shelfSelectedIndex, setShelfSelectedIndex] = useState<number | null>(null);
  const [shelfImgRenderedSize, setShelfImgRenderedSize] = useState<{
    w: number; h: number;
    drawnX: number; drawnY: number; drawnW: number; drawnH: number;
  } | null>(null);
  // ?debug=1 query param shows raw bbox rectangles over the shelf image
  // so misplaced dots can be diagnosed: wrong bbox (model error) vs wrong mapping (code error).
  const debugBbox =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";
  const [shelfItemCostInput, setShelfItemCostInput] = useState("");
  const [shelfVerdictLoading, setShelfVerdictLoading] = useState(false);
  const [shelfVerdictOpen, setShelfVerdictOpen] = useState(false);
  const [shelfVerdictData, setShelfVerdictData] = useState<VerdictPayload | null>(null);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<"ALL" | "BUY" | "MAYBE" | "PASS">("ALL");
  const [hasCopied, setHasCopied] = useState(false);
  const [haulCost, setHaulCost] = useState("");
  const [shelfRevealCount, setShelfRevealCount] = useState(0);
  const [pressedRowIdx, setPressedRowIdx] = useState<number | null>(null);

  // Crate-mode state — armed slots + per-item save tracking
  const [armedSlots, setArmedSlots] = useState<Set<number>>(new Set());
  const [justArmedSlot, setJustArmedSlot] = useState<number | null>(null);
  const [crateToast, setCrateToast] = useState<string | null>(null);
  const [crateFullFrame, setCrateFullFrame] = useState<string>("");
  const [crateCrops, setCrateCrops] = useState<string[]>([]);
  const [crateStripRects, setCrateStripRects] = useState<StripRect[]>([]);
  const slotRefs = useRef<Array<HTMLDivElement | null>>(Array(5).fill(null));

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
  const cameraReadyRef = useRef(false);
  const cameraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accent = ACCENT[activeMode];

  // Effect 1: camera init. Opens the stream and sets cameraReady.
  // Barcode scanner start is handled separately in Effect 2 so that
  // in-session mode switches can start/stop it without reopening the stream.
  useEffect(() => {
    if (!open) return;

    /* eslint-disable react-hooks/set-state-in-effect */
    setPhase({ kind: "framing" });
    setCostInput("");
    setCameraReady(false);
    setInlineError(null);
    setActiveMode(mode);
    setShelfSelectedIndex(null);
    setShelfImgRenderedSize(null);
    setShelfItemCostInput("");
    setShelfVerdictOpen(false);
    setShelfVerdictData(null);
    setExpandedLots(new Set());
    setActiveFilter("ALL");
    setHaulCost("");
    setShelfRevealCount(0);
    setPressedRowIdx(null);
    setArmedSlots(new Set());
    setJustArmedSlot(null);
    setCrateToast(null);
    setCrateFullFrame("");
    setCrateCrops([]);
    setCrateStripRects([]);
    /* eslint-enable react-hooks/set-state-in-effect */
    shelfRowRefs.current.clear();
    cameraReadyRef.current = false;
    let cancelled = false;

    // Library-upload handoff: an image was supplied, so skip the camera
    // entirely and run the exact same detect→value pipeline a camera
    // capture would (handleShelfCapture sets the shelf-* phases). Only
    // valid for shelf mode; other modes ignore initialImage.
    const providedShelfImage = mode === "shelf" ? initialImage : undefined;

    const video = videoRef.current;
    const onVideoError = () => {
      if (cancelled) return;
      flagError("video-element-error", "video error event");
      setPhase({ kind: "cameraError" });
    };
    if (video) video.addEventListener("error", onVideoError);

    if (providedShelfImage) {
      void handleShelfCapture(providedShelfImage);
    } else {
      cameraTimeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        if (!cameraReadyRef.current) {
          flagError("camera-timeout", "video did not reach playing state");
          setPhase({ kind: "cameraError" });
        }
      }, 6000);

      (async () => {
        try {
          const stream = await openCameraStream();
          if (cancelled) {
            stopStream(stream);
            return;
          }
          streamRef.current = stream;
          const v = videoRef.current;
          if (!v) return;
          v.srcObject = stream;
          await v.play();
          if (cancelled) return;
          cameraReadyRef.current = true;
          setCameraReady(true);
          if (cameraTimeoutRef.current) {
            clearTimeout(cameraTimeoutRef.current);
            cameraTimeoutRef.current = null;
          }
        } catch (err) {
          flagError("camera-init", err);
          if (!cancelled) setPhase({ kind: "cameraError" });
        }
      })();
    }

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
      if (cameraTimeoutRef.current) {
        clearTimeout(cameraTimeoutRef.current);
        cameraTimeoutRef.current = null;
      }
      if (video) video.removeEventListener("error", onVideoError);
    };
  }, [open, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: barcode scanner — starts when camera is ready and activeMode is
  // barcode. Cleans up and restarts whenever activeMode changes within a session.
  useEffect(() => {
    if (!open || !cameraReady || activeMode !== "barcode" || !videoRef.current) {
      scannerRef.current?.stop();
      scannerRef.current = null;
      return;
    }
    const v = videoRef.current;
    let cancelled = false;
    let handle: ScannerHandle | null = null;

    startBarcodeScanner(
      v,
      (upc) => {
        haptic();
        handle?.stop();
        const capturedImage = safelyCaptureFrame(v);
        stopStream(streamRef.current);
        streamRef.current = null;
        setInlineError(null);
        setPhase({
          kind: "captured",
          payload: { type: "barcode", upc, capturedImage },
        });
      },
      (err) => flagError("barcode-decode", err),
    )
      .then((h) => {
        if (!cancelled) {
          handle = h;
          scannerRef.current = h;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      handle?.stop();
      scannerRef.current = null;
    };
  }, [open, cameraReady, activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 3: count-up animation for BUY count on shelf-done reveal.
  useEffect(() => {
    if (phase.kind !== "shelf-done") { setShelfRevealCount(0); return; }
    const target = [...phase.valuations.values()].filter(
      (v) => v.groupRole !== "lot-member" && v.verdict === "BUY",
    ).length;
    if (target === 0) { setShelfRevealCount(0); return; }
    const startTime = performance.now();
    const duration = 600;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setShelfRevealCount(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 4: compute dot coordinate mapping with objectFit awareness; recompute on resize.
  useEffect(() => {
    const el = shelfImgRef.current;
    if (!el || phase.kind !== "shelf-done") return;

    const update = () => {
      const nw = el.naturalWidth;
      const nh = el.naturalHeight;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw === 0 || ch === 0 || nw === 0 || nh === 0) return;
      const fit = window.getComputedStyle(el).objectFit || "fill";
      let drawnX = 0, drawnY = 0, drawnW = cw, drawnH = ch;
      if (fit === "contain") {
        const scale = Math.min(cw / nw, ch / nh);
        drawnW = nw * scale; drawnH = nh * scale;
        drawnX = (cw - drawnW) / 2; drawnY = (ch - drawnH) / 2;
      } else if (fit === "cover") {
        const scale = Math.max(cw / nw, ch / nh);
        drawnW = nw * scale; drawnH = nh * scale;
        drawnX = (cw - drawnW) / 2; drawnY = (ch - drawnH) / 2;
      }
      console.log("[DOTS] imgNatural=", nw, nh, "rendered=", cw, ch,
        "objectFit=", fit, "drawnArea=", drawnX.toFixed(1), drawnY.toFixed(1),
        drawnW.toFixed(1), drawnH.toFixed(1));
      setShelfImgRenderedSize({ w: cw, h: ch, drawnX, drawnY, drawnW, drawnH });
    };

    if (el.complete && el.naturalWidth > 0) update();
    el.addEventListener("load", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("load", update);
      ro.disconnect();
    };
  }, [phase.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch active mode within an open session.
  const switchMode = (m: "barcode" | "vision" | "shelf" | "crate") => {
    if (m === activeMode) return;
    setPhase({ kind: "framing" });
    setInlineError(null);
    setShelfSelectedIndex(null);
    setShelfImgRenderedSize(null);
    setExpandedLots(new Set());
    setActiveFilter("ALL");
    setHaulCost("");
    setPressedRowIdx(null);
    shelfRowRefs.current.clear();
    setArmedSlots(new Set());
    setJustArmedSlot(null);
    setCrateToast(null);
    setCrateFullFrame("");
    setCrateCrops([]);
    setCrateStripRects([]);
    setActiveMode(m);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) {
      flagError("capture", "video element not ready");
      return;
    }
    try {
      const image = captureFrame(video);
      haptic();
      stopStream(streamRef.current);
      streamRef.current = null;
      setInlineError(null);
      if (activeMode === "shelf") {
        void handleShelfCapture(image);
      } else {
        setPhase({
          kind: "captured",
          payload: { type: "vision", image },
        });
      }
    } catch (err) {
      const message = flagError("capture", err);
      setPhase({ kind: "error", message });
    }
  };

  // Crate capture — Phase 2: capture + crop armed strips, detect + value via pipeline.
  const handleCrateCapture = async () => {
    if (armedSlots.size < 2) return;
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    haptic([10, 30, 10]);

    // ── Capture full frame + crop each armed strip ──────────────────
    const nativeW = video.videoWidth;
    const nativeH = video.videoHeight;
    if (nativeW === 0 || nativeH === 0) {
      setCrateToast("Camera not ready");
      return;
    }

    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = nativeW;
    fullCanvas.height = nativeH;
    const fullCtx = fullCanvas.getContext("2d");
    if (!fullCtx) return;
    fullCtx.drawImage(video, 0, 0);

    // Map CSS slot positions → native video pixels, accounting for object-fit: cover.
    const videoRect = video.getBoundingClientRect();
    const vpW = videoRect.width;
    const vpH = videoRect.height;
    // Scale that fills the container (object-fit: cover)
    const coverScale = Math.max(vpW / nativeW, vpH / nativeH);
    const renderedW = nativeW * coverScale;
    const renderedH = nativeH * coverScale;
    const originX = (vpW - renderedW) / 2; // negative if video wider than viewport
    const originY = (vpH - renderedH) / 2;

    const armedArr = [...armedSlots].sort((a, b) => a - b);
    const crops: string[] = [];
    const stripRects: StripRect[] = [];

    for (const slotIdx of armedArr) {
      const el = slotRefs.current[slotIdx];
      if (!el) continue;
      const sr = el.getBoundingClientRect();

      // CSS coords relative to video element's top-left
      const cssX = sr.left - videoRect.left;
      const cssY = sr.top - videoRect.top;

      // Map to native video pixels (undo cover scale + offset)
      const nx = Math.max(0, Math.round((cssX - originX) / coverScale));
      const ny = Math.max(0, Math.round((cssY - originY) / coverScale));
      const nw = Math.min(Math.round(sr.width / coverScale), nativeW - nx);
      const nh = Math.min(Math.round(sr.height / coverScale), nativeH - ny);

      if (nw <= 0 || nh <= 0) continue;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = nw;
      cropCanvas.height = nh;
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) continue;
      cropCtx.drawImage(fullCanvas, nx, ny, nw, nh, 0, 0, nw, nh);
      // Push crop and its matching viewport rect together so indices stay aligned
      crops.push(cropCanvas.toDataURL("image/jpeg", 0.85));
      stripRects.push({ left: sr.left, top: sr.top, width: sr.width, height: sr.height });
    }

    if (crops.length < 2) {
      setCrateToast("Couldn't capture covers");
      setTimeout(() => setCrateToast(null), 1500);
      return;
    }

    // Capture resized full frame for FLIP background (800px max dim keeps data URL small)
    let fullFrame = "";
    {
      const maxDim = 800;
      const ratio = Math.min(maxDim / nativeW, maxDim / nativeH, 1);
      const dCanvas = document.createElement("canvas");
      dCanvas.width = Math.round(nativeW * ratio);
      dCanvas.height = Math.round(nativeH * ratio);
      const dCtx = dCanvas.getContext("2d");
      if (dCtx) {
        dCtx.drawImage(fullCanvas, 0, 0, dCanvas.width, dCanvas.height);
        fullFrame = dCanvas.toDataURL("image/jpeg", 0.70);
      }
    }
    setCrateFullFrame(fullFrame);
    setCrateCrops(crops);
    setCrateStripRects(stripRects);

    // Stop camera feed, reset slot state
    stopStream(streamRef.current);
    streamRef.current = null;
    setArmedSlots(new Set());
    setJustArmedSlot(null);

    // ── Stage 1: detecting (gray markers shown immediately) ─────────
    setPhase({ kind: "crate-scanning" });

    let detectedItems: MultiDetectItem[] = [];
    try {
      const res = await fetch("/api/scan-multi/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "crate", crops }),
      });
      const json = await res.json();
      if (res.status === 429 && json.error === "monthly_limit") {
        setPhase({ kind: "crate-limit", used: json.used ?? 0, limit: json.limit ?? 500 });
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Detection failed");
      detectedItems = json.items ?? [];
    } catch (err) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Crate detection failed" });
      return;
    }

    if (detectedItems.length === 0) {
      setPhase({ kind: "crate-empty" });
      return;
    }

    // ── Stage 2: valuing (markers fill with color as valuation returns) ─
    setPhase({ kind: "crate-valuing", items: detectedItems });

    let valuations: BatchValuation[] = [];
    try {
      const res = await fetch("/api/scan-multi/value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: detectedItems.map((it, i) => ({ index: i, name: it.name, category: it.category })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Valuation failed");
      valuations = json.valuations ?? [];
    } catch (err) {
      setPhase({ kind: "error", message: err instanceof Error ? err.message : "Crate valuation failed" });
      return;
    }

    const valMap = new Map<number, BatchValuation>();
    for (const v of valuations) valMap.set(v.index, v);
    setPhase({ kind: "crate-done", items: detectedItems, valuations: valMap });
  };

  // Two-stage shelf scan: detect → value.
  // Reuses /api/scan-multi/detect and /api/scan-multi/value unchanged.
  const handleShelfCapture = async (image: string) => {
    setShelfSelectedIndex(null);
    setShelfImgRenderedSize(null);
    setExpandedLots(new Set());
    setActiveFilter("ALL");
    setHaulCost("");
    setPressedRowIdx(null);
    shelfRowRefs.current.clear();
    setPhase({ kind: "shelf-detecting", capturedImage: image });

    let items: MultiDetectItem[] = [];
    try {
      const res = await fetch("/api/scan-multi/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const json = await res.json();
      if (res.status === 429 && json.error === "monthly_limit") {
        setPhase({ kind: "shelf-limit", used: json.used ?? 0, limit: json.limit ?? 500 });
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Detection failed");
      items = json.items ?? [];
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Detection failed",
      });
      return;
    }

    if (items.length === 0) {
      setPhase({ kind: "shelf-empty", capturedImage: image });
      return;
    }

    setPhase({ kind: "shelf-valuing", capturedImage: image, items });

    try {
      const res = await fetch("/api/scan-multi/value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it, i) => ({
            index: i,
            name: it.name,
            category: it.category,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Valuation failed");
      const vals: BatchValuation[] = json.valuations ?? [];
      const map = new Map<number, BatchValuation>();
      for (const v of vals) map.set(v.index, v);
      setPhase({ kind: "shelf-done", capturedImage: image, items, valuations: map });
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Valuation failed",
      });
    }
  };

  const handleFullVerdict = async (idx: number, item: MultiDetectItem) => {
    if (shelfVerdictLoading) return;
    const cost = Number(shelfItemCostInput) || 0;
    setShelfVerdictLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "known",
          itemName: item.name,
          category: item.category,
          cost,
        }),
      });
      const data = (await res.json()) as
        | ScanResponse
        | { error: string; scans_used?: number; scans_limit?: number };
      if (res.status === 401 && "error" in data && data.error === "signup_required") {
        setPhase({ kind: "signup-wall" });
        return;
      }
      if (res.status === 403 && "error" in data) {
        if (
          typeof data.scans_used === "number" &&
          typeof data.scans_limit === "number"
        ) {
          onPaywall?.({ used: data.scans_used, limit: data.scans_limit });
        }
        return;
      }
      if (!res.ok || "error" in data) {
        flagError("full-verdict", "error" in data ? data.error : `scan failed (${res.status})`);
        return;
      }
      setShelfVerdictData({ ...(data as ScanResponse), capturedImage: undefined });
      setShelfVerdictOpen(true);
    } catch (err) {
      flagError("full-verdict", err);
    } finally {
      setShelfVerdictLoading(false);
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
        if (res.status === 401 && "error" in data && data.error === "signup_required") {
          if (progressTimer.current) clearInterval(progressTimer.current);
          progressTimer.current = null;
          setPhase({ kind: "signup-wall" });
          return;
        }
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
        const message = flagError(`api-error[${res.status}]`, apiMessage);
        setPhase({ kind: "error", message });
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = null;
        return;
      }

      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = null;
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

  // Anonymous signup wall takes over the whole overlay — it replaces the
  // scan result area rather than layering over the camera/shelf/crate UI.
  if (phase.kind === "signup-wall") {
    return (
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
          padding: 24,
        }}
      >
        <SignupWallCard />
        <CancelButton onCancel={onCancel} label="not now" />
      </div>
    );
  }

  // Derived shelf values — used in shelf-valuing and shelf-done render.
  const isShelfPhase =
    phase.kind === "shelf-detecting" ||
    phase.kind === "shelf-valuing" ||
    phase.kind === "shelf-done" ||
    phase.kind === "shelf-empty" ||
    phase.kind === "shelf-limit";

  const isCratePhase =
    phase.kind === "crate-scanning" ||
    phase.kind === "crate-valuing" ||
    phase.kind === "crate-done" ||
    phase.kind === "crate-empty" ||
    phase.kind === "crate-limit";

  // Crate results — sort by underlying verdict tier then resale desc.
  // Items flagged as unreadable are separated to the bottom.
  const crateValuations =
    phase.kind === "crate-done" ? [...phase.valuations.values()] : [];
  const CTIER: Record<string, number> = { BUY: 0, MAYBE: 1, PASS: 2 };
  const crateReadable = crateValuations
    .filter((v) => !v.name.toLowerCase().includes("unreadable"))
    .sort((a, b) => {
      const ta = CTIER[a.verdict] ?? 1;
      const tb = CTIER[b.verdict] ?? 1;
      if (ta !== tb) return ta - tb;
      return b.estResale - a.estResale;
    });
  const crateUnreadable = crateValuations.filter((v) =>
    v.name.toLowerCase().includes("unreadable"),
  );
  const crateSortedRows = [...crateReadable, ...crateUnreadable];

  const shelfItems =
    phase.kind === "shelf-valuing" || phase.kind === "shelf-done"
      ? phase.items
      : [];

  const shelfValuations =
    phase.kind === "shelf-done"
      ? phase.valuations
      : new Map<number, BatchValuation>();

  const isShelfValuing = phase.kind === "shelf-valuing";

  // Hero headline stats — anchors+singles only (lot-members excluded from counts).
  const sortedMain =
    phase.kind === "shelf-done" ? buildSortedRows(shelfValuations) : [];
  const buyMain = sortedMain.filter((v) => v.verdict === "BUY");
  const heroMaybeCount = sortedMain.filter((v) => v.verdict === "MAYBE").length;
  const heroPassCount = sortedMain.filter((v) => v.verdict === "PASS").length;
  const heroSumLow = Math.round(buyMain.reduce((s, v) => s + v.resaleLow, 0));
  const heroSumHigh = Math.round(buyMain.reduce((s, v) => s + v.resaleHigh, 0));

  // Active-filter headline stats — recompute when chip changes.
  const activeFilterItems =
    activeFilter === "ALL" || activeFilter === "BUY"
      ? buyMain
      : sortedMain.filter((v) => v.verdict === activeFilter);
  const headlineCount = activeFilterItems.length;
  const headlineSumLow = Math.round(
    activeFilterItems.reduce((s, v) => s + v.resaleLow, 0),
  );
  const headlineSumHigh = Math.round(
    activeFilterItems.reduce((s, v) => s + v.resaleHigh, 0),
  );
  const showResaleLine =
    activeFilter !== "PASS" &&
    headlineCount > 0 &&
    (headlineSumLow > 0 || headlineSumHigh > 0);

  // Haul cost → net estimate (BUYs gross × 0.87 minus lot cost).
  const haulCostNum = Number(haulCost) || 0;
  const buyGrossResale = buyMain.reduce((s, v) => s + v.estResale, 0);
  const haulNet =
    haulCostNum > 0
      ? Math.round((buyGrossResale * 0.87 - haulCostNum) * 100) / 100
      : null;
  const haulMultiple =
    haulCostNum > 0 && buyGrossResale > 0
      ? (buyGrossResale / haulCostNum).toFixed(1)
      : null;

  // Best BUY by estResale; prefer confident items (exclude needsVerify / low idConfidence).
  // Tiebreak: demand (High>Med>Low) then speed (FAST>MODERATE>SLOW).
  const confidentBuys = buyMain.filter((v) => !v.needsVerify && v.idConfidence !== "low");
  const grabPool = confidentBuys.length > 0 ? confidentBuys : buyMain;
  const grabIsUnverified = confidentBuys.length === 0 && buyMain.length > 0;
  const pickBest = (pool: BatchValuation[]) =>
    pool.reduce<BatchValuation | null>((best, v) => {
      if (!best) return v;
      if (v.estResale !== best.estResale) return v.estResale > best.estResale ? v : best;
      const dem = (x: BatchValuation) => x.demand === "High" ? 2 : x.demand === "Medium" ? 1 : 0;
      const spd = (x: BatchValuation) => x.sellSpeed === "FAST" ? 2 : x.sellSpeed === "MODERATE" ? 1 : 0;
      if (dem(v) !== dem(best)) return dem(v) > dem(best) ? v : best;
      return spd(v) > spd(best) ? v : best;
    }, null);
  const bestGrab = pickBest(grabPool);

  // Profit projection timeline — humanized max daysToSell across BUYs.
  // daysToSell is a model string like "2-4 weeks"; take the numeric max then scale.
  const parseDTS = (s: string) => {
    const nums = (s.match(/\d+/g) ?? []).map(Number);
    const n = nums.length > 0 ? Math.max(...nums) : 14;
    if (/month/i.test(s)) return n * 30;
    if (/week/i.test(s)) return n * 7;
    return n;
  };
  const maxDays = buyMain.reduce((m, v) => Math.max(m, parseDTS(v.daysToSell)), 0);
  const timeline =
    maxDays <= 0 ? "" :
    maxDays <= 7 ? `${maxDays}d` :
    maxDays < 45 ? `~${Math.round(maxDays / 7)}wk` :
    `~${Math.round(maxDays / 30)}mo`;

  // Filtered list — ALL shows every anchor/single; tier chip narrows by verdict.
  const filteredMain =
    activeFilter === "ALL"
      ? sortedMain
      : sortedMain.filter((v) => v.verdict === activeFilter);

  // Dot clusters computed after image renders.
  const dotClusters =
    shelfImgRenderedSize && phase.kind === "shelf-done"
      ? clusterDots(shelfItems, shelfValuations, shelfImgRenderedSize)
      : [];

  const copyHaul = async () => {
    const buy = sortedMain.filter((v) => v.verdict === "BUY");
    const maybe = sortedMain.filter((v) => v.verdict === "MAYBE");
    const fmtRange = (v: BatchValuation) =>
      v.resaleLow > 0 && v.resaleHigh > 0
        ? `$${v.resaleLow}–$${v.resaleHigh}`
        : v.estResale > 0
          ? `$${v.estResale}`
          : "";

    let text = `LOOT HAUL — ${sortedMain.length} items · ${buy.length} worth grabbing`;
    if (heroSumLow > 0 || heroSumHigh > 0) {
      text += `\n~$${heroSumLow}–$${heroSumHigh} resale`;
    }
    if (buy.length > 0) {
      text += "\n\nBUY:";
      for (const v of buy) {
        const r = fmtRange(v);
        text += `\n- ${v.name}${r ? ` · ${r}` : ""}${v.platform ? ` · ${v.platform}` : ""}`;
      }
    }
    if (maybe.length > 0) {
      text += "\n\nMAYBE:";
      for (const v of maybe) {
        const r = fmtRange(v);
        text += `\n- ${v.name}${r ? ` · ${r}` : ""}`;
      }
    }
    text += "\n\nvia loot.works";

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* silent */ }
      document.body.removeChild(ta);
    }
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

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
        @keyframes shelfPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .shelf-pulse { animation: shelfPulse 1.2s ease-in-out infinite; }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slotArm {
          0%   { transform: scale(1);    filter: drop-shadow(0 0 0px rgba(92,224,184,0)); }
          45%  { transform: scale(1.04); filter: drop-shadow(0 0 12px rgba(92,224,184,0.85)); }
          100% { transform: scale(1);    filter: drop-shadow(0 0 4px rgba(92,224,184,0.35)); }
        }
        @keyframes crateBreath {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.80; transform: scale(1.06); }
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
        {/* Crate Phase 1 stub toast — shows on capture, clears after 1.5s */}
        {crateToast && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 60,
              background: "rgba(7,5,16,0.82)",
              border: "1px solid rgba(92,224,184,0.35)",
              borderRadius: 14,
              padding: "14px 28px",
              fontFamily: "var(--font-label)",
              fontSize: 11,
              color: "#5CE0B8",
              letterSpacing: "0.12em",
              textAlign: "center",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 0 40px rgba(92,224,184,0.12)",
              pointerEvents: "none",
            }}
          >
            {crateToast}
          </div>
        )}

        {/* ── Shelf result panel ── full-screen, all shelf phases ── */}
        {isShelfPhase && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              background: "rgba(10,8,14,0.98)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header: close button only — headline or spinner carries the status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "14px 18px 6px",
                flexShrink: 0,
              }}
            >
              <button
                onClick={onCancel}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "#5A4E70",
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <line x1={18} y1={6} x2={6} y2={18} />
                  <line x1={6} y1={6} x2={18} y2={18} />
                </svg>
              </button>
            </div>

            {/* Loading: one spinner + one status line */}
            {(phase.kind === "shelf-detecting" ||
              phase.kind === "shelf-valuing") && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  padding: "4px 20px 32px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={phase.capturedImage}
                  alt="captured shelf"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    opacity: 0.55,
                    objectFit: "contain",
                  }}
                />
                <CoinMarkSpinner />
                <span
                  className="shelf-pulse"
                  style={{
                    color: "#f59e0b",
                    fontFamily: "var(--font-label)",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {phase.kind === "shelf-detecting"
                    ? "READING THE SHELF…"
                    : `PRICING ${shelfItems.length} ITEMS…`}
                </span>
              </div>
            )}

            {/* Empty state */}
            {phase.kind === "shelf-empty" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: 32,
                  textAlign: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={phase.capturedImage}
                  alt="captured shelf"
                  style={{
                    width: "100%",
                    maxHeight: 200,
                    objectFit: "contain",
                    borderRadius: 8,
                    opacity: 0.4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    color: "#C8C0D8",
                  }}
                >
                  nothing detected
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "#5A4E70",
                    lineHeight: 1.5,
                  }}
                >
                  get closer · more light · aim at item spines
                </div>
                <button
                  onClick={() => setPhase({ kind: "framing" })}
                  style={{
                    marginTop: 8,
                    padding: "10px 28px",
                    borderRadius: 10,
                    background: "rgba(92,224,184,0.08)",
                    border: "1px solid rgba(92,224,184,0.20)",
                    color: "#5CE0B8",
                    fontFamily: "var(--font-label)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    cursor: "pointer",
                  }}
                >
                  RETAKE
                </button>
              </div>
            )}

            {/* Monthly Pro limit hit */}
            {phase.kind === "shelf-limit" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, lineHeight: 1 }}>📦</div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    color: "#5CE0B8",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  shelf-scan limit reached
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "#C8C0D8",
                    lineHeight: 1.5,
                    maxWidth: 260,
                  }}
                >
                  You&apos;ve used {phase.used}/{phase.limit} shelf scans this month.
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "#5A4E70",
                    lineHeight: 1.5,
                  }}
                >
                  Resets{" "}
                  {(() => {
                    const d = new Date();
                    const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
                    return first.toLocaleDateString("en-US", { month: "long", day: "numeric" });
                  })()}
                </div>
                <button
                  onClick={onCancel}
                  style={{
                    marginTop: 8,
                    padding: "10px 28px",
                    borderRadius: 10,
                    background: "rgba(92,224,184,0.08)",
                    border: "1px solid rgba(92,224,184,0.20)",
                    color: "#5CE0B8",
                    fontFamily: "var(--font-label)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    cursor: "pointer",
                  }}
                >
                  CLOSE
                </button>
              </div>
            )}

            {/* Done: hero headline + cosmic bg + image with clustered dots + sorted list */}
            {phase.kind === "shelf-done" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                {/* ── HERO HEADER with cosmic texture ── */}
                <div style={{ position: "relative", padding: "0 18px 14px", flexShrink: 0, overflow: "hidden" }}>
                  {/* Cosmic: scattered stars + Saturn ring arc */}
                  <svg
                    aria-hidden="true"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Saturn ring orbiting the hero number (left of header) */}
                    <ellipse cx="38" cy="36" rx="55" ry="18" fill="none" stroke="rgba(92,224,184,0.10)" strokeWidth="1.5" />
                    <ellipse cx="38" cy="36" rx="68" ry="25" fill="none" stroke="rgba(92,224,184,0.06)" strokeWidth="1"   />
                    {/* 4 accent stars clustered near the ring */}
                    <circle cx="92"  cy="18"  r="1"   fill="rgba(92,224,184,0.52)" />
                    <circle cx="94"  cy="56"  r="0.8" fill="rgba(255,255,255,0.30)" />
                    <circle cx="8"   cy="30"  r="0.7" fill="rgba(92,224,184,0.38)" />
                    <circle cx="40"  cy="8"   r="0.9" fill="rgba(255,255,255,0.25)" />
                  </svg>

                  {/* Hero count + copy button row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {activeFilter === "MAYBE" ? (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 60, lineHeight: 1, color: "#F5C518", letterSpacing: "-0.01em" }}>
                            {headlineCount}
                          </span>
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: 20, fontWeight: 600, color: "#9ca3af", paddingBottom: 4 }}>
                            maybe
                          </span>
                        </div>
                      ) : activeFilter === "PASS" ? (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 60, lineHeight: 1, color: "#6b7280", letterSpacing: "-0.01em" }}>
                            {headlineCount}
                          </span>
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: 20, fontWeight: 600, color: "#6b7280", paddingBottom: 4 }}>
                            pass
                          </span>
                        </div>
                      ) : headlineCount > 0 ? (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 64,
                            lineHeight: 1,
                            color: "#5CE0B8",
                            letterSpacing: "-0.01em",
                            textShadow: "0 0 24px rgba(92,224,184,0.55), 0 0 60px rgba(92,224,184,0.18)",
                          }}>
                            {shelfRevealCount}
                          </span>
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: 20, fontWeight: 600, color: "#9ca3af", paddingBottom: 4 }}>
                            worth grabbing
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, color: "#C8C0D8", lineHeight: 1.2 }}>
                          nothing worth grabbing
                        </div>
                      )}
                      {showResaleLine && (
                        <div style={{ fontFamily: "var(--font-data)", fontSize: 14, color: "rgba(92,224,184,0.55)", marginTop: 4, letterSpacing: "0.04em" }}>
                          ~${headlineSumLow}–${headlineSumHigh} resale
                        </div>
                      )}
                      <div style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "#4b5563", marginTop: 3, letterSpacing: "0.04em" }}>
                        {heroMaybeCount} maybe · {heroPassCount} pass · {shelfItems.length} items
                      </div>
                      {bestGrab && (
                        <div
                          onClick={() => {
                            setShelfSelectedIndex(bestGrab.index);
                            shelfRowRefs.current.get(bestGrab.index)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          }}
                          style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "#5CE0B8", marginTop: 5, letterSpacing: "0.04em", cursor: "pointer" }}
                        >
                          👑 best grab — {cleanDisplayName(bestGrab.name)} · ${bestGrab.resaleLow}–${bestGrab.resaleHigh}{grabIsUnverified ? " (verify first)" : ""}
                        </div>
                      )}
                    </div>

                    {/* COPY HAUL — primary action */}
                    <button
                      onClick={() => void copyHaul()}
                      style={{
                        flexShrink: 0,
                        marginTop: 4,
                        padding: "7px 12px",
                        borderRadius: 10,
                        background: hasCopied ? "#5CE0B8" : "rgba(92,224,184,0.10)",
                        border: hasCopied ? "none" : "1px solid rgba(92,224,184,0.30)",
                        color: hasCopied ? "#000" : "#5CE0B8",
                        fontFamily: "var(--font-label)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: hasCopied ? "0 0 14px rgba(92,224,184,0.40)" : "none",
                        transition: "all 200ms ease",
                      }}
                    >
                      {hasCopied ? "✓ COPIED" : "⬆ COPY HAUL"}
                    </button>
                  </div>

                  {/* HAUL COST → NET BAR */}
                  <div style={{
                    marginTop: 12,
                    padding: "9px 12px",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    position: "relative",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#5A4E70", flexShrink: 0 }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="what'd you pay for the lot?"
                        value={haulCost}
                        onChange={(e) => setHaulCost(e.target.value)}
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: "#e5e7eb",
                          minWidth: 0,
                        }}
                      />
                      {haulCostNum > 0 && haulNet !== null && (
                        <>
                          <span style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: haulNet >= 0 ? "#5CE0B8" : "#E8636B",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}>
                            {haulNet >= 0 ? `~$${haulNet}` : `~-$${Math.abs(haulNet)}`} net
                          </span>
                          {haulMultiple && (
                            <span style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 11,
                              color: "#6b7280",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}>
                              {haulMultiple}×
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-data)", fontSize: 9, color: "#374151", marginTop: 5, letterSpacing: "0.03em" }}>
                      est. after ~13% fees · BUYs only
                    </div>
                    {haulNet !== null && buyMain.length > 0 && timeline && (
                      <div style={{ fontFamily: "var(--font-data)", fontSize: 9, color: haulNet >= 0 ? "#5CE0B8" : "#E8636B", marginTop: 3, letterSpacing: "0.03em" }}>
                        flip all {buyMain.length} BUYs → {haulNet >= 0 ? `~$${haulNet}` : `~-$${Math.abs(haulNet)}`} over {timeline}
                      </div>
                    )}
                  </div>

                  {/* FILTER CHIPS: ALL · BUY · MAYBE · PASS */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {(["ALL", "BUY", "MAYBE", "PASS"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        style={{
                          padding: "5px 13px",
                          borderRadius: 20,
                          background: activeFilter === f
                            ? (f === "MAYBE" ? "#F5C518" : f === "PASS" ? "#6b7280" : "#5CE0B8")
                            : "rgba(255,255,255,0.05)",
                          border: activeFilter === f ? "none" : "1px solid rgba(255,255,255,0.12)",
                          color: activeFilter === f ? "#000" : "#6b7280",
                          fontFamily: "var(--font-label)",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          cursor: "pointer",
                          boxShadow: activeFilter === f
                            ? (f === "BUY" ? "0 0 12px rgba(92,224,184,0.40)"
                              : f === "MAYBE" ? "0 0 10px rgba(245,197,24,0.35)"
                              : "none")
                            : "none",
                          transition: "all 150ms ease",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── IMAGE WITH CLUSTERED VERDICT DOTS ── */}
                <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={shelfImgRef}
                    src={phase.capturedImage}
                    alt="shelf"
                    style={{ width: "100%", display: "block" }}
                  />
                  {shelfImgRenderedSize &&
                    dotClusters.map((cluster, ci) => {
                      const isSingle = cluster.indices.length === 1;
                      const detIdx = cluster.indices[0];
                      const isSel = isSingle && shelfSelectedIndex === detIdx;
                      const clusterMatchesFilter =
                        activeFilter === "ALL" ||
                        cluster.indices.some((idx) => {
                          const v = shelfValuations.get(idx);
                          return v?.verdict === activeFilter;
                        });
                      return (
                        <button
                          key={ci}
                          onClick={() => {
                            const targetIdx = cluster.indices[0];
                            if (isSingle) {
                              setShelfSelectedIndex(targetIdx === shelfSelectedIndex ? null : targetIdx);
                              const clickedVal = shelfValuations.get(targetIdx);
                              if (clickedVal?.groupRole === "lot-member" && clickedVal.groupId) {
                                setExpandedLots((prev) => new Set([...prev, clickedVal.groupId!]));
                              }
                            } else {
                              setShelfSelectedIndex(targetIdx);
                            }
                            shelfRowRefs.current.get(targetIdx)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          }}
                          aria-label={
                            isSingle
                              ? `Item ${detIdx + 1}: ${shelfItems[detIdx]?.name ?? ""}`
                              : `${cluster.indices.length} items`
                          }
                          style={{
                            position: "absolute",
                            left: cluster.cx,
                            top: cluster.cy,
                            transform: `translate(-50%, -50%) scale(${isSel ? 1.4 : 1})`,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: cluster.color,
                            color: cluster.color === SHELF_DOT_GRAY ? "#9ca3af" : "#000",
                            fontSize: isSingle ? 10 : 9,
                            fontWeight: "bold",
                            fontFamily: "var(--font-space-mono), monospace",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isSel
                              ? `0 0 0 3px #fff, 0 0 12px 4px ${cluster.color}`
                              : "0 1px 3px rgba(0,0,0,0.6)",
                            transition: "background 300ms ease, transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease",
                            opacity: clusterMatchesFilter ? 1 : 0.25,
                            zIndex: isSel ? 10 : 5,
                          }}
                        >
                          {isSingle ? detIdx + 1 : `+${cluster.indices.length}`}
                        </button>
                      );
                    })}
                  {/* DEV: ?debug=1 — draw raw bbox rects to distinguish model bbox error vs. mapping error */}
                  {debugBbox && shelfImgRenderedSize && shelfItems.map((item, idx) => {
                    const { drawnX, drawnY, drawnW, drawnH } = shelfImgRenderedSize;
                    const [bx, by, bw, bh] = item.bbox;
                    return (
                      <div
                        key={`dbg-${idx}`}
                        style={{
                          position: "absolute",
                          left: drawnX + bx * drawnW,
                          top: drawnY + by * drawnH,
                          width: bw * drawnW,
                          height: bh * drawnH,
                          border: "2px solid rgba(255, 80, 80, 0.85)",
                          background: "rgba(255, 80, 80, 0.12)",
                          pointerEvents: "none",
                          boxSizing: "border-box",
                          zIndex: 20,
                        }}
                      >
                        <span style={{ fontSize: 8, color: "#ff5050", fontFamily: "var(--font-space-mono), monospace", lineHeight: 1, padding: "1px 2px", background: "rgba(0,0,0,0.6)", display: "inline-block" }}>
                          {idx}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* ── SORTED ITEM LIST — staggered reveal, elevated cards ── */}
                <div
                  key={activeFilter}
                  style={{ padding: "10px 12px 32px", display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {filteredMain.length === 0 ? (
                    <div style={{
                      padding: "24px 0",
                      textAlign: "center",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "#4b5563",
                      animation: "rowIn 250ms ease both",
                    }}>
                      no {activeFilter.toLowerCase()} items
                    </div>
                  ) : filteredMain.map((val, rowIdx) => {
                    const detIdx = val.index;
                    const isSel = shelfSelectedIndex === detIdx;
                    const isPressed = pressedRowIdx === detIdx;
                    const color = SHELF_VERDICT_COLOR[val.verdict];
                    const isAnchor = val.groupRole === "lot-anchor";
                    const isExpanded = isAnchor && val.groupId ? expandedLots.has(val.groupId) : false;
                    const members = isAnchor && val.groupId
                      ? [...shelfValuations.values()].filter(
                          (v) => v.groupRole === "lot-member" && v.groupId === val.groupId,
                        )
                      : [];

                    const priceStr =
                      val.resaleLow > 0 && val.resaleHigh > 0
                        ? `$${val.resaleLow}–$${val.resaleHigh}`
                        : val.estResale > 0 ? `$${val.estResale}` : "—";

                    const displayName = cleanDisplayName(val.name);

                    return (
                      <div key={detIdx} style={{ animation: `rowIn 280ms ease ${rowIdx * 35}ms both` }}>
                        {/* Elevated card: gradient left bar + card body */}
                        <div
                          ref={(el) => {
                            if (el) shelfRowRefs.current.set(detIdx, el);
                            else shelfRowRefs.current.delete(detIdx);
                          }}
                          onClick={() => setShelfSelectedIndex(isSel ? null : detIdx)}
                          onPointerDown={() => setPressedRowIdx(detIdx)}
                          onPointerUp={() => setPressedRowIdx(null)}
                          onPointerLeave={() => setPressedRowIdx(null)}
                          style={{
                            display: "flex",
                            borderRadius: "0 8px 8px 0",
                            overflow: "hidden",
                            cursor: "pointer",
                            transform: isPressed ? "scale(0.985)" : "scale(1)",
                            boxShadow: isSel
                              ? "0 2px 12px rgba(0,0,0,0.35)"
                              : "0 1px 4px rgba(0,0,0,0.18)",
                            transition: "transform 100ms ease, box-shadow 120ms ease",
                          }}
                        >
                          {/* Gradient accent bar */}
                          <div style={{
                            width: 3,
                            flexShrink: 0,
                            background: `linear-gradient(to bottom, ${color}, ${color}55)`,
                            transition: "background 300ms ease",
                          }} />
                          {/* Card body: CSS grid — right rail is pixel-fixed, physically cannot be pushed */}
                          <div style={{
                            flex: 1,
                            padding: "7px 10px",
                            background: isPressed
                              ? "rgba(255,255,255,0.065)"
                              : isSel
                                ? "rgba(255,255,255,0.052)"
                                : "rgba(255,255,255,0.026)",
                            display: "grid",
                            gridTemplateColumns: "28px 1fr 96px",
                            alignItems: "center",
                            columnGap: 6,
                            minWidth: 0,
                            transition: "background 120ms ease",
                          }}>
                            {/* Col 1: index dot (28px column) */}
                            <span style={{
                              width: 20, height: 20, borderRadius: "50%",
                              background: color, color: "#000",
                              fontSize: 9, fontWeight: "bold", fontFamily: "var(--font-space-mono), monospace",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              justifySelf: "center",
                              boxShadow: val.verdict === "BUY" ? "0 0 6px rgba(92,224,184,0.50)" : "none",
                            }}>
                              {detIdx + 1}
                            </span>

                            {/* Col 2: name + meta line (1fr — overflow hidden) */}
                            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{
                                fontFamily: "var(--font-ui)",
                                fontSize: 13,
                                fontWeight: val.verdict === "BUY" ? 600 : 400,
                                color: val.verdict === "BUY" ? "#E5E0F0" : "#C8C0D8",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}>
                                {displayName}
                              </span>
                              {/* Meta line: lot chip + speed/demand/platform */}
                              <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                                {isAnchor && members.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!val.groupId) return;
                                      const gid = val.groupId;
                                      setExpandedLots((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(gid)) next.delete(gid);
                                        else next.add(gid);
                                        return next;
                                      });
                                    }}
                                    style={{
                                      flexShrink: 0,
                                      background: "rgba(92,224,184,0.08)",
                                      border: "1px solid rgba(92,224,184,0.20)",
                                      borderRadius: 4,
                                      color: "#5CE0B8",
                                      fontFamily: "var(--font-label)",
                                      fontSize: 9,
                                      fontWeight: 700,
                                      letterSpacing: "0.06em",
                                      padding: "1px 5px",
                                      cursor: "pointer",
                                      lineHeight: 1.4,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {members.length + 1} vols {isExpanded ? "▾" : "▸"}
                                  </button>
                                )}
                                <span style={{
                                  flex: 1,
                                  fontFamily: "var(--font-data)",
                                  fontSize: 9,
                                  color: "#4b5563",
                                  letterSpacing: "0.04em",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                  {val.sellSpeed} · {val.demand} · {val.platform}
                                </span>
                              </div>
                            </div>

                            {/* Col 3: verdict pill + price (96px FIXED — can never be pushed) */}
                            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                              {val.needsVerify ? (
                                <span style={{
                                  fontSize: 9, fontWeight: "bold",
                                  fontFamily: "var(--font-label)", color: "#f59e0b",
                                  border: "1px solid rgba(245,158,11,0.5)", borderRadius: 4, padding: "1px 5px",
                                  whiteSpace: "nowrap",
                                }}>
                                  VERIFY
                                </span>
                              ) : val.verdict === "BUY" ? (
                                <span style={{
                                  fontSize: 9, fontWeight: "bold",
                                  fontFamily: "var(--font-label)",
                                  background: "#5CE0B8", color: "#000",
                                  borderRadius: 4, padding: "2px 6px",
                                  boxShadow: "0 0 8px rgba(92,224,184,0.45)",
                                  whiteSpace: "nowrap",
                                }}>
                                  BUY
                                </span>
                              ) : val.verdict === "MAYBE" ? (
                                <span style={{
                                  fontSize: 9, fontWeight: "bold",
                                  fontFamily: "var(--font-label)",
                                  background: "rgba(245,197,24,0.14)", color: "#F5C518",
                                  border: "1px solid rgba(245,197,24,0.35)",
                                  borderRadius: 4, padding: "1px 5px",
                                  whiteSpace: "nowrap",
                                }}>
                                  MAYBE
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 9, fontWeight: "bold",
                                  fontFamily: "var(--font-label)",
                                  background: "rgba(107,114,128,0.12)", color: "#6b7280",
                                  border: "1px solid rgba(107,114,128,0.25)",
                                  borderRadius: 4, padding: "1px 5px",
                                  whiteSpace: "nowrap",
                                }}>
                                  PASS
                                </span>
                              )}
                              <span style={{
                                fontFamily: "var(--font-data)",
                                fontSize: priceStr.length > 10 ? 9 : 10,
                                color: "#9ca3af",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                textAlign: "right",
                              }}>
                                {priceStr}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded lot members — indented, dimmed */}
                        {isExpanded && members.map((member) => (
                          <div
                            key={member.index}
                            ref={(el) => {
                              if (el) shelfRowRefs.current.set(member.index, el);
                              else shelfRowRefs.current.delete(member.index);
                            }}
                            style={{
                              marginLeft: 16,
                              padding: "4px 10px",
                              borderLeft: "2px solid rgba(92,224,184,0.12)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              opacity: 0.5,
                            }}
                          >
                            <span style={{
                              width: 16, height: 16, borderRadius: "50%",
                              background: "rgba(92,224,184,0.15)", color: "#5CE0B8",
                              fontSize: 8, fontWeight: "bold", fontFamily: "var(--font-space-mono), monospace",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              {member.index + 1}
                            </span>
                            <span style={{
                              flex: 1, fontFamily: "var(--font-ui)", fontSize: 12, color: "#9ca3af",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {member.name}
                            </span>
                            <span style={{ fontFamily: "var(--font-data)", fontSize: 10, color: "#4b5563", flexShrink: 0 }}>
                              {member.resaleLow > 0 && member.resaleHigh > 0
                                ? `$${member.resaleLow}–$${member.resaleHigh}`
                                : member.estResale > 0 ? `$${member.estResale}` : "—"}
                            </span>
                          </div>
                        ))}

                        {/* Full verdict callout for selected row — mint elevated card */}
                        {isSel && (
                          <div style={{ display: "flex", marginTop: 4, borderRadius: "0 8px 8px 0", overflow: "hidden" }}>
                            {/* Mint left accent bar */}
                            <div style={{ width: 3, flexShrink: 0, background: "linear-gradient(to bottom, #5CE0B8, rgba(92,224,184,0.25))" }} />
                            <div style={{
                              flex: 1,
                              padding: "10px 12px",
                              background: "rgba(92,224,184,0.04)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}>
                              {val.reasoning && (
                                <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "#9ca3af", lineHeight: 1.55 }}>
                                  <span style={{ color: "#5CE0B8", marginRight: 6, fontWeight: 600 }}>#{detIdx + 1}</span>
                                  {val.reasoning}
                                </div>
                              )}
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <div style={{
                                  flex: 1, height: 36,
                                  backgroundColor: "rgba(0,0,0,0.25)",
                                  border: "1px solid rgba(92,224,184,0.18)",
                                  borderRadius: 8,
                                  display: "flex", alignItems: "center", paddingLeft: 10,
                                }}>
                                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#5CE0B8", marginRight: 4, opacity: 0.7 }}>$</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={shelfItemCostInput}
                                    onChange={(e) => setShelfItemCostInput(e.target.value)}
                                    placeholder="your cost"
                                    style={{
                                      flex: 1, background: "transparent", border: "none", outline: "none",
                                      fontFamily: "var(--font-body)", fontSize: 13, color: "#e5e7eb", minWidth: 0,
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const item = shelfItems[detIdx];
                                    if (item) void handleFullVerdict(detIdx, item);
                                  }}
                                  disabled={shelfVerdictLoading}
                                  style={{
                                    height: 36, padding: "0 14px", borderRadius: 8,
                                    background: shelfVerdictLoading ? "rgba(92,224,184,0.08)" : "#5CE0B8",
                                    border: "none",
                                    color: shelfVerdictLoading ? "#5CE0B8" : "#000",
                                    fontFamily: "var(--font-label)", fontSize: 10, fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    cursor: shelfVerdictLoading ? "not-allowed" : "pointer",
                                    opacity: shelfVerdictLoading ? 0.5 : 1,
                                    whiteSpace: "nowrap",
                                    boxShadow: shelfVerdictLoading ? "none" : "0 0 12px rgba(92,224,184,0.40)",
                                    transition: "all 150ms ease",
                                  }}
                                >
                                  {shelfVerdictLoading ? "…" : "FULL VERDICT"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => setPhase({ kind: "framing" })}
                    style={{
                      marginTop: 8, alignSelf: "center",
                      padding: "8px 20px", borderRadius: 8,
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#5A4E70",
                      fontFamily: "var(--font-label)", fontSize: 10, letterSpacing: "0.10em",
                      cursor: "pointer",
                    }}
                  >
                    RETAKE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Crate result panel ── all crate phases ── */}
        {isCratePhase && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              background: "rgba(10,8,14,0.98)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "14px 18px 6px",
                flexShrink: 0,
              }}
            >
              <button
                onClick={onCancel}
                aria-label="Close"
                style={{ background: "none", border: "none", color: "#5A4E70", cursor: "pointer", padding: 4, lineHeight: 1 }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <line x1={18} y1={6} x2={6} y2={18} />
                  <line x1={6} y1={6} x2={18} y2={18} />
                </svg>
              </button>
            </div>

            {/* Loading states */}
            {(phase.kind === "crate-scanning" || phase.kind === "crate-valuing") && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 20px 32px", position: "relative" }}>
                {/* Frozen camera frame dims behind the spinner */}
                {crateFullFrame && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={crateFullFrame} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.18 }} />
                  </div>
                )}
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  <CoinMarkSpinner />
                  <span
                    className="shelf-pulse"
                    style={{ color: "#f59e0b", fontFamily: "var(--font-label)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    {phase.kind === "crate-scanning"
                      ? "READING STRIPS…"
                      : `PRICING ${phase.items.length} RECORD${phase.items.length === 1 ? "" : "S"}…`}
                  </span>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#4b5563", textAlign: "center", maxWidth: 240 }}>
                    {phase.kind === "crate-scanning"
                      ? "Identifying each cover strip"
                      : "All results will need edition verification"}
                  </div>
                </div>
              </div>
            )}

            {/* Empty */}
            {phase.kind === "crate-empty" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "#C8C0D8" }}>nothing detected</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#5A4E70", lineHeight: 1.5 }}>
                  more light · hold closer · arm cover strips
                </div>
                <button
                  onClick={() => setPhase({ kind: "framing" })}
                  style={{ marginTop: 8, padding: "10px 28px", borderRadius: 10, background: "rgba(92,224,184,0.08)", border: "1px solid rgba(92,224,184,0.20)", color: "#5CE0B8", fontFamily: "var(--font-label)", fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", cursor: "pointer" }}
                >
                  RETAKE
                </button>
              </div>
            )}

            {/* Limit */}
            {phase.kind === "crate-limit" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#5CE0B8", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  scan limit reached
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#C8C0D8", lineHeight: 1.5, maxWidth: 260 }}>
                  You&apos;ve used {phase.used}/{phase.limit} shelf+crate scans this month.
                </div>
                <button onClick={onCancel} style={{ marginTop: 8, padding: "10px 28px", borderRadius: 10, background: "rgba(92,224,184,0.08)", border: "1px solid rgba(92,224,184,0.20)", color: "#5CE0B8", fontFamily: "var(--font-label)", fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", cursor: "pointer" }}>
                  CLOSE
                </button>
              </div>
            )}

            {/* Done: results — three-beat FLIP animation via CrateResultsStack */}
            {phase.kind === "crate-done" && (
              <CrateResultsStack
                sortedRows={crateSortedRows}
                crops={crateCrops}
                stripRects={crateStripRects}
                fullFrame={crateFullFrame}
                onRetry={() => {
                  setArmedSlots(new Set());
                  setJustArmedSlot(null);
                  setPhase({ kind: "framing" });
                }}
              />
            )}
          </div>
        )}

        {/* ── Camera feed ─────────────────────────────────────────── */}
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
            zIndex: 1,
          }}
        />

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

        {/* Vignette */}
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

        {/* ── Persistent close — top-left, camera/framing modes only ──
             (shelf/crate result panels render their own top-right close) */}
        {!isShelfPhase && !isCratePhase && (
        <button
          aria-label="Close scanner"
          onClick={onCancel}
          style={{
            position: "absolute",
            top: "calc(max(16px, env(safe-area-inset-top)) + 8px)",
            left: 16,
            zIndex: 50,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.38)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "50%",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            cursor: "pointer",
            color: "rgba(229,231,235,0.90)",
            padding: 0,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <line x1={18} y1={6} x2={6} y2={18} />
            <line x1={6} y1={6} x2={18} y2={18} />
          </svg>
        </button>
        )}

        {/* ── Mode toggle — BARCODE · ITEM · SHELF ────────────────── */}
        {phase.kind === "framing" && (
          <div
            style={{
              position: "absolute",
              top: "calc(max(16px, env(safe-area-inset-top)) + 8px)",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              zIndex: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                background: "rgba(0,0,0,0.45)",
                borderRadius: 10,
                padding: 3,
                gap: 1,
              }}
            >
              {(
                [
                  { key: "barcode", label: "BARCODE" },
                  { key: "vision", label: "ITEM" },
                  { key: "shelf", label: "SHELF" },
                  { key: "crate", label: "CRATE" },
                ] as const
              ).map(({ key, label }) => {
                const isActive = activeMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: 7,
                      border: "none",
                      background: isActive
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                      color: isActive ? "#e5e7eb" : "#5A4E70",
                      fontFamily: "var(--font-label)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "background 150ms ease, color 150ms ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Viewfinder ──────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "86vw",
            maxWidth: 440,
            aspectRatio: "4 / 3",
          }}
        >
          {phase.kind === "framing" && activeMode !== "crate" && (
            <>
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
                  boxShadow: `0 0 12px rgba(${accent.rgb}, 0.3), 0 0 24px rgba(${accent.rgb}, 0.1)`,
                  animation:
                    "scanLine 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
                }}
              />
              {[0.3, 0.2, 0.12].map((startAlpha, i) => (
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

          {/* Crate mode: fanned guide-slot overlay (replaces corner brackets) */}
          {phase.kind === "framing" && activeMode === "crate" && (
            <CrateOverlay
              armedSlots={armedSlots}
              justArmedSlot={justArmedSlot}
              slotRefs={slotRefs}
              onToggleSlot={(i) => {
                // Phase 2 will auto-detect covers from the live frame.
                // For Phase 1, user manually arms slots to mark which covers to process.
                setArmedSlots((prev) => {
                  const next = new Set(prev);
                  if (next.has(i)) {
                    next.delete(i); // disarm — no pulse
                  } else {
                    next.add(i);
                    setJustArmedSlot(i); // arm — one-shot pulse
                    setTimeout(() => setJustArmedSlot(null), 360);
                  }
                  haptic();
                  return next;
                });
              }}
            />
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

        {/* Inline error banner */}
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

        {/* ── Phase-specific middle content ───────────────────────── */}
        {phase.kind === "framing" && activeMode === "barcode" && (
          <div
            style={{
              marginTop: 24,
              fontFamily: "var(--font-label)",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            SCANNING UPC...
          </div>
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
          </div>
        )}

        {phase.kind === "submitting" && (
          <>
            <div
              style={{
                marginTop: 24,
                fontFamily: "var(--font-label)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {activeMode === "barcode" ? "ANALYZING COMPS..." : "IDENTIFYING ITEM..."}
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
          </div>
        )}

        {/* Camera-off fallback */}
        {phase.kind === "cameraError" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 32px",
              textAlign: "center",
            }}
          >
            <CameraOffIcon />
            <div
              style={{
                marginTop: 12,
                fontFamily: "var(--font-body)",
                fontSize: 15,
                color: "#C8C0D8",
              }}
            >
              camera unavailable
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#5A4E70",
              }}
            >
              check permissions in settings
            </div>
            <CancelButton
              onCancel={onCancel}
              label="GO BACK"
              marginTop={24}
            />
          </div>
        )}

        {/* Bottom gradient — vision / shelf / crate framing */}
        {phase.kind === "framing" &&
          (activeMode === "vision" || activeMode === "shelf" || activeMode === "crate") && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "35vh",
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.75) 100%)",
                zIndex: 5,
                pointerEvents: "none",
              }}
            />
          )}

        {/* Bottom action column */}
        {phase.kind !== "cameraError" && !isShelfPhase && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(88px + env(safe-area-inset-bottom))",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              zIndex: 20,
            }}
          >
            {phase.kind === "framing" && activeMode === "crate" && (
                <CrateCaptureButton
                  armedCount={armedSlots.size}
                  onTap={handleCrateCapture}
                />
              )}

              {phase.kind === "framing" &&
              (activeMode === "vision" || activeMode === "shelf") && (
                <>
                  <CaptureShutter
                    cameraReady={cameraReady}
                    onTap={handleCapture}
                  />
                  <div
                    style={{
                      fontFamily: "var(--font-label)",
                      fontSize: 9,
                      color: "#5A4E70",
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                    }}
                  >
                    {activeMode === "shelf" ? "FRAME THE SHELF" : "FRAME THE ITEM"}
                  </div>
                </>
              )}
            <CancelButton onCancel={onCancel} marginTop={0} />
          </div>
        )}
      </div>

      {/* Shelf item drill-down: VerdictSheet renders on top of the shelf results.
          Closing it returns to the shelf results unchanged. */}
      <VerdictSheet
        open={shelfVerdictOpen}
        onClose={() => setShelfVerdictOpen(false)}
        data={shelfVerdictData}
      />
    </>
  );
}
