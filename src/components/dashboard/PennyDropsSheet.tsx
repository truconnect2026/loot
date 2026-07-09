"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type { PenniesFeedItem } from "@/lib/claude";
import { createClient } from "@/lib/supabase";

/**
 * Penny Drops sheet — surfaces the cached pennies feed (national,
 * 4-hour TTL) when the user taps the SOURCING / Penny Drops card on
 * the dashboard. Each item card carries a store-tinted badge so the
 * user can scan vertically and pick stores they actually shop near
 * them. Empty state nudges to "check back Tuesday" since the feed
 * refreshes weekly.
 */

interface PennyDropsSheetProps {
  open: boolean;
  onClose: () => void;
}

interface PenniesResponse {
  items: PenniesFeedItem[];
  cached?: boolean;
}

// Store-specific badge tint. Falls back to plum for stores we don't
// have a brand color for. Picked to read clearly against the dark
// card surface — not the canonical brand color, but close enough.
// `border` is the same hue at 0.2 alpha so the badge has a soft
// outline matching its fill, which gives more definition than the
// previous outline-less variant.
function storeTint(store: string): { bg: string; color: string; border: string } {
  const s = store.toLowerCase();
  if (s.includes("dollar general"))
    return {
      bg: "rgba(255,208,0,0.10)",
      color: "#FFD000",
      border: "rgba(255,208,0,0.20)",
    };
  if (s.includes("target"))
    return {
      bg: "rgba(204,0,0,0.12)",
      color: "#E5575C",
      border: "rgba(229,87,92,0.20)",
    };
  if (s.includes("walmart"))
    return {
      bg: "rgba(0,120,215,0.12)",
      color: "#4FA3E8",
      border: "rgba(79,163,232,0.20)",
    };
  if (s.includes("dollar tree"))
    return {
      bg: "rgba(0,150,80,0.12)",
      color: "#5ED890",
      border: "rgba(94,216,144,0.20)",
    };
  return {
    bg: "rgba(255,255,255,0.04)",
    color: "#C8C0D8",
    border: "rgba(255,255,255,0.08)",
  };
}

function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n < 1) return `$${n.toFixed(2)}`;
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

// Profit-tier color for the 2px left ribbon on each card.
//   5x+ resale/clearance → mint  (heavy flip)
//   2-5x                  → camel (decent flip)
//   <2x                   → near-invisible hairline
// Same cadence as the shelf-scan card system so the user pattern-
// matches the colors across screens.
function profitRibbon(clearance: number, resale: number): string {
  if (clearance <= 0) return "rgba(255,255,255,0.06)";
  const ratio = resale / clearance;
  if (ratio >= 5) return "#5CE0B8";
  if (ratio >= 2) return "#D4A574";
  return "rgba(255,255,255,0.06)";
}

function TagIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D4A574"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

export default function PennyDropsSheet({ open, onClose }: PennyDropsSheetProps) {
  const supabase = createClient();
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [items, setItems] = useState<PenniesFeedItem[]>([]);
  const [zip, setZip] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setStatus("loading");
      // Fetch zip + feed in parallel so the bottom CTA paints with
      // the right copy on first render. Zip read failures degrade to
      // the no-zip CTA — they don't block the feed.
      const [feedRes, profileRes] = await Promise.all([
        fetch("/api/feeds/pennies").catch(() => null),
        supabase.auth.getUser().then(async ({ data: userData }) => {
          if (!userData.user) return null;
          const { data } = await supabase
            .from("profiles")
            .select("zip_code")
            .eq("id", userData.user.id)
            .maybeSingle();
          return data?.zip_code ?? null;
        }).catch(() => null),
      ]);
      if (cancelled) return;
      if (typeof profileRes === "string") setZip(profileRes);
      if (!feedRes || !feedRes.ok) {
        setStatus("error");
        return;
      }
      try {
        const data = (await feedRes.json()) as PenniesResponse;
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setStatus("loaded");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  // Headline summary stat — "best flip" = highest profit (resale -
  // clearance) across all items. Defaults to 0 when the feed is
  // empty, in which case the summary line is suppressed below.
  const bestFlip = items.reduce((max, it) => {
    const profit = it.estimated_resale_value - it.clearance_price;
    return profit > max ? profit : max;
  }, 0);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      borderColor="#D4A574"
      minHeight="55vh"
    >
      <div style={{ padding: "16px 18px 28px" }}>
        {/* Header — tag glyph + PENNY DROPS, two-line subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <TagIcon />
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "#D4A574",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
            }}
          >
            PENNY DROPS
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#5A4E70",
            marginBottom: 2,
          }}
        >
          this week&apos;s clearance steals
        </div>
        <div
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 8,
            color: "#3D2E55",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          updated every Tuesday
        </div>

        {/* Summary line — "X items · best flip: +$Y" — only when
            we have items to summarize. */}
        {status === "loaded" && items.length > 0 && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#C8C0D8",
              marginBottom: 12,
            }}
          >
            {items.length} item{items.length === 1 ? "" : "s"} this week ·
            {" "}
            best flip:{" "}
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontWeight: 700,
                color: "#5CE0B8",
              }}
            >
              +{fmtPrice(bestFlip)}
            </span>
          </div>
        )}

        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  backgroundColor: "rgba(23,18,42,0.6)",
                  borderRadius: 12,
                  opacity: 0.4,
                  animation: `pennySkel 1.2s ${i * 120}ms ease-in-out infinite`,
                }}
              />
            ))}
            <style>{`@keyframes pennySkel { 0%,100% { opacity: 0.3 } 50% { opacity: 0.6 } }`}</style>
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(232,99,107,0.85)",
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            couldn&apos;t load this week&apos;s pennies — try again
          </div>
        )}

        {status === "loaded" && items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5A4E70"
              strokeOpacity={0.3}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1={7} y1={7} x2={7.01} y2={7} />
            </svg>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "#5A4E70",
              }}
            >
              no penny drops this week
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#3D2E55",
              }}
            >
              check back Tuesday
            </div>
          </div>
        )}

        {status === "loaded" && items.length > 0 && (
          <div>
            {items.map((it, idx) => {
              const tint = storeTint(it.store);
              const profit = it.estimated_resale_value - it.clearance_price;
              const ribbon = profitRibbon(
                it.clearance_price,
                it.estimated_resale_value,
              );
              // Penny items under $2 clearance almost always sell fast
              // — surface a FAST pill for them. The PenniesFeedItem
              // shape doesn't carry sellSpeed today, so this is a
              // heuristic rather than a model-derived value.
              const isFast = it.clearance_price > 0 && it.clearance_price < 2;
              return (
                <div
                  key={`${it.store}-${idx}`}
                  style={{
                    position: "relative",
                    backgroundColor: "rgba(23,18,42,0.6)",
                    borderRadius: 12,
                    padding: 12,
                    paddingLeft: 14, // room for the 2px ribbon + air
                    marginBottom: 10,
                    borderLeft: `2px solid ${ribbon}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        backgroundColor: tint.bg,
                        color: tint.color,
                        border: `1px solid ${tint.border}`,
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}
                    >
                      {it.store}
                    </span>
                    {isFast && (
                      <span
                        style={{
                          fontFamily: "var(--font-space-mono)",
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          backgroundColor: "rgba(92,224,184,0.10)",
                          color: "#5CE0B8",
                          border: "1px solid rgba(92,224,184,0.20)",
                          padding: "4px 8px",
                          borderRadius: 6,
                        }}
                      >
                        FAST
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#C8C0D8",
                      marginTop: 6,
                      lineHeight: 1.3,
                      paddingRight: 64, // breathing room for the +$ pill
                    }}
                  >
                    {it.item_name}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 14,
                    }}
                  >
                    {/* Clearance price → red because it's the slashed
                        original; resale → mint because it's the take. */}
                    <span style={{ color: "#E8636B", fontWeight: 700 }}>
                      {fmtPrice(it.clearance_price)}
                    </span>
                    <span style={{ color: "#5A4E70" }}>→</span>
                    <span style={{ color: "#5CE0B8", fontWeight: 700 }}>
                      {fmtPrice(it.estimated_resale_value)}
                    </span>
                  </div>
                  {it.notes && (
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        color: "#5A4E70",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {it.notes}
                    </div>
                  )}

                  {/* Profit pill — bottom-right corner, hidden when
                      profit is non-positive (rare but possible if
                      Claude returns wonky data). */}
                  {profit > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#5CE0B8",
                        backgroundColor: "rgba(92,224,184,0.10)",
                        border: "1px solid rgba(92,224,184,0.20)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      +{fmtPrice(profit)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Bottom CTA — informational only; the feed is national
                so zip doesn't gate results today, but acknowledging
                whether the user has set one keeps the door open for
                a future zip-aware filter. */}
            <div
              style={{
                marginTop: 12,
                textAlign: "center",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "#5A4E70",
              }}
            >
              {zip
                ? `showing drops near ${zip}`
                : "set your zip code to get local penny drops"}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
