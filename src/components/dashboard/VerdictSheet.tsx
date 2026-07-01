"use client";

import { useState, useEffect } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type { ScanResponse } from "@/app/api/scan/route";
import type { ListingResponse } from "@/app/api/listing/route";
import { formatErrorMessage } from "@/lib/formatError";
import { saveHaul } from "@/lib/hauls";

// VerdictData = API ScanResponse + the client-captured thumbnail.
// The thumbnail is grabbed in ScanOverlay (UPC: at decode time;
// AI Vision: at the user's shutter tap) and never round-trips
// through /api/scan, so it lives on the client-side envelope only.
export interface VerdictData extends ScanResponse {
  capturedImage?: string | null;
}

// Whole numbers render as "$35"; fractional values keep two decimals.
function fmt(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

interface VerdictSheetProps {
  open: boolean;
  onClose: () => void;
  data: VerdictData | null;
  /** Optional callback fired by the inline "GRADE CONDITION" button —
   * the parent (dashboard) opens ConditionGradeSheet with this. Left
   * undefined keeps the button hidden. */
  onGradeCondition?: () => void;
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

// Uppercase verdict-cell labels (COST / SELL / PROFIT / ROI / PLATFORM /
// FEE / CONFIDENCE) — stay mono per the font role system.
const cellLabel: React.CSSProperties = {
  fontFamily: "var(--font-label)",
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
            fontFamily: "var(--font-body)",
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
            fontFamily: "var(--font-body)",
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
            fontFamily: "var(--font-body)",
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
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--accent-mint)",
            }}
          >
            {fmt(listing.suggestedPrice)}
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
              fontFamily: "var(--font-body)",
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
        overflow: "hidden",
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
      {/* Premium shimmer sweep — translates a soft white gradient
          across the button surface every 3s. overflow:hidden on the
          parent clips it cleanly to the rounded edges. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "30%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          animation: "ctaShimmer 3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

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
          fontFamily: "var(--font-body)",
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
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "var(--accent-red)",
          }}
        >
          {formatErrorMessage(error)}
        </span>
      )}
    </button>
  );
}

// Save-to-haul button — flips to "SAVED ✓" for the sheet's lifetime.
// Ghost/secondary so it doesn't compete with the primary listing CTA.
function SaveHaulButton({ data }: { data: VerdictData }) {
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saved || saving) return;
    setSaving(true);
    const result = await saveHaul({
      name:            data.name,
      buy_price:       data.cost,
      est_resale_low:  data.sell,
      est_resale_high: data.sell,
      verdict:         data.verdict.toLowerCase() as "buy" | "maybe" | "pass",
      source:          "scan_single",
    });
    setSaving(false);
    if (result.ok) setSaved(true);
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saved || saving}
      style={{
        marginTop: 10,
        width: "100%",
        padding: "9px 12px",
        borderRadius: 8,
        backgroundColor: saved ? "rgba(92,224,184,0.06)" : "transparent",
        border: saved
          ? "1px solid rgba(92,224,184,0.22)"
          : "1px solid rgba(255,255,255,0.10)",
        color: saved ? "#5CE0B8" : "var(--text-muted)",
        fontFamily: "var(--font-label)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        cursor: saved ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {saved ? "✓  SAVED TO HAUL" : saving ? "SAVING…" : "SAVE TO HAUL"}
    </button>
  );
}

// Platform-name → brand color for the leading dot on each WHERE TO
// SELL row. Falls back to plum if Claude returns a platform we don't
// have a brand color for (e.g. local OfferUp variants).
function brandDot(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("facebook") || p.includes("fb")) return "#1877F2";
  if (p.includes("ebay")) return "#E53238";
  if (p.includes("poshmark")) return "#C83271";
  if (p.includes("mercari")) return "#4DC0E8";
  return "#5A4E70";
}

function PlatformRanking({
  entries,
}: {
  entries: Array<{
    platform: string;
    estimatedNetProfit: number;
    reasoning: string;
  }>;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 9,
          color: "#5A4E70",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        WHERE TO SELL
      </div>
      {entries.map((e, idx) => {
        const isBest = idx === 0;
        const dotColor = brandDot(e.platform);
        return (
          <div
            key={`${e.platform}-${idx}`}
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: 44,
              padding: "8px 12px",
              borderRadius: 10,
              marginBottom: 6,
              backgroundColor: isBest
                ? "rgba(92,224,184,0.06)"
                : "rgba(255,255,255,0.02)",
              border: isBest
                ? "1px solid rgba(92,224,184,0.10)"
                : "1px solid rgba(255,255,255,0.04)",
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: dotColor,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "#C8C0D8",
                  lineHeight: 1.2,
                }}
              >
                {e.platform}
                {isBest && (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: 7,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      color: "#5CE0B8",
                      backgroundColor: "rgba(92,224,184,0.10)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    BEST
                  </span>
                )}
              </div>
              {e.reasoning && (
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    color: "#5A4E70",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.reasoning}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 13,
                fontWeight: 700,
                color: isBest ? "#5CE0B8" : "#C8C0D8",
                fontFeatureSettings: '"tnum"',
                flexShrink: 0,
              }}
            >
              {fmt(e.estimatedNetProfit)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface CompItem {
  price: number;
  source: string;
  label: "sold" | "listed";
  date?: string;
}

interface CompsResult {
  items: CompItem[];
  low: number;
  high: number;
  median: number;
  count: number;
}

type CompsState = CompsResult | null | "loading";

export default function VerdictSheet({
  open,
  onClose,
  data,
  onGradeCondition,
}: VerdictSheetProps) {
  const [comps, setComps] = useState<CompsState>("loading");

  useEffect(() => {
    if (!open || !data) {
      setComps("loading");
      return;
    }
    setComps("loading");
    const name = data.name;
    fetch("/api/comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemName: name }),
    })
      .then((r) => r.json())
      .then((j: { comps: CompsResult | null }) => setComps(j.comps ?? null))
      .catch(() => setComps(null));
  }, [open, data?.name]);

  if (!data) return null;

  const colors = VERDICT_COLORS[data.verdict];

  return (
    <BottomSheet open={open} onClose={onClose} borderColor={colors.borderSolid}>
      <style>{`
        @keyframes verdictPillIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes verdictStatRise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ctaShimmer {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
      <div
        style={{
          padding: "12px 20px 28px",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Thumbnail — the frame the user actually scanned. Gives the
            verdict a visual anchor instead of free-floating numbers.
            Hidden when the scanner couldn't grab a frame (rare;
            captureFrame failures are silenced upstream). */}
        {data.capturedImage && (
          <div
            style={{
              width: "100%",
              maxHeight: 120,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 12,
              // "Printed photo" recess — outer drop + inset top
              // shadow gives the thumbnail a subtly recessed feel
              // against the sheet surface. The hairline border
              // anchors the edges so the image doesn't float.
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.capturedImage}
              alt="Scanned item"
              style={{
                width: "100%",
                maxHeight: 120,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        {/* Method label */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {data.method === "barcode" ? "UPC SCAN" : "AI VISION"}
        </div>

        {/* Item name — wraps freely; word-break catches super-long tokens */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 17,
            color: "var(--text-primary)",
            textAlign: "center",
            marginTop: 4,
            wordBreak: "break-word",
          }}
        >
          {data.name}
        </div>

        {/* Retail arbitrage warning — surfaced when Claude flags the
            item as available at retail. Camel tint + warning glyph
            sets expectations BEFORE the verdict pill so the user
            doesn't read a MAYBE/PASS as a Claude failure. */}
        {data.retailArbitrage && (
          <div
            style={{
              marginTop: 8,
              marginBottom: 8,
              padding: "6px 12px",
              backgroundColor: "rgba(212,165,116,0.06)",
              borderRadius: 8,
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "#D4A574",
              lineHeight: 1.4,
            }}
          >
            ⚠ available at retail — limited flip potential
          </div>
        )}

        {/* Verdict badge — bounce-in scale + opacity reveal so the
            verdict announces itself as a moment, not a static label.
            Animation runs on every sheet open via the data identity
            keying the parent. */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "6px 20px",
              animation:
                "verdictPillIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms both",
            }}
          >
            {data.verdict}
          </div>
        </div>

        {/* 3-col price grid — flex with min-width:0 so the cells can shrink
            below their content width instead of forcing the row past 100%.
            The grid as a unit rises in from below 350ms after the verdict
            pill kicks off, so the data cascade reads as a single reveal. */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            animation: "verdictStatRise 300ms ease-out 350ms both",
          }}
        >
          <div style={{ ...recessedCell, flex: 1, minWidth: 0 }}>
            <div style={cellLabel}>COST</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 26,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {fmt(data.cost)}
            </div>
          </div>
          <div style={{ ...recessedCell, flex: 1, minWidth: 0 }}>
            <div style={cellLabel}>SELL</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 26,
                color: "var(--accent-mint)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {fmt(data.sell)}
            </div>
          </div>
          <div style={{ ...recessedCell, flex: 1, minWidth: 0 }}>
            <div style={cellLabel}>PROFIT</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 26,
                color: colors.text,
                fontFeatureSettings: '"tnum"',
                // Glow on BUY (mint) and PASS (faint red); MAYBE stays neutral.
                textShadow:
                  data.verdict === "BUY"
                    ? "0 0 24px rgba(92,224,184,0.15)"
                    : data.verdict === "PASS"
                      ? "0 0 24px rgba(232,99,107,0.10)"
                      : "none",
              }}
            >
              {fmt(data.netProfit)}
            </div>
            {/* Net-profit context — "after fees + shipping" so the
                user knows the headline number is take-home, plus a
                very dim "gross $X" reference so they can still see
                the un-discounted figure if they want it. */}
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 7,
                color: "#5A4E70",
                letterSpacing: "0.06em",
                marginTop: 2,
              }}
            >
              after fees + shipping
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 7,
                color: "#3D2E55",
                letterSpacing: "0.06em",
                marginTop: 1,
                fontFeatureSettings: '"tnum"',
              }}
            >
              gross {fmt(data.profit)}
            </div>
          </div>
        </div>

        {/* Detail grid — 5 cells. ROI/PLATFORM share row 1, SELLS IN
            spans row 2 as a hero cell, FEE/CONFIDENCE share row 3.
            SELLS IN gets the wide treatment because median days-to-sell
            is the new headline metric the user is most likely scanning
            for after the verdict. Cascade-staggered behind the price
            grid above (500ms vs 350ms) so the eye rolls down naturally. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 8,
            marginTop: 8,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            animation: "verdictStatRise 300ms ease-out 500ms both",
          }}
        >
          <div style={smallRecessedCell}>
            <div style={cellLabel}>ROI</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
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
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--text-primary)",
              }}
            >
              {data.platform}
            </div>
          </div>
          {/* SELLS IN — verdict-colored ~Xd hero number. Mint = FAST,
              camel = MODERATE, red = SLOW so the user can scan the cell
              against the BUY/PASS verdict above and immediately see
              whether profitability is also fast-turn. */}
          <div style={{ ...smallRecessedCell, gridColumn: "1 / -1" }}>
            <div style={cellLabel}>SELLS IN</div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 16,
                fontWeight: 700,
                color:
                  data.sellSpeed === "FAST"
                    ? "#5CE0B8"
                    : data.sellSpeed === "SLOW"
                      ? "#E8636B"
                      : "#D4A574",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ~{data.daysToSell}d
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.10em",
                marginTop: 2,
                color:
                  data.sellSpeed === "FAST"
                    ? "rgba(92,224,184,0.6)"
                    : data.sellSpeed === "SLOW"
                      ? "rgba(232,99,107,0.6)"
                      : "rgba(212,165,116,0.6)",
              }}
            >
              {data.sellSpeed}
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>FEE</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {fmt(data.fee)}
            </div>
          </div>
          <div style={smallRecessedCell}>
            <div style={cellLabel}>CONFIDENCE</div>
            <div
              style={{
                fontFamily: "var(--font-body)",
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

        {/* RECENT COMPS — web-search-grounded price evidence, fires when sheet opens */}
        <div
          style={{
            marginTop: 8,
            backgroundColor: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.20)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 2, height: 8, borderRadius: 1, backgroundColor: "rgba(92,224,184,0.28)", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "var(--font-label)",
                fontSize: 8,
                color: "rgba(200,192,216,0.40)",
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
              }}
            >
              RECENT COMPS
            </span>
          </div>
          {comps === "loading" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 18,
                    borderRadius: 4,
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "ctaShimmer 1.5s ease-in-out infinite",
                    opacity: 1 - i * 0.2,
                  }}
                />
              ))}
            </div>
          ) : comps === null ? (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(90,78,112,0.8)" }}>
              no comps found — estimate is AI-based
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {comps.items.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 13,
                        color: "var(--text-primary)",
                        fontFeatureSettings: '"tnum"',
                        minWidth: 42,
                      }}
                    >
                      ${c.price % 1 === 0 ? c.price.toFixed(0) : c.price.toFixed(2)}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontFamily: "var(--font-label)",
                        fontSize: 7,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        flexShrink: 0,
                        ...(c.label === "sold"
                          ? {
                              backgroundColor: "rgba(92,224,184,0.10)",
                              border: "1px solid rgba(92,224,184,0.22)",
                              color: "#5CE0B8",
                            }
                          : {
                              backgroundColor: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              color: "var(--text-muted)",
                            }),
                      }}
                    >
                      {c.label.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {c.source}
                    </span>
                    {c.date && (
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(90,78,112,0.8)", flexShrink: 0 }}>
                        {c.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                }}
              >
                range ${comps.low}–${comps.high}
                {" · "}
                {comps.items.filter((c) => c.label === "sold").length > 0
                  ? `${comps.items.filter((c) => c.label === "sold").length} sold`
                  : `${comps.count} found`}
                {comps.items.some((c) => c.label === "listed") &&
                comps.items.some((c) => c.label === "sold")
                  ? ` · ${comps.items.filter((c) => c.label === "listed").length} listed`
                  : null}
              </div>
              {data.sell > comps.high * 1.1 && (
                <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 10, color: "#D4A574" }}>
                  estimate above recent comps
                </div>
              )}
              {data.sell < comps.low * 0.9 && (
                <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 10, color: "#D4A574" }}>
                  estimate below recent comps
                </div>
              )}
            </>
          )}
        </div>

        {/* WHERE TO SELL — top-3 platform ranking from Claude. The
            best row gets a mint-tinted surface + "BEST" tag so the
            highest-net option reads at a glance; the other two sit on
            a quiet white-tinted base. Skipped entirely when Claude
            omits platformRanking (older verdicts cached pre-feature). */}
        {data.platformRanking && data.platformRanking.length > 0 && (
          <PlatformRanking entries={data.platformRanking} />
        )}

        {/* Platform pills — display-only for now; tapping will recompute fees later */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 12,
            justifyContent: "center",
          }}
        >
          {(["FB Local", "FB Shipped", "Amazon"] as const).map((p) => {
            const active = data.platform === p;
            return (
              <span
                key={p}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  borderRadius: 999,
                  backgroundColor: active
                    ? "rgba(92,224,184,0.10)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(92,224,184,0.15)"
                    : "1px solid rgba(255,255,255,0.06)",
                  color: active ? "#5CE0B8" : "#5A4E70",
                }}
              >
                {p}
              </span>
            );
          })}
        </div>

        {/* Save to Haul — ghost secondary before the listing CTA */}
        <SaveHaulButton data={data} />

        {/* CTA — hero button with top-edge shine + glow on press */}
        <ListingCta data={data} />

        {/* Secondary CTA — Pro condition grading. Outline style so it
            sits below the listing button as a quieter "go deeper"
            option rather than competing with the primary action. */}
        {onGradeCondition && (
          <button
            type="button"
            onClick={onGradeCondition}
            style={{
              marginTop: 10,
              width: "100%",
              padding: 10,
              borderRadius: 8,
              backgroundColor: "transparent",
              border: "1px solid rgba(212,165,116,0.20)",
              color: "#D4A574",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            grade condition
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
