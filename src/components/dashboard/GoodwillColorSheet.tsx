"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type { GoodwillColorsResponse } from "@/app/api/feeds/goodwill-colors/route";
import {
  currentGoodwillColors,
  type GoodwillColor,
} from "@/lib/sourcing";

/**
 * Goodwill Color Tags sheet — list of the rotating discount colors,
 * with this week's primary 50%-off and the carry-over 75%-off color
 * highlighted via right-side discount pills. Falls back to the
 * client-side rotation helper if /api/feeds/goodwill-colors is
 * unreachable so the sheet always paints something useful.
 */

interface GoodwillColorSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function GoodwillColorSheet({
  open,
  onClose,
}: GoodwillColorSheetProps) {
  const [colors, setColors] = useState<GoodwillColor[]>([]);
  const [note, setNote] = useState<string>(
    "Schedules vary by location — confirm with your store.",
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      // Optimistic client-side fallback so the list paints without
      // waiting on the route — both sources use the same helper.
      queueMicrotask(() => {
        if (!cancelled) setColors(currentGoodwillColors());
      });
      try {
        const res = await fetch("/api/feeds/goodwill-colors");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as GoodwillColorsResponse;
        if (cancelled) return;
        if (Array.isArray(data.colors)) setColors(data.colors);
        if (typeof data.note === "string") setNote(data.note);
      } catch {
        /* swallow — fallback colors already painted */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#7B8FFF">
      <div style={{ padding: "16px 18px 28px" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            color: "#7B8FFF",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          GOODWILL COLOR TAGS
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#5A4E70",
            marginBottom: 16,
          }}
        >
          this week&apos;s discount colors
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {colors.map((c) => {
            const isFifty = c.discount === "50% OFF";
            const isSeventyFive = c.discount === "75% OFF";
            // Active rows (the highlighted 50% / 75% colors) get a
            // tinted background; the non-headline rows recede to a
            // hairline outline so the eye lands on the highlights.
            const isActive = isFifty || isSeventyFive;
            return (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                  border: "1px solid rgba(255,255,255,0.04)",
                  opacity: isActive ? 1 : 0.55,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: c.hex,
                    flexShrink: 0,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.20)",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "#C8C0D8",
                  }}
                >
                  {c.name}
                </span>
                {isActive && (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: isSeventyFive
                        ? "rgba(212,165,116,0.12)"
                        : "rgba(92,224,184,0.10)",
                      color: isSeventyFive ? "#D4A574" : "#5CE0B8",
                      border: isSeventyFive
                        ? "1px solid rgba(212,165,116,0.24)"
                        : "1px solid rgba(92,224,184,0.22)",
                    }}
                  >
                    {c.discount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "#3D2E55",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {note}
        </div>
      </div>
    </BottomSheet>
  );
}
