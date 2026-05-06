"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type { TargetMarkdownsResponse } from "@/app/api/feeds/target-markdowns/route";
import { targetWeekSchedule, type TargetDay } from "@/lib/sourcing";

/**
 * Target markdown schedule sheet — a 7-row grid (Mon → Sun) showing
 * which categories markdown each day. Today's row is highlighted
 * with a mint left bar + tinted bg so the eye lands on the active
 * day immediately.
 *
 * Falls back to the client-side helper if /api/feeds/target-markdowns
 * is unreachable so the sheet always paints something useful.
 */

interface TargetMarkdownsSheetProps {
  open: boolean;
  onClose: () => void;
}

function todayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export default function TargetMarkdownsSheet({
  open,
  onClose,
}: TargetMarkdownsSheetProps) {
  const [schedule, setSchedule] = useState<TargetDay[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [note, setNote] = useState<string>(
    "Markdowns hit 30-50-70% in waves — check end caps and clearance aisles.",
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      // Paint client-side fallback first; route call upgrades.
      queueMicrotask(() => {
        if (cancelled) return;
        setSchedule(targetWeekSchedule());
        setActiveIdx(todayIndex());
      });
      try {
        const res = await fetch("/api/feeds/target-markdowns");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as TargetMarkdownsResponse;
        if (cancelled) return;
        if (Array.isArray(data.schedule)) setSchedule(data.schedule);
        if (typeof data.todayIndex === "number") setActiveIdx(data.todayIndex);
        if (typeof data.note === "string") setNote(data.note);
      } catch {
        /* swallow — client fallback still painted */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} borderColor="#E8636B">
      <div style={{ padding: "16px 18px 28px" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            color: "#E8636B",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          TARGET MARKDOWN SCHEDULE
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#5A4E70",
            marginBottom: 16,
          }}
        >
          which categories markdown each day
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {schedule.map((d, idx) => {
            const isToday = idx === activeIdx;
            return (
              <div
                key={d.full}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 12px",
                  borderRadius: 10,
                  backgroundColor: isToday
                    ? "rgba(92,224,184,0.04)"
                    : "rgba(255,255,255,0.02)",
                  border: isToday
                    ? "1px solid rgba(92,224,184,0.20)"
                    : "1px solid rgba(255,255,255,0.04)",
                  borderLeft: isToday
                    ? "3px solid #5CE0B8"
                    : "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span
                  style={{
                    width: 36,
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isToday ? "#5CE0B8" : "#C8C0D8",
                    letterSpacing: "0.06em",
                  }}
                >
                  {d.short}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: isToday ? "#C8C0D8" : "#5A4E70",
                    flex: 1,
                  }}
                >
                  {d.categories.join(" + ")}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#5A4E70",
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {note}
        </div>
      </div>
    </BottomSheet>
  );
}
