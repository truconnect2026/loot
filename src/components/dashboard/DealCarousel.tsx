"use client";

import { useEffect, useRef, useState } from "react";
import DealCard, { type Deal } from "@/components/dashboard/DealCard";

// Loading skeleton — matches DealCard's 232×164 footprint and 14px
// inner padding so swapping in the real cards doesn't shift the
// scroll position. The shimmer is a static low-contrast surface;
// adding a moving gradient sweep here would compete with the
// existing winsTicker pulse for attention.
function DealCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 232,
        minHeight: 164,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        backgroundColor: "#120e18",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 12,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          width: "85%",
          height: 14,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          width: "60%",
          height: 14,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 18,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            width: 64,
            height: 18,
            borderRadius: 4,
            backgroundColor: "rgba(92,224,184,0.10)",
          }}
        />
      </div>
    </div>
  );
}

interface DealCarouselProps {
  label: string;
  deals: Deal[];
  onDealTap: (deal: Deal) => void;
  /** Optional live-activity element (e.g. WinsTicker) rendered
   * inline below the section label. Used for the first carousel
   * on the dashboard so the ticker reads as that section's
   * activity feed rather than as an orphaned line above it. */
  liveSignal?: React.ReactNode;
  /** Render skeleton placeholders instead of cards while data loads. */
  loading?: boolean;
  /** Shown in place of cards when `deals` is empty and not loading. */
  emptyMessage?: string;
}

// Fade sits flush against the page bg (#120e18) so the carousel
// edge dissolves rather than clipping. Strong end goes fully opaque
// — at 0.95 the leftover 5% reads as a hairline rather than a fade,
// especially against the dashboard's grid pattern. The mid-stop at
// 50% with slight alpha softens the curve so the fade feels
// continuous rather than linear.
const FADE_BG_LEFT =
  "linear-gradient(to right, rgba(18,14,24,1) 0%, rgba(18,14,24,0.6) 50%, transparent 100%)";
const FADE_BG_RIGHT =
  "linear-gradient(to left, rgba(18,14,24,1) 0%, rgba(18,14,24,0.6) 50%, transparent 100%)";

export default function DealCarousel({
  label,
  deals,
  onDealTap,
  liveSignal,
  loading,
  emptyMessage,
}: DealCarouselProps) {
  const isEmpty = !loading && deals.length === 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft > 10;
      const right =
        el.scrollLeft + el.clientWidth < el.scrollWidth - 20;
      setShowLeftFade(left);
      setShowRightFade(right);
    };

    // Defer the initial sync past the synchronous effect body so
    // react-hooks/set-state-in-effect doesn't trace the chain into setState.
    queueMicrotask(update);
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [deals.length]);

  return (
    <div>
      <div
        style={{
          paddingLeft: 18,
          // Uppercase carousel category — DEALS NEAR YOU / FREE & CLEARANCE.
          // Stays mono per the font role system.
          fontFamily: "var(--font-label)",
          fontSize: 9,
          color: "#3D2E55",
          letterSpacing: "0.10em",
          marginBottom: liveSignal ? 6 : 12,
        }}
      >
        {label}
      </div>

      {/* Live signal — rendered inside the section header so it
          reads as this section's activity feed, not as a floating
          line between sections. Tightened the label's bottom margin
          when present (6px → label → 6px → ticker → 10px → cards)
          so the trio reads as one nested header. */}
      {liveSignal && (
        <div
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            marginBottom: 10,
          }}
        >
          {liveSignal}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <div
          ref={scrollRef}
          className="loot-carousel"
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: 10,
            paddingLeft: 18,
            paddingRight: 18,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {loading
            ? // Skeleton placeholders match the live cards' 232×164
              // dimensions exactly so the layout doesn't shift when
              // real data arrives.
              Array.from({ length: 4 }).map((_, i) => (
                <DealCardSkeleton key={`skel-${i}`} />
              ))
            : deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onTap={onDealTap} />
              ))}
          {isEmpty && (
            <div
              style={{
                width: "100%",
                minHeight: 164,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 12,
                paddingRight: 12,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              {emptyMessage ?? "no deals found near you"}
            </div>
          )}
        </div>

        {/* Left edge fade — appears once user scrolls past 10px */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 48,
            background: FADE_BG_LEFT,
            pointerEvents: "none",
            zIndex: 2,
            opacity: showLeftFade ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Right edge fade — fades out as user reaches the end */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 48,
            background: FADE_BG_RIGHT,
            pointerEvents: "none",
            zIndex: 2,
            opacity: showRightFade ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}
