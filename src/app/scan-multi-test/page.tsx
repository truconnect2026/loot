"use client";

import { useRef, useState } from "react";
import type { MultiDetectItem, BatchValuation } from "@/lib/claude";

type Status = "idle" | "detecting" | "valuing" | "done" | "error";

const VERDICT_COLOR: Record<BatchValuation["verdict"], string> = {
  BUY: "#5CE0B8",
  MAYBE: "#F5C518",
  PASS: "#6b7280",
};

const DETECT_LABEL: Record<MultiDetectItem["confidence"], string> = {
  high: "hi",
  medium: "med",
  low: "lo",
};

const DOT_GRAY = "#4b5563";

async function toJpegDataUrl(file: File, maxDim = 1600): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function ScanMultiTestPage() {
  const imgRef = useRef<HTMLImageElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [status, setStatus] = useState<Status>("idle");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<MultiDetectItem[]>([]);
  const [valuations, setValuations] = useState<Map<number, BatchValuation>>(new Map());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgRenderedSize, setImgRenderedSize] = useState<{ w: number; h: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ rawLength: number; parsedCount: number } | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setDetectedItems([]);
    setValuations(new Map());
    setErrorMsg(null);
    setImgRenderedSize(null);
    setSelectedIndex(null);
    setDebugInfo(null);
    setRawText(null);
    setShowRaw(false);
    setStatus("detecting");

    // Re-encode to JPEG on the client: normalises format (HEIC, PNG, WebP →
    // JPEG) and downscales large phone photos so the upload is fast and the
    // Anthropic API always receives a declared type it accepts.
    let jpeg: string;
    try {
      jpeg = await toJpegDataUrl(file);
    } catch {
      setErrorMsg(
        "couldn't read that image format — try a JPEG or screenshot",
      );
      setStatus("error");
      return;
    }

    setImgSrc(jpeg);

    // Stage 1: detect
    let detected: MultiDetectItem[] = [];
    try {
      const res = await fetch("/api/scan-multi/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: jpeg }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Detection failed");
      detected = json.items ?? [];
      setDetectedItems(detected);
      if (json._debug) {
        setDebugInfo({ rawLength: json._debug.rawText?.length ?? 0, parsedCount: json._debug.parsedCount });
        setRawText(json._debug.rawText ?? null);
      }
    } catch (err) {
      setErrorMsg(
        `Detection failed: ${err instanceof Error ? err.message : "unknown"}`,
      );
      setStatus("error");
      return;
    }

    if (detected.length === 0) {
      setStatus("done");
      return;
    }

    // Stage 2: value
    setStatus("valuing");
    try {
      const res = await fetch("/api/scan-multi/value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: detected.map((it, i) => ({
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
      setValuations(map);
      setStatus("done");
    } catch (err) {
      setErrorMsg(
        `Valuation failed: ${err instanceof Error ? err.message : "unknown"}`,
      );
      setStatus("error");
    }
  }

  function onImgLoad() {
    const el = imgRef.current;
    if (!el) return;
    setImgRenderedSize({ w: el.clientWidth, h: el.clientHeight });
  }

  function handleDotClick(idx: number) {
    setSelectedIndex(idx === selectedIndex ? null : idx);
    rowRefs.current.get(idx)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleRowClick(idx: number) {
    setSelectedIndex(idx === selectedIndex ? null : idx);
  }

  const buyCount = [...valuations.values()].filter((v) => v.verdict === "BUY").length;
  const maybeCount = [...valuations.values()].filter((v) => v.verdict === "MAYBE").length;
  const passCount = [...valuations.values()].filter((v) => v.verdict === "PASS").length;

  const isActive = status === "detecting" || status === "valuing";

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: 24,
        fontFamily: "monospace",
        color: "#e5e7eb",
        background: "#111",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .pulse { animation: pulse 1.2s ease-in-out infinite; }
      `}</style>

      <h1 style={{ fontSize: 18, marginBottom: 4 }}>multi-detect test</h1>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
        diagnostic — not linked from the app
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={isActive}
        style={{ marginBottom: 20, display: "block", color: "#e5e7eb" }}
      />

      {/* Progress / summary line */}
      <div style={{ marginBottom: 16, fontSize: 13, minHeight: 20 }}>
        {status === "detecting" && (
          <span className="pulse" style={{ color: "#f59e0b" }}>
            ① reading the shelf…
          </span>
        )}
        {status === "valuing" && (
          <span>
            <span style={{ color: "#5CE0B8" }}>
              ✓ found {detectedItems.length} items
            </span>
            {"   "}
            <span className="pulse" style={{ color: "#f59e0b" }}>
              ② pricing them…
            </span>
          </span>
        )}
        {status === "done" && detectedItems.length > 0 && (
          <span>
            <strong>{detectedItems.length}</strong> detected ·{" "}
            <span style={{ color: VERDICT_COLOR.BUY }}>{buyCount} BUY</span> ·{" "}
            <span style={{ color: VERDICT_COLOR.MAYBE }}>{maybeCount} MAYBE</span> ·{" "}
            <span style={{ color: VERDICT_COLOR.PASS }}>{passCount} PASS</span>
          </span>
        )}
        {status === "done" && detectedItems.length === 0 && (
          <span style={{ color: "#6b7280" }}>
            no items detected
            {debugInfo && (
              <span style={{ marginLeft: 12, color: "#4b5563", fontSize: 11 }}>
                [rawLength={debugInfo.rawLength} parsedCount={debugInfo.parsedCount}]
              </span>
            )}
          </span>
        )}
        {status === "error" && (
          <span style={{ color: "#ef4444" }}>{errorMsg}</span>
        )}
      </div>

      {/* Raw response toggle — available as soon as detection has run */}
      {rawText !== null && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setShowRaw((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "#4b5563",
              fontSize: 11,
              cursor: "pointer",
              padding: 0,
              fontFamily: "monospace",
              textDecoration: "underline",
            }}
          >
            {showRaw ? "hide raw response" : "show raw response"}
          </button>
          {debugInfo && (
            <span style={{ marginLeft: 10, color: "#374151", fontSize: 10 }}>
              rawLen={debugInfo.rawLength} parsed={debugInfo.parsedCount}
            </span>
          )}
        </div>
      )}

      {showRaw && rawText !== null && (
        <pre
          style={{
            maxHeight: 300,
            overflow: "auto",
            background: "#0a0a0a",
            border: "1px solid #1f2937",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 10,
            color: "#6b7280",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginBottom: 20,
          }}
        >
          raw model response:{"\n"}{rawText}
        </pre>
      )}

      {imgSrc && (
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 24,
            maxWidth: "100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imgSrc}
            alt="uploaded"
            onLoad={onImgLoad}
            style={{ maxWidth: "100%", display: "block" }}
          />

          {imgRenderedSize &&
            detectedItems.map((item, idx) => {
              const [bx, by, bw, bh] = item.bbox;
              const cx = (bx + bw / 2) * imgRenderedSize.w;
              const cy = (by + bh / 2) * imgRenderedSize.h;
              const val = valuations.get(idx);
              const color = val ? VERDICT_COLOR[val.verdict] : DOT_GRAY;
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  aria-label={`Item ${idx + 1}: ${item.name}`}
                  style={{
                    position: "absolute",
                    left: cx,
                    top: cy,
                    transform: `translate(-50%, -50%) scale(${isSelected ? 1.4 : 1})`,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: color,
                    color: color === DOT_GRAY ? "#9ca3af" : "#000",
                    fontSize: 10,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isSelected
                      ? `0 0 0 3px #fff, 0 0 12px 4px ${color}`
                      : "0 1px 3px rgba(0,0,0,0.6)",
                    transition:
                      "background 300ms ease, transform 150ms ease, box-shadow 150ms ease",
                    zIndex: isSelected ? 10 : 5,
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
        </div>
      )}

      {detectedItems.length > 0 && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {detectedItems.map((item, idx) => {
              const val = valuations.get(idx);
              const color = val ? VERDICT_COLOR[val.verdict] : DOT_GRAY;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  ref={(el) => {
                    if (el) rowRefs.current.set(idx, el);
                    else rowRefs.current.delete(idx);
                  }}
                  onClick={() => handleRowClick(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderLeft: `3px solid ${color}`,
                    background: isSelected
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.02)",
                    borderRadius: "0 6px 6px 0",
                    cursor: "pointer",
                    transition: "background 120ms ease, border-color 300ms ease",
                  }}
                >
                  {/* Number dot */}
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: color,
                      color: color === DOT_GRAY ? "#9ca3af" : "#000",
                      fontSize: 10,
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 300ms ease",
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* Name */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </span>

                  {/* Verdict pill — placeholder while valuing */}
                  {val ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: "bold",
                        color,
                        border: `1px solid ${color}`,
                        borderRadius: 4,
                        padding: "1px 5px",
                        flexShrink: 0,
                      }}
                    >
                      {val.verdict}
                    </span>
                  ) : (
                    <span
                      className={status === "valuing" ? "pulse" : undefined}
                      style={{ fontSize: 10, color: "#4b5563", flexShrink: 0 }}
                    >
                      …
                    </span>
                  )}

                  {/* Sell price */}
                  <span
                    style={{
                      fontSize: 11,
                      color: "#d1d5db",
                      flexShrink: 0,
                      minWidth: 56,
                      textAlign: "right",
                    }}
                  >
                    {val && val.sellPrice > 0 ? `$${val.sellPrice}` : "—"}
                  </span>

                  {/* Detect confidence tag */}
                  <span
                    style={{
                      fontSize: 9,
                      color: "#4b5563",
                      flexShrink: 0,
                      minWidth: 20,
                      textAlign: "right",
                    }}
                  >
                    {DETECT_LABEL[item.confidence]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Reasoning callout for selected item */}
          {selectedIndex !== null &&
            valuations.get(selectedIndex)?.reasoning && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#9ca3af",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#6b7280", marginRight: 6 }}>
                  #{selectedIndex + 1}
                </span>
                {valuations.get(selectedIndex)!.reasoning}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
