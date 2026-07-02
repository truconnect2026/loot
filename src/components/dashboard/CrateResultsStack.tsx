"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import type { BatchValuation } from "@/lib/claude";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { CountUp } from "@/components/ui/CountUp";
import { saveHaul } from "@/lib/hauls";
import { motion, elevation, colors, radius } from "@/lib/design/tokens";

export interface StripRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CrateResultsStackProps {
  sortedRows: BatchValuation[];
  crops: string[];          // crops[val.index] = sliver data URL from capture
  stripRects: StripRect[];  // stripRects[crateOrder] = capture-time viewport rect
  fullFrame: string;        // full camera frame for FLIP background
  onRetry: () => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

// STEP = distance between card tops in the fan = visible peek amount for each card
const STEP = motion.cratePeek;  // 56px
const CARD_H_EST = 108;          // estimated card height for container sizing

export function CrateResultsStack({
  sortedRows,
  crops,
  stripRects,
  fullFrame,
  onRetry,
}: CrateResultsStackProps) {
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [settled, setSettled] = useState(false);
  const [focused, setFocused] = useState<number | null>(null);
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());
  const [savingItems, setSavingItems] = useState<Set<number>>(new Set());
  const prefersReduced = usePrefersReducedMotion();
  const N = sortedRows.length;

  useLayoutEffect(() => {
    // REDUCED MOTION: staggered fade-in, no FLIP travel
    if (prefersReduced) {
      cardRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transition = "none";
      });
      requestAnimationFrame(() => {
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.transition = `opacity ${motion.base}ms ${motion.easeOut} ${i * motion.stagger}ms`;
          el.style.opacity = "1";
        });
        const total = N * motion.stagger + motion.base;
        const t = setTimeout(() => setSettled(true), total);
        return () => clearTimeout(t);
      });
      return;
    }

    // ── THREE-BEAT FLIP SEQUENCE ──────────────────────────────────────────────
    // Cards are already at their final stack positions (top: i * STEP).
    // Measure end rects FIRST (the "Last" step in FLIP), then apply inverse.
    const endRects = cardRefs.current.map((el) => el?.getBoundingClientRect() ?? null);

    cardRefs.current.forEach((el, sortedI) => {
      if (!el) return;
      const val = sortedRows[sortedI];
      const start = stripRects[val.index];
      const end = endRects[sortedI];
      if (!start || !end || end.width === 0) return;

      // -8px: BEAT 1 lift pre-applied so cards appear already lifted at strip pos
      const startCX = start.left + start.width / 2;
      const startCY = start.top + start.height / 2 - 8;
      const endCX = end.left + end.width / 2;
      const endCY = end.top + end.height / 2;

      const dx = startCX - endCX;
      const dy = startCY - endCY;
      const sx = start.width / end.width;
      const sy = start.height / end.height;

      el.style.transition = "none";
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
      el.style.filter = "saturate(0.55)";
      el.style.opacity = "0.9";
      el.style.willChange = "transform, filter, opacity";
    });

    if (frameRef.current) {
      frameRef.current.style.transition = "none";
      frameRef.current.style.opacity = "1";
    }

    // Force reflow: initial transforms are committed before any transition starts
    void document.body.offsetHeight;

    // BEAT 1 (crateBeat1 ms): strips hold at capture position — the "pick up" pause
    const t1 = setTimeout(() => {
      // BEAT 2: staggered FLIP travel — front card (lowest val.index) leads
      sortedRows.forEach((val, sortedI) => {
        const el = cardRefs.current[sortedI];
        if (!el) return;
        const delay = val.index * motion.crateStagger;
        el.style.transition = [
          `transform ${motion.crateBeat2}ms ${motion.spring} ${delay}ms`,
          `filter ${motion.fast}ms ${motion.easeOut} ${delay}ms`,
          `opacity ${motion.fast}ms ${motion.easeOut} ${delay}ms`,
        ].join(", ");
        el.style.transform = "translate3d(0, 0, 0)";
        el.style.filter = "saturate(1)";
        el.style.opacity = "1";
      });

      // Camera frame dims to app bg during Beat 2
      if (frameRef.current) {
        frameRef.current.style.transition = `opacity ${motion.crateBeat2}ms ${motion.easeOut}`;
        frameRef.current.style.opacity = "0";
      }

      // BEAT 3: after last card lands, clear willChange + fire CountUp via settled
      const lastDelay = N > 0 ? (N - 1) * motion.crateStagger : 0;
      const t3 = setTimeout(() => {
        cardRefs.current.forEach((el) => {
          if (!el) return;
          el.style.willChange = "auto";
          el.style.transition = "";  // React takes over for focus interaction
        });
        setSettled(true);
      }, lastDelay + motion.crateBeat2 + motion.crateBeat3);

      return () => clearTimeout(t3);
    }, motion.crateBeat1);

    return () => clearTimeout(t1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (val: BatchValuation, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = val.index;
    if (savedItems.has(idx) || savingItems.has(idx)) return;
    setSavingItems((prev) => new Set([...prev, idx]));
    const result = await saveHaul({
      name: val.name,
      est_resale_low:
        val.resaleLow > 0 ? val.resaleLow : val.estResale > 0 ? val.estResale : null,
      est_resale_high:
        val.resaleHigh > 0 ? val.resaleHigh : val.estResale > 0 ? val.estResale : null,
      verdict: val.verdict.toLowerCase() as "buy" | "maybe" | "pass",
      source: "scan_crate",
    });
    setSavingItems((prev) => {
      const n = new Set(prev);
      n.delete(idx);
      return n;
    });
    if (result.ok) setSavedItems((prev) => new Set([...prev, idx]));
  };

  const readable = sortedRows.filter((v) => !v.name.toLowerCase().includes("unreadable"));
  const unreadableCount = sortedRows.length - readable.length;
  const containerH = CARD_H_EST + Math.max(0, N - 1) * STEP;

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Frozen camera frame — dims to app bg during Beat 2 */}
      <div
        ref={frameRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0, // set to 1 in useLayoutEffect before first paint
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fullFrame}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(7,5,16,0.52)" }} />
      </div>

      {/* Scrollable content above frame */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Header stats — fade in after settle */}
        <div
          style={{
            padding: "4px 18px 12px",
            flexShrink: 0,
            opacity: settled ? 1 : 0,
            transition: settled ? `opacity ${motion.base}ms ${motion.easeOut}` : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 52,
                lineHeight: 1,
                color: colors.mint,
                letterSpacing: "-0.01em",
              }}
            >
              {readable.length}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                color: "#9ca3af",
                paddingBottom: 3,
              }}
            >
              {readable.length === 1 ? "record" : "records"} identified
            </span>
          </div>
          {unreadableCount > 0 && (
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 10,
                color: "#4b5563",
                marginTop: 3,
              }}
            >
              {unreadableCount} strip{unreadableCount > 1 ? "s" : ""} unreadable
            </div>
          )}
          {/* Low-confidence disclaimer — always legible, honesty layer */}
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              backgroundColor: "rgba(123,143,255,0.06)",
              border: "1px solid rgba(123,143,255,0.18)",
              borderRadius: radius.md,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <VerdictBadge tier="VERIFY" size="sm" />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "#9ca3af",
                lineHeight: 1.5,
              }}
            >
              Sliver ID is low-confidence. Verify edition + deadwax before buying — pressing matters
              for value.
            </span>
          </div>
        </div>

        {/* Fanned card stack */}
        <div
          style={{
            position: "relative",
            height: containerH,
            margin: "0 12px",
            flexShrink: 0,
          }}
        >
          {sortedRows.map((val, sortedI) => {
            const isFocused = focused === sortedI;
            const isUnreadable = val.name.toLowerCase().includes("unreadable");
            const isTopBuy = sortedI === 0 && val.verdict === "BUY" && !isUnreadable;
            const crop = crops[val.index];
            const isSaved = savedItems.has(val.index);
            const isSaving = savingItems.has(val.index);
            const hasPrice =
              (val.resaleLow > 0 && val.resaleHigh > 0) || val.estResale > 0;

            const baseShadow =
              isFocused || isTopBuy
                ? `${elevation[isFocused ? 3 : 2]}, ${elevation.rim}`
                : elevation[1];

            return (
              <div
                key={val.index}
                ref={(el) => {
                  cardRefs.current[sortedI] = el;
                }}
                onClick={() => settled && setFocused((p) => (p === sortedI ? null : sortedI))}
                style={{
                  position: "absolute",
                  top: sortedI * STEP,   // static — FLIP uses transform, never animates top
                  left: 0,
                  right: 0,
                  zIndex: isFocused ? N + 5 : N - sortedI,
                  // transform managed imperatively during animation; React owns it after settle
                  ...(settled
                    ? {
                        transform: isFocused
                          ? `translate3d(0, ${-sortedI * STEP}px, 0)`
                          : "translate3d(0, 0, 0)",
                        transition: `transform ${motion.base}ms ${motion.spring}, box-shadow ${motion.base}ms ease`,
                      }
                    : {}),
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  background: "rgba(17,14,28,0.96)",
                  boxShadow: baseShadow,
                  cursor: settled ? "pointer" : "default",
                }}
              >
                {/* Cover sliver — THE exact pixels the camera saw */}
                {crop ? (
                  <div style={{ width: "100%", height: 52, overflow: "hidden", flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={crop}
                      alt="cover sliver"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ height: 52, background: "rgba(255,255,255,0.04)" }} />
                )}

                {/* Card body */}
                <div style={{ padding: "9px 12px 11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <VerdictBadge tier="VERIFY" size="sm" />
                    {isTopBuy && settled && (
                      <span
                        aria-label="top pick"
                        style={{ fontSize: 11, lineHeight: 1, userSelect: "none" }}
                      >
                        👑
                      </span>
                    )}
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: isUnreadable ? 400 : 500,
                        color: isUnreadable ? "#374151" : colors.textPrimary,
                        fontStyle: isUnreadable ? "italic" : "normal",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isUnreadable
                        ? "couldn't read this one"
                        : val.name.length > 36
                          ? val.name.slice(0, 34) + "…"
                          : val.name}
                    </span>
                    {!isUnreadable && (
                      <button
                        onClick={(e) => handleSave(val, e)}
                        style={{
                          flexShrink: 0,
                          width: 22,
                          height: 22,
                          borderRadius: radius.pill,
                          border: isSaved
                            ? "1px solid rgba(92,224,184,0.40)"
                            : "1px solid rgba(255,255,255,0.14)",
                          backgroundColor: isSaved
                            ? "rgba(92,224,184,0.12)"
                            : "rgba(255,255,255,0.04)",
                          color: isSaved ? colors.mint : "#6b7280",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isSaved || isSaving ? "default" : "pointer",
                          transition: `all ${motion.fast}ms ease`,
                        }}
                      >
                        {isSaving ? "…" : isSaved ? "✓" : "+"}
                      </button>
                    )}
                  </div>

                  {/* Price + edition line */}
                  {!isUnreadable && hasPrice && (
                    <div
                      style={{
                        marginTop: 4,
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {settled ? (
                        val.resaleLow > 0 && val.resaleHigh > 0 ? (
                          <span
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 12,
                              color: colors.mint,
                              letterSpacing: "0.03em",
                            }}
                          >
                            <CountUp value={val.resaleLow} prefix="$" />
                            <span style={{ color: colors.textDim, margin: "0 2px" }}>–</span>
                            <CountUp value={val.resaleHigh} prefix="$" />
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 12,
                              color: colors.mint,
                              letterSpacing: "0.03em",
                            }}
                          >
                            <CountUp value={val.estResale} prefix="$" />
                          </span>
                        )
                      ) : (
                        <span
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 12,
                            color: colors.textDim,
                          }}
                        >
                          —
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 10,
                          color: "#4b5563",
                          fontStyle: "italic",
                        }}
                      >
                        edition unconfirmed — flip to check deadwax
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom actions — fade in after settle */}
        <div
          style={{
            padding: `${STEP + 16}px 18px 32px`,
            opacity: settled ? 1 : 0,
            transition: settled ? `opacity ${motion.base}ms ${motion.easeOut} 80ms` : "none",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onRetry}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: radius.lg,
              background: "rgba(92,224,184,0.07)",
              border: "1px solid rgba(92,224,184,0.18)",
              color: colors.mint,
              fontFamily: "var(--font-label)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.10em",
              cursor: "pointer",
            }}
          >
            SCAN ANOTHER CRATE
          </button>
        </div>
      </div>
    </div>
  );
}
