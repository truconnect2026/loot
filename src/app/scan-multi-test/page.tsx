"use client";

import { useRef, useState } from "react";
import type { ScanMultiTestItem } from "@/app/api/scan-multi-test/route";

const VERDICT_COLOR: Record<ScanMultiTestItem["verdict"], string> = {
  BUY: "#5CE0B8",
  MAYBE: "#F5C518",
  PASS: "#6b7280",
};

const DETECT_LABEL: Record<ScanMultiTestItem["detectConfidence"], string> = {
  high: "hi",
  medium: "med",
  low: "lo",
};

export default function ScanMultiTestPage() {
  const imgRef = useRef<HTMLImageElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [items, setItems] = useState<ScanMultiTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgRenderedSize, setImgRenderedSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setItems([]);
    setError(null);
    setImgRenderedSize(null);
    setSelectedIndex(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setImgSrc(dataUrl);

      setLoading(true);
      try {
        const res = await fetch("/api/scan-multi-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Request failed");
        setItems(json.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
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

  const buyCount = items.filter((i) => i.verdict === "BUY").length;
  const maybeCount = items.filter((i) => i.verdict === "MAYBE").length;
  const passCount = items.filter((i) => i.verdict === "PASS").length;

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
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>multi-detect test</h1>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
        diagnostic — not linked from the app
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ marginBottom: 20, display: "block", color: "#e5e7eb" }}
      />

      {loading && (
        <p style={{ color: "#f59e0b", marginBottom: 16 }}>
          detecting + valuating all items…
        </p>
      )}
      {error && (
        <p style={{ color: "#ef4444", marginBottom: 16 }}>error: {error}</p>
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
            items.map((item, idx) => {
              const [bx, by, bw, bh] = item.bbox;
              const cx = (bx + bw / 2) * imgRenderedSize.w;
              const cy = (by + bh / 2) * imgRenderedSize.h;
              const color = VERDICT_COLOR[item.verdict];
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
                    color: "#000",
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
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                    zIndex: isSelected ? 10 : 5,
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
        </div>
      )}

      {items.length > 0 && (
        <div>
          <p style={{ marginBottom: 12, fontSize: 13 }}>
            <strong>{items.length}</strong> detected ·{" "}
            <span style={{ color: VERDICT_COLOR.BUY }}>{buyCount} BUY</span> ·{" "}
            <span style={{ color: VERDICT_COLOR.MAYBE }}>{maybeCount} MAYBE</span> ·{" "}
            <span style={{ color: VERDICT_COLOR.PASS }}>{passCount} PASS</span>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item, idx) => {
              const color = VERDICT_COLOR[item.verdict];
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
                    transition: "background 120ms ease",
                  }}
                >
                  {/* Number */}
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: color,
                      color: "#000",
                      fontSize: 10,
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
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

                  {/* Verdict pill */}
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
                    {item.verdict}
                  </span>

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
                    {item.sellPrice > 0 ? `$${item.sellPrice}` : "—"}
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
                    {DETECT_LABEL[item.detectConfidence]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Reasoning for selected item */}
          {selectedIndex !== null && items[selectedIndex]?.reasoning && (
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
              {items[selectedIndex].reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
