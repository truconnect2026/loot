"use client";

import { useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type { ScanResponse } from "@/app/api/scan/route";
import type { ListingResponse } from "@/app/api/listing/route";

// Kept as an alias so existing imports keep working.
export type VerdictData = ScanResponse;

interface VerdictSheetProps {
  open: boolean;
  onClose: () => void;
  data: VerdictData | null;
}

const VERDICT_COLORS = {
  BUY: {
    text: "var(--accent-mint)",
    bg: "var(--accent-mint-surface)",
    border: "var(--accent-mint-border)",
    borderSolid: "var(--accent-mint)",
  },
  PASS: {
    text: "var(--accent-red)",
    bg: "var(--accent-red-surface)",
    border: "var(--accent-red-border)",
    borderSolid: "var(--accent-red)",
  },
  MAYBE: {
    text: "var(--accent-camel)",
    bg: "var(--accent-camel-surface)",
    border: "var(--accent-camel-border)",
    borderSolid: "var(--accent-camel)",
  },
};

function LightningIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-mint)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const recessedCell: React.CSSProperties = {
  backgroundColor: "var(--bg-recessed)",
  borderRadius: 10,
  padding: 12,
  textAlign: "center",
  boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
};

const smallRecessedCell: React.CSSProperties = {
  backgroundColor: "var(--bg-recessed)",
  borderRadius: 8,
  padding: 10,
  textAlign: "center",
  boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
};

const cellLabel: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 9,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 4,
};

interface ListingCtaProps {
  data: VerdictData;
}

function ListingCta({ data }: ListingCtaProps) {
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Resting: lit accent inset + soft outer accent halo. Press: full glow envelope.
  const restShadow =
    "inset 0 1px 0 0 rgba(92,224,184,0.20), 0 0 16px -4px rgba(92,224,184,0.30)";
  const pressShadow =
    "0 0 0 1px rgba(92,224,184,0.20), 0 0 24px -4px rgba(92,224,184,0.35), 0 0 60px -8px rgba(92,224,184,0.15)";

  async function handleGenerate() {
    if (loading || listing) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: data.name,
          sellPrice: data.sell,
          reasoning: data.reasoning,
        }),
      });
      const json = (await res.json()) as ListingResponse | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : `Failed (${res.status})`);
      } else {
        setListing(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!listing) return;
    const text = `${listing.title}\n\n${listing.description}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can fail in non-secure contexts — fall back to selection.
    }
  }

  if (listing) {
    // Inline panel — title + description + copy button.
    return (
      <div
        style={{
          marginTop: 16,
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.10em",
            color: "var(--text-muted)",
            marginBottom: 6,
          }}
        >
          FB MARKETPLACE LISTING
        </div>
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          {listing.title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 400,
            fontSize: 12,
            color: "var(--text-muted)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.45,
            marginBottom: 12,
          }}
        >
          {listing.description}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11,
              color: "var(--accent-mint)",
            }}
          >
            ${listing.suggestedPrice.toFixed(2)}
          </span>
          <button
            onClick={handleCopy}
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: 8,
              backgroundColor: copied
                ? "rgba(92,224,184,0.10)"
                : "rgba(255,255,255,0.04)",
              border: copied
                ? "1px solid rgba(92,224,184,0.25)"
                : "1px solid rgba(255,255,255,0.08)",
              color: copied ? "var(--accent-mint)" : "var(--text-primary)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.10em",
              cursor: "pointer",
              transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {copied ? "COPIED" : "COPY"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        marginTop: 16,
        width: "100%",
        background:
          "linear-gradient(180deg, rgba(92,224,184,0.12) 0%, rgba(92,224,184,0.06) 100%)",
        border: "1px solid rgba(92,224,184,0.15)",
        boxShadow: pressed ? pressShadow : restShadow,
        borderRadius: 12,
        padding: 14,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top-edge shine — light catching the leading edge */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -1,
          left: 12,
          right: 12,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          pointerEvents: "none",
        }}
      />
      {/* Soft radial halo behind the lightning icon */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 40,
          height: 40,
          top: "50%",
          // The icon sits left of center next to the label; nudge halo slightly
          // left of the absolute centerline so it tracks the icon.
          left: "calc(50% - 70px)",
          marginTop: -20,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(92,224,184,0.18), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative", zIndex: 1, display: "flex" }}>
        <LightningIcon />
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--accent-mint)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {loading ? "GENERATING..." : "GENERATE FB LISTING"}
      </span>
      {error && (
        <span
          style={{
            position: "absolute",
            bottom: -22,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "var(--accent-red)",
          }}
        >
          {error}
        </span>
      )}
    </button>
  );
}

export default function VerdictSheet({ open, onClose, data }: VerdictSheetProps) {
  if (!data) return null;

  const colors = VERDICT_COLORS[data.verdict];

  return (
    <BottomSheet open={open} onClose={onClose} borderColor={colors.borderSolid}>
      <div style={{ padding: "12px 20px 28px" }}>
        {/* Method label */}
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {data.method === "barcode" ? "UPC SCAN" : "AI VISION"}
        </div>

        {/* Item name */}
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 600,
            fontSize: 17,
            color: "var(--text-primary)",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {data.name}
        </div>

        {/* Verdict badge */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 700,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 20px",
            }}
          >
            {data.verdict}
          </div>
        </div>

        {/* 3-col price grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginTop: 16,
          }}
        >
          <div style={recessedCell}>
            <div style={cellLabel}>COST</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.cost}
            </div>
          </div>
          <div style={recessedCell}>
            <div style={cellLabel}>SELL</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--accent-mint)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.sell}
            </div>
          </div>
          <div style={recessedCell}>
            <div style={cellLabel}>PROFIT</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 22,
                color: colors.text,
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.profit}
            </div>
          </div>
        </div>

        {/* 2×2 detail grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 8,
          }}
        >
          <div style={smallRecessedCell}>
            <div style={cellLabel}>ROI</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {data.roi}%
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>PLATFORM</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
              }}
            >
              {data.platform}
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>FEE</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${data.fee}
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>CONFIDENCE</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 12,
                color:
                  data.confidence === "high"
                    ? "var(--accent-mint)"
                    : data.confidence === "low"
                      ? "var(--accent-red)"
                      : "var(--accent-camel)",
                textTransform: "uppercase",
              }}
            >
              {data.confidence}
            </div>
          </div>
        </div>

        {/* CTA — hero button with top-edge shine + glow on press */}
        <ListingCta data={data} />
      </div>
    </BottomSheet>
  );
}
