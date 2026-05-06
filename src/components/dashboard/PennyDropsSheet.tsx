"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type { PenniesFeedItem } from "@/lib/claude";

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
function storeTint(store: string): { bg: string; color: string } {
  const s = store.toLowerCase();
  if (s.includes("dollar general"))
    return { bg: "rgba(255,208,0,0.10)", color: "#FFD000" };
  if (s.includes("target"))
    return { bg: "rgba(204,0,0,0.12)", color: "#E5575C" };
  if (s.includes("walmart"))
    return { bg: "rgba(0,120,215,0.12)", color: "#4FA3E8" };
  if (s.includes("dollar tree"))
    return { bg: "rgba(0,150,80,0.12)", color: "#5ED890" };
  return { bg: "rgba(255,255,255,0.04)", color: "#C8C0D8" };
}

function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n < 1) return `$${n.toFixed(2)}`;
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

export default function PennyDropsSheet({ open, onClose }: PennyDropsSheetProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );
  const [items, setItems] = useState<PenniesFeedItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/feeds/pennies");
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const data = (await res.json()) as PenniesResponse;
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
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#D4A574">
      <div style={{ padding: "16px 18px 28px" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            color: "#D4A574",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          PENNY DROPS
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#5A4E70",
            marginBottom: 16,
          }}
        >
          this week&apos;s clearance steals
        </div>

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
              return (
                <div
                  key={`${it.store}-${idx}`}
                  style={{
                    backgroundColor: "rgba(23,18,42,0.6)",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        backgroundColor: tint.bg,
                        color: tint.color,
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {it.store}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#C8C0D8",
                      marginTop: 6,
                      lineHeight: 1.3,
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
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "#D4A574", fontWeight: 700 }}>
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
                      }}
                    >
                      {it.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
