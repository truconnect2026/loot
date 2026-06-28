"use client";

import { useRef, useState } from "react";
import type { MultiDetectItem } from "@/lib/claude";

const CONF_COLOR: Record<MultiDetectItem["confidence"], string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#9ca3af",
};

export default function ScanMultiTestPage() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [items, setItems] = useState<MultiDetectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [imgRenderedSize, setImgRenderedSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setItems([]);
    setError(null);
    setImgNaturalSize(null);
    setImgRenderedSize(null);

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
    setImgNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
    setImgRenderedSize({ w: el.clientWidth, h: el.clientHeight });
  }

  const high = items.filter((i) => i.confidence === "high").length;
  const medium = items.filter((i) => i.confidence === "medium").length;
  const low = items.filter((i) => i.confidence === "low").length;

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
        <p style={{ color: "#f59e0b", marginBottom: 16 }}>detecting…</p>
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
            imgNaturalSize &&
            items.map((item, idx) => {
              const [bx, by, bw, bh] = item.bbox;
              const left = bx * imgRenderedSize.w;
              const top = by * imgRenderedSize.h;
              const width = bw * imgRenderedSize.w;
              const height = bh * imgRenderedSize.h;
              const color = CONF_COLOR[item.confidence];
              return (
                <div key={idx}>
                  <div
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width,
                      height,
                      border: `2px solid ${color}`,
                      boxSizing: "border-box",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left,
                      top: top - 18,
                      background: color,
                      color: "#000",
                      fontSize: 10,
                      padding: "1px 4px",
                      borderRadius: 2,
                      whiteSpace: "nowrap",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      pointerEvents: "none",
                    }}
                  >
                    {item.name}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {items.length > 0 && (
        <div>
          <p style={{ marginBottom: 12, fontSize: 13 }}>
            <strong>{items.length}</strong> detected —{" "}
            <span style={{ color: CONF_COLOR.high }}>{high} high</span> /{" "}
            <span style={{ color: CONF_COLOR.medium }}>{medium} medium</span> /{" "}
            <span style={{ color: CONF_COLOR.low }}>{low} low</span>
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ color: "#6b7280", textAlign: "left" }}>
                <th style={{ padding: "4px 8px", borderBottom: "1px solid #333" }}>#</th>
                <th style={{ padding: "4px 8px", borderBottom: "1px solid #333" }}>name</th>
                <th style={{ padding: "4px 8px", borderBottom: "1px solid #333" }}>brand</th>
                <th style={{ padding: "4px 8px", borderBottom: "1px solid #333" }}>category</th>
                <th style={{ padding: "4px 8px", borderBottom: "1px solid #333" }}>conf</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "4px 8px", color: "#6b7280" }}>{idx + 1}</td>
                  <td style={{ padding: "4px 8px" }}>{item.name}</td>
                  <td style={{ padding: "4px 8px", color: "#9ca3af" }}>{item.brand || "—"}</td>
                  <td style={{ padding: "4px 8px", color: "#9ca3af" }}>{item.category || "—"}</td>
                  <td
                    style={{
                      padding: "4px 8px",
                      color: CONF_COLOR[item.confidence],
                      fontWeight: "bold",
                    }}
                  >
                    {item.confidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
