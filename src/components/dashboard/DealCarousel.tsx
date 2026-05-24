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
  /** Optional 12px section icon rendered inline before the label
   * text. Used to give each carousel its own identity — flame for
   * DEALS NEAR YOU, gift for FREE & CLEARANCE. */
  icon?: React.ReactNode;
  /** Optional live-activity element (e.g. WinsTicker) rendered
   * inline below the section label. Used for the first carousel
   * on the dashboard so the ticker reads as that section's
   * activity feed rather than as an orphaned line above it. */
  liveSignal?: React.ReactNode;
  /** Render skeleton placeholders instead of cards while data loads. */
  loading?: boolean;
  /** Shown in place of cards when `deals` is empty and not loading. */
  emptyMessage?: string;
  /** Render a small "DEMO PREVIEW" badge next to the section label.
   * The current feeds are AI-synthesized via Claude (see src/lib/claude.ts
   * dealsFeed / freeFeed / clearanceFeed) rather than scraped from real
   * Facebook Marketplace / Craigslist / Nextdoor. The badge keeps users
   * honest about what they're seeing until real scraping wires up.
   * Default: false. */
  isDemo?: boolean;
}

// Fade sits flush against the page bg (#120e18) so the carousel
// edge dissolves rather than clipping. Solid #120e18 at the page-
// side stop + transparent at the inner stop creates a clean
// transparent-to-opaque wash that hints "swipe for more" without a
// hard cut.
const FADE_BG_LEFT =
  "linear-gradient(to left, transparent 0%, #120e18 100%)";
const FADE_BG_RIGHT =
  "linear-gradient(to right, transparent 0%, #120e18 100%)";

export default function DealCarousel({
  label,
  deals,
  onDealTap,
  icon,
  liveSignal,
  loading,
  emptyMessage,
  isDemo = false,
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
      {/* Section header — anchored hairline underline matching the
          SOURCING / MORE TOOLS treatment. paddingBottom + borderBottom
          + marginBottom together create the same visual rhythm across
          every section on the dashboard. The underline only spans the
          inner content (paddingLeft 18 keeps it off the viewport edge)
          so it reads as a section anchor, not a full-bleed divider. */}
      <div
        style={{
          paddingLeft: 18,
          paddingRight: 18,
          // Uppercase carousel category — DEALS NEAR YOU / FREE & CLEARANCE.
          // Stays mono per the font role system.
          fontFamily: "var(--font-label)",
          fontSize: 9,
          color: "#3D2E55",
          letterSpacing: "0.10em",
          paddingBottom: 6,
          // 0.05 (was 0.03) so the underline actually reads on
          // OLED phone screens. Matches SECTION_LABEL in page.tsx.
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          // Tighter bottom margin when liveSignal is rendered below
          // (the ticker reads as part of this header trio).
          marginBottom: liveSignal ? 6 : 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
        {label}
        {isDemo && (
          <span
            aria-label="Demo preview — listings are AI-synthesized, not live marketplace data"
            style={{
              marginLeft: 8,
              padding: "2px 6px",
              borderRadius: 3,
              fontFamily: "var(--font-label)",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#F5C518",
              background: "rgba(245,197,24,0.10)",
              border: "1px solid rgba(245,197,24,0.35)",
              textTransform: "uppercase",
              lineHeight: 1.4,
            }}
          >
            Demo Preview
          </span>
        )}
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

      {/* Empty: compact single-line state instead of a 164-tall hole.
          Includes a subtle Account link so the user can take action
          without leaving the dashboard manually. The full scroll
          container is skipped entirely when empty so the section
          collapses to ~36px instead of holding card-height space. */}
      {isEmpty ? (
        <div
          style={{
            paddingLeft: 18,
            paddingRight: 18,
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.3,
          }}
        >
          <span>{emptyMessage ?? "no deals found near you"}</span>
          <a
            href="/account"
            style={{
              color: "rgba(255,255,255,0.65)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
              textDecorationColor: "rgba(255,255,255,0.20)",
            }}
          >
            settings
          </a>
        </div>
      ) : (
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
            zIndex: 5,
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
            zIndex: 5,
            opacity: showRightFade ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      )}
    </div>
  );
}
