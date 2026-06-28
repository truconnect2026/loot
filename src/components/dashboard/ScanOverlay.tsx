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
import type { MultiDetectItem, BatchValuation } from "@/lib/claude";
import VerdictSheet from "@/components/dashboard/VerdictSheet";

export interface VerdictPayload extends ScanResponse {
  capturedImage?: string | null;
}

interface ScanOverlayProps {
  open: boolean;
  mode: "barcode" | "vision" | "shelf";
  onResult: (verdict: VerdictPayload) => void;
  onCancel: () => void;
  onPaywall?: (info: { used: number; limit: number }) => void;
}

const ACCENT = {
  barcode: { hex: "#5CE0B8", rgb: "92,224,184" },
  vision: { hex: "#D4A574", rgb: "212,165,116" },
  shelf: { hex: "#5CE0B8", rgb: "92,224,184" },
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
  renderedSize: { w: number; h: number },
  radius = 28,
): DotCluster[] {
  const VERDICT_PRIORITY: Record<string, number> = { BUY: 0, MAYBE: 1, PASS: 2 };
  const points = items.map((item, idx) => {
    const [bx, by, bw, bh] = item.bbox;
    return {
      idx,
      cx: (bx + bw / 2) * renderedSize.w,
      cy: Math.min(Math.max((by + bh / 2) * renderedSize.h, 12), renderedSize.h - 12),
    };
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
  // Shelf phases — two-stage detect then value.
  | { kind: "shelf-detecting"; capturedImage: string }
  | { kind: "shelf-valuing"; capturedImage: string; items: MultiDetectItem[] }
  | {
      kind: "shelf-done";
      capturedImage: string;
      items: MultiDetectItem[];
      valuations: Map<number, BatchValuation>;
    }
  | { kind: "shelf-empty"; capturedImage: string };

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
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"barcode" | "vision" | "shelf">(mode);

  // Shelf-specific overlay UI state — separate from phase so they survive
  // the valuing→done transition without resetting.
  const shelfImgRef = useRef<HTMLImageElement>(null);
  const shelfRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [shelfSelectedIndex, setShelfSelectedIndex] = useState<number | null>(null);
  const [shelfImgRenderedSize, setShelfImgRenderedSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [shelfItemCostInput, setShelfItemCostInput] = useState("");
  const [shelfVerdictLoading, setShelfVerdictLoading] = useState(false);
  const [shelfVerdictOpen, setShelfVerdictOpen] = useState(false);
  const [shelfVerdictData, setShelfVerdictData] = useState<VerdictPayload | null>(null);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<"ALL" | "BUY" | "MAYBE" | "PASS">("ALL");
  const [hasCopied, setHasCopied] = useState(false);

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
    /* eslint-enable react-hooks/set-state-in-effect */
    shelfRowRefs.current.clear();
    cameraReadyRef.current = false;
    let cancelled = false;

    cameraTimeoutRef.current = setTimeout(() => {
      if (cancelled) return;
      if (!cameraReadyRef.current) {
        flagError("camera-timeout", "video did not reach playing state");
        setPhase({ kind: "cameraError" });
      }
    }, 6000);

    const video = videoRef.current;
    const onVideoError = () => {
      if (cancelled) return;
      flagError("video-element-error", "video error event");
      setPhase({ kind: "cameraError" });
    };
    if (video) video.addEventListener("error", onVideoError);

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

  // Switch active mode within an open session.
  const switchMode = (m: "barcode" | "vision" | "shelf") => {
    if (m === activeMode) return;
    setPhase({ kind: "framing" });
    setInlineError(null);
    setShelfSelectedIndex(null);
    setShelfImgRenderedSize(null);
    setExpandedLots(new Set());
    setActiveFilter("ALL");
    shelfRowRefs.current.clear();
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

  // Two-stage shelf scan: detect → value.
  // Reuses /api/scan-multi/detect and /api/scan-multi/value unchanged.
  const handleShelfCapture = async (image: string) => {
    setShelfSelectedIndex(null);
    setShelfImgRenderedSize(null);
    setExpandedLots(new Set());
    setActiveFilter("ALL");
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

  // Derived shelf values — used in shelf-valuing and shelf-done render.
  const isShelfPhase =
    phase.kind === "shelf-detecting" ||
    phase.kind === "shelf-valuing" ||
    phase.kind === "shelf-done" ||
    phase.kind === "shelf-empty";

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
    const stripLot = (name: string) =>
      name.replace(/\s*\(full set,\s*\d+\s*vols?\)\s*$/i, "");
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
        text += `\n- ${stripLot(v.name)}${r ? ` · ${r}` : ""}${v.platform ? ` · ${v.platform}` : ""}`;
      }
    }
    if (maybe.length > 0) {
      text += "\n\nMAYBE:";
      for (const v of maybe) {
        const r = fmtRange(v);
        text += `\n- ${stripLot(v.name)}${r ? ` · ${r}` : ""}`;
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

            {/* Done: headline hero + image with clustered dots + sorted list */}
            {phase.kind === "shelf-done" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Hero headline + COPY HAUL + filter chips */}
                <div style={{ padding: "0 18px 10px", flexShrink: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>
                      {activeFilter === "MAYBE" ? (
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#F5C518",
                            lineHeight: 1.2,
                          }}
                        >
                          {headlineCount} maybe
                        </div>
                      ) : activeFilter === "PASS" ? (
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#6b7280",
                            lineHeight: 1.2,
                          }}
                        >
                          {headlineCount} pass
                        </div>
                      ) : headlineCount > 0 ? (
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#5CE0B8",
                            lineHeight: 1.2,
                          }}
                        >
                          {headlineCount} worth grabbing
                        </div>
                      ) : (
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#C8C0D8",
                            lineHeight: 1.2,
                          }}
                        >
                          nothing worth grabbing
                        </div>
                      )}
                      <div
                        style={{
                          fontFamily: "var(--font-label)",
                          fontSize: 11,
                          color: "#6b7280",
                          marginTop: 3,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {heroMaybeCount} maybe · {heroPassCount} pass ·{" "}
                        {shelfItems.length} items
                      </div>
                      {showResaleLine && (
                        <div
                          style={{
                            fontFamily: "var(--font-label)",
                            fontSize: 10,
                            color: "#4b5563",
                            marginTop: 2,
                            letterSpacing: "0.04em",
                          }}
                        >
                          ~${headlineSumLow}–${headlineSumHigh} resale
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => void copyHaul()}
                      style={{
                        flexShrink: 0,
                        marginTop: 2,
                        padding: "5px 10px",
                        borderRadius: 8,
                        background: hasCopied
                          ? "rgba(92,224,184,0.15)"
                          : "rgba(255,255,255,0.05)",
                        border: hasCopied
                          ? "1px solid rgba(92,224,184,0.40)"
                          : "1px solid rgba(255,255,255,0.10)",
                        color: hasCopied ? "#5CE0B8" : "#5A4E70",
                        fontFamily: "var(--font-label)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 200ms ease",
                      }}
                    >
                      {hasCopied ? "COPIED ✓" : "COPY HAUL"}
                    </button>
                  </div>
                  {/* Filter chips: ALL · BUY · MAYBE · PASS */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {(["ALL", "BUY", "MAYBE", "PASS"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 12,
                          background:
                            activeFilter === f
                              ? "#5CE0B8"
                              : "rgba(255,255,255,0.05)",
                          border:
                            activeFilter === f
                              ? "none"
                              : "1px solid rgba(255,255,255,0.10)",
                          color: activeFilter === f ? "#000" : "#6b7280",
                          fontFamily: "var(--font-label)",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image with clustered verdict dots */}
                <div
                  style={{ position: "relative", width: "100%", flexShrink: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={shelfImgRef}
                    src={phase.capturedImage}
                    alt="shelf"
                    onLoad={() => {
                      const el = shelfImgRef.current;
                      if (!el) return;
                      setShelfImgRenderedSize({
                        w: el.clientWidth,
                        h: el.clientHeight,
                      });
                    }}
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
                              setShelfSelectedIndex(
                                targetIdx === shelfSelectedIndex
                                  ? null
                                  : targetIdx,
                              );
                              // Auto-expand lot if this is a member dot
                              const clickedVal = shelfValuations.get(targetIdx);
                              if (
                                clickedVal?.groupRole === "lot-member" &&
                                clickedVal.groupId
                              ) {
                                setExpandedLots((prev) =>
                                  new Set([...prev, clickedVal.groupId!]),
                                );
                              }
                            } else {
                              setShelfSelectedIndex(targetIdx);
                            }
                            shelfRowRefs.current
                              .get(targetIdx)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                              });
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
                            color:
                              cluster.color === SHELF_DOT_GRAY
                                ? "#9ca3af"
                                : "#000",
                            fontSize: isSingle ? 10 : 9,
                            fontWeight: "bold",
                            fontFamily: "monospace",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isSel
                              ? `0 0 0 3px #fff, 0 0 12px 4px ${cluster.color}`
                              : "0 1px 3px rgba(0,0,0,0.6)",
                            transition:
                              "background 300ms ease, transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease",
                            opacity: clusterMatchesFilter ? 1 : 0.25,
                            zIndex: isSel ? 10 : 5,
                          }}
                        >
                          {isSingle ? detIdx + 1 : `+${cluster.indices.length}`}
                        </button>
                      );
                    })}
                </div>

                {/* Sorted item list — BUY → MAYBE → PASS, members collapsed */}
                <div
                  style={{
                    padding: "8px 12px 32px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {filteredMain.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 0",
                        textAlign: "center",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "#4b5563",
                      }}
                    >
                      no {activeFilter.toLowerCase()} items
                    </div>
                  ) : filteredMain.map((val) => {
                    const detIdx = val.index;
                    const isSel = shelfSelectedIndex === detIdx;
                    const color = SHELF_VERDICT_COLOR[val.verdict];
                    const isAnchor = val.groupRole === "lot-anchor";
                    const isExpanded =
                      isAnchor && val.groupId
                        ? expandedLots.has(val.groupId)
                        : false;
                    const members =
                      isAnchor && val.groupId
                        ? [...shelfValuations.values()].filter(
                            (v) =>
                              v.groupRole === "lot-member" &&
                              v.groupId === val.groupId,
                          )
                        : [];

                    const priceStr =
                      val.resaleLow > 0 && val.resaleHigh > 0
                        ? `$${val.resaleLow}–$${val.resaleHigh}`
                        : val.estResale > 0
                          ? `$${val.estResale}`
                          : "—";

                    // Strip the "(full set, N vols)" suffix the grouper appended
                    const displayName = isAnchor
                      ? val.name.replace(
                          /\s*\(full set,\s*\d+\s*vols?\)\s*$/i,
                          "",
                        )
                      : val.name;

                    return (
                      <div key={detIdx}>
                        {/* Main row — two lines */}
                        <div
                          ref={(el) => {
                            if (el) shelfRowRefs.current.set(detIdx, el);
                            else shelfRowRefs.current.delete(detIdx);
                          }}
                          onClick={() =>
                            setShelfSelectedIndex(isSel ? null : detIdx)
                          }
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "7px 10px",
                            borderLeft: `3px solid ${color}`,
                            background: isSel
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(255,255,255,0.02)",
                            borderRadius: "0 6px 6px 0",
                            cursor: "pointer",
                            transition:
                              "background 120ms ease, border-color 300ms ease",
                            gap: 3,
                          }}
                        >
                          {/* Line 1: dot · name · lot chip · pill · price */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: color,
                                color: "#000",
                                fontSize: 9,
                                fontWeight: "bold",
                                fontFamily: "monospace",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {detIdx + 1}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                fontFamily: "var(--font-body)",
                                fontSize: 13,
                                color: "#C8C0D8",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {displayName}
                            </span>
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
                                  background: "rgba(92,224,184,0.10)",
                                  border: "1px solid rgba(92,224,184,0.25)",
                                  borderRadius: 4,
                                  color: "#5CE0B8",
                                  fontFamily: "var(--font-label)",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: "0.06em",
                                  padding: "2px 6px",
                                  cursor: "pointer",
                                  lineHeight: 1.4,
                                }}
                              >
                                {members.length + 1} vols{" "}
                                {isExpanded ? "▾" : "▸"}
                              </button>
                            )}
                            {val.needsVerify ? (
                              <span
                                style={{
                                  flexShrink: 0,
                                  fontSize: 9,
                                  fontWeight: "bold",
                                  fontFamily: "var(--font-label)",
                                  color: "#f59e0b",
                                  border: "1px solid rgba(245,158,11,0.5)",
                                  borderRadius: 4,
                                  padding: "1px 5px",
                                }}
                              >
                                VERIFY
                              </span>
                            ) : (
                              <span
                                style={{
                                  flexShrink: 0,
                                  fontSize: 9,
                                  fontWeight: "bold",
                                  fontFamily: "var(--font-label)",
                                  color,
                                  border: `1px solid ${color}`,
                                  borderRadius: 4,
                                  padding: "1px 5px",
                                }}
                              >
                                {val.verdict}
                              </span>
                            )}
                            <span
                              style={{
                                flexShrink: 0,
                                fontFamily: "var(--font-label)",
                                fontSize: 11,
                                color: "#9ca3af",
                                minWidth: 56,
                                textAlign: "right",
                              }}
                            >
                              {priceStr}
                            </span>
                          </div>

                          {/* Line 2: sell speed · demand · platform */}
                          <div
                            style={{
                              paddingLeft: 28,
                              fontFamily: "var(--font-label)",
                              fontSize: 10,
                              color: "#4b5563",
                              letterSpacing: "0.04em",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {val.sellSpeed} · {val.demand} demand ·{" "}
                            {val.platform}
                          </div>
                        </div>

                        {/* Expanded lot members — indented, dimmed, read-only */}
                        {isExpanded &&
                          members.map((member) => (
                            <div
                              key={member.index}
                              ref={(el) => {
                                if (el)
                                  shelfRowRefs.current.set(member.index, el);
                                else
                                  shelfRowRefs.current.delete(member.index);
                              }}
                              style={{
                                marginLeft: 16,
                                padding: "4px 10px",
                                borderLeft:
                                  "2px solid rgba(92,224,184,0.15)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                opacity: 0.5,
                              }}
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  background: "rgba(92,224,184,0.20)",
                                  color: "#5CE0B8",
                                  fontSize: 8,
                                  fontWeight: "bold",
                                  fontFamily: "monospace",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {member.index + 1}
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  fontFamily: "var(--font-body)",
                                  fontSize: 12,
                                  color: "#9ca3af",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {member.name}
                              </span>
                              <span
                                style={{
                                  fontFamily: "var(--font-label)",
                                  fontSize: 10,
                                  color: "#4b5563",
                                  flexShrink: 0,
                                }}
                              >
                                {member.resaleLow > 0 && member.resaleHigh > 0
                                  ? `$${member.resaleLow}–$${member.resaleHigh}`
                                  : member.estResale > 0
                                    ? `$${member.estResale}`
                                    : "—"}
                              </span>
                            </div>
                          ))}

                        {/* Full verdict callout for selected row */}
                        {isSel && (
                          <div
                            style={{
                              marginTop: 4,
                              padding: "10px 12px",
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 6,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {val.reasoning && (
                              <div
                                style={{
                                  fontFamily: "var(--font-body)",
                                  fontSize: 12,
                                  color: "#6b7280",
                                  lineHeight: 1.5,
                                }}
                              >
                                <span
                                  style={{
                                    color: "#4b5563",
                                    marginRight: 6,
                                  }}
                                >
                                  #{detIdx + 1}
                                </span>
                                {val.reasoning}
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 36,
                                  backgroundColor: "rgba(0,0,0,0.3)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                                  borderRadius: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 10,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: 13,
                                    color: "#5A4E70",
                                    marginRight: 4,
                                  }}
                                >
                                  $
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min="0"
                                  value={shelfItemCostInput}
                                  onChange={(e) =>
                                    setShelfItemCostInput(e.target.value)
                                  }
                                  placeholder="your cost"
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
                              </div>
                              <button
                                onClick={() => {
                                  const item = shelfItems[detIdx];
                                  if (item)
                                    void handleFullVerdict(detIdx, item);
                                }}
                                disabled={shelfVerdictLoading}
                                style={{
                                  height: 36,
                                  padding: "0 14px",
                                  borderRadius: 8,
                                  background: shelfVerdictLoading
                                    ? "rgba(92,224,184,0.05)"
                                    : "rgba(92,224,184,0.10)",
                                  border: "1px solid rgba(92,224,184,0.25)",
                                  color: "#5CE0B8",
                                  fontFamily: "var(--font-label)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: "0.08em",
                                  cursor: shelfVerdictLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: shelfVerdictLoading ? 0.6 : 1,
                                  whiteSpace: "nowrap",
                                  transition:
                                    "opacity 150ms ease, background 150ms ease",
                                }}
                              >
                                {shelfVerdictLoading ? "…" : "FULL VERDICT"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => setPhase({ kind: "framing" })}
                    style={{
                      marginTop: 8,
                      alignSelf: "center",
                      padding: "8px 20px",
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#5A4E70",
                      fontFamily: "var(--font-label)",
                      fontSize: 10,
                      letterSpacing: "0.10em",
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
                gap: 2,
              }}
            >
              {(
                [
                  { key: "barcode", label: "BARCODE" },
                  { key: "vision", label: "ITEM" },
                  { key: "shelf", label: "SHELF" },
                ] as const
              ).map(({ key, label }) => {
                const isActive = activeMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 7,
                      border: "none",
                      background: isActive
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                      color: isActive ? "#e5e7eb" : "#5A4E70",
                      fontFamily: "var(--font-label)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      transition: "background 150ms ease, color 150ms ease",
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
          {phase.kind === "framing" && (
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
              {activeMode === "barcode" ? "ANALYZING COMPS..." : "AI IDENTIFYING..."}
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

        {/* Bottom gradient — vision / shelf framing only */}
        {phase.kind === "framing" &&
          (activeMode === "vision" || activeMode === "shelf") && (
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
              bottom:
                "calc(max(24px, env(safe-area-inset-bottom)) + 12px)",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              zIndex: 20,
            }}
          >
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
