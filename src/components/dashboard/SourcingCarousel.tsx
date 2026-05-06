"use client";

import { useState, type ReactNode } from "react";
import { primaryGoodwillColor, todayTargetCategories } from "@/lib/sourcing";

/**
 * SOURCING carousel — horizontally scrollable strip of intel feeds.
 * Replaces the earlier 2-card SourcingCards grid. Eight tiles total
 * at launch: three feeds carry live content (Penny Drops, Color Tags,
 * Target Deals) and five are coming-soon placeholders that surface
 * the future product surface so users know what's planned.
 *
 * Each card is a fixed 155px-wide tile so scrolling feels uniform;
 * the parent carousel container provides the same right-edge fade
 * gradient the deal carousels use to signal "swipe for more".
 */

export type SourcingFeed =
  | "penny"
  | "goodwill-colors"
  | "target-markdowns"
  | "restock-days"
  | "yard-sales"
  | "estate-sales"
  | "bolo-alerts"
  | "seasonal-flips";

interface SourcingCarouselProps {
  /** Live counts that drive status text on the active tiles. */
  pennyItemCount: number;
  /** Tap handlers. Each opens a feed-specific bottom sheet, owned
   * by the dashboard so multiple feeds don't race on open state. */
  onTap: (feed: SourcingFeed) => void;
}

interface CardSpec {
  feed: SourcingFeed;
  iconColor: string;
  icon: ReactNode;
  title: string;
  /** Status text shown beneath the title. */
  status: string;
  /** Whether the status reads as live ("X items") or muted ("coming
   * soon" / "0 near you"). Drives status text color and the
   * notification dot. */
  active: boolean;
  /** Coming-soon tiles get a dashed outline + 0.4 dimming so the
   * eye reads them as future product without making them
   * un-tappable. */
  comingSoon: boolean;
}

// ── Icons (24px, stroke="currentColor" so the wrapper paints them) ─

function TagGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1={7} y1={7} x2={7.01} y2={7} />
    </svg>
  );
}

function PaletteGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={13.5} cy={6.5} r={1.5} />
      <circle cx={17.5} cy={10.5} r={1.5} />
      <circle cx={8.5} cy={7.5} r={1.5} />
      <circle cx={6.5} cy={12.5} r={1.5} />
      <path d="M12 22a10 10 0 110-20 9 9 0 019 9c0 4-3 4-3 6s2 5-6 5z" />
    </svg>
  );
}

function CrosshairGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={6} />
      <circle cx={12} cy={12} r={2} />
    </svg>
  );
}

function RefreshGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function MapPinGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function HouseGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BellGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function CalendarGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  );
}

// Build the eight cards. Live content drives status text + active
// flags; coming-soon flags drive the dashed-border treatment.
function buildCards(pennyItemCount: number, now: Date): CardSpec[] {
  const goodwill = primaryGoodwillColor(now);
  const todayCats = todayTargetCategories(now);
  const pennyActive = pennyItemCount > 0;

  return [
    {
      feed: "penny",
      iconColor: "#D4A574",
      icon: <TagGlyph />,
      title: "Penny Drops",
      status: pennyActive
        ? `${pennyItemCount} items this week`
        : "check back Tuesday",
      active: pennyActive,
      comingSoon: false,
    },
    {
      feed: "goodwill-colors",
      iconColor: "#7B8FFF",
      icon: <PaletteGlyph />,
      title: "Color Tags",
      status: `${goodwill.name.toLowerCase()} is 50% off`,
      active: true,
      comingSoon: false,
    },
    {
      feed: "target-markdowns",
      iconColor: "#E8636B",
      icon: <CrosshairGlyph />,
      title: "Target Deals",
      status: todayCats
        ? `${todayCats.toLowerCase()} marked down today`
        : "today's markdowns",
      active: true,
      comingSoon: false,
    },
    {
      feed: "restock-days",
      iconColor: "#5CE0B8",
      icon: <RefreshGlyph />,
      title: "Restock Days",
      status: "coming soon",
      active: false,
      comingSoon: true,
    },
    {
      feed: "yard-sales",
      iconColor: "#5CE0B8",
      icon: <MapPinGlyph />,
      title: "Yard Sales",
      status: "0 near you",
      active: false,
      comingSoon: true,
    },
    {
      feed: "estate-sales",
      iconColor: "#D4A574",
      icon: <HouseGlyph />,
      title: "Estate Sales",
      status: "coming soon",
      active: false,
      comingSoon: true,
    },
    {
      feed: "bolo-alerts",
      iconColor: "#E8636B",
      icon: <BellGlyph />,
      title: "BOLO Alerts",
      status: "coming soon",
      active: false,
      comingSoon: true,
    },
    {
      feed: "seasonal-flips",
      iconColor: "#D4A574",
      icon: <CalendarGlyph />,
      title: "Seasonal Flips",
      status: "coming soon",
      active: false,
      comingSoon: true,
    },
  ];
}

export default function SourcingCarousel({
  pennyItemCount,
  onTap,
}: SourcingCarouselProps) {
  // Date is created lazily on render — we don't need stable
  // SSR/CSR parity here because the parent dashboard already wraps
  // this in a client component with a useEffect-resolved `now`.
  const cards = buildCards(pennyItemCount, new Date());
  const activeCount = cards.filter((c) => !c.comingSoon).length;

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "#5A4E70",
          marginBottom: 8,
        }}
      >
        {activeCount} feed{activeCount === 1 ? "" : "s"} active
      </div>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="loot-carousel"
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingRight: 48,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((c) => (
            <SourcingCard
              key={c.feed}
              spec={c}
              onTap={() => onTap(c.feed)}
            />
          ))}
        </div>

        {/* Right-edge fade gradient — same affordance the deal
            carousels use. Tells the user there's more to scroll. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 48,
            background:
              "linear-gradient(to right, transparent 0%, #120e18 100%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
}

function SourcingCard({
  spec,
  onTap,
}: {
  spec: CardSpec;
  onTap: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const border = spec.comingSoon
    ? "1px dashed rgba(255,255,255,0.06)"
    : "1px solid rgba(255,255,255,0.06)";
  const dim = spec.comingSoon ? 0.4 : 1;
  const statusColor = spec.active ? "#5CE0B8" : "#3D2E55";

  // Active cards earn a colored top-edge inset glow keyed to the
  // icon color — Penny Drops camel, Color Tags periwinkle, Target
  // red. Combined with the global card-depth shadow so the glow
  // adds without erasing the lift. Coming-soon cards skip the glow
  // entirely; they recede.
  const topGlow = spec.active
    ? `, 0 -2px 8px ${spec.iconColor}1A inset`
    : "";
  const cardShadow =
    "0 2px 8px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.03) inset" +
    topGlow;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 155,
        minHeight: 140,
        backgroundColor: "rgba(23, 18, 42, 0.6)",
        borderRadius: 14,
        padding: 14,
        border,
        // Primary card depth + optional colored top-edge glow on
        // active cards (camel/periwinkle/red per icon color). See
        // cardShadow construction above.
        boxShadow: cardShadow,
        cursor: "pointer",
        userSelect: "none",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          color: spec.iconColor,
          opacity: dim,
        }}
      >
        {spec.icon}
      </span>
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 600,
          color: "#C8C0D8",
          opacity: dim,
          lineHeight: 1.25,
        }}
      >
        {spec.title}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: statusColor,
          lineHeight: 1.3,
          // Two-line clamp keeps long status strings from blowing
          // out card height — most are short but "X items this week"
          // can wrap on the narrowest carousel widths.
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {spec.status}
      </div>

      {/* Notification dot — lit when the feed has live content the
          user hasn't engaged with yet. Slow opacity pulse signals
          "active" peripherally without dominating the card. */}
      {spec.active && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "rgba(92, 224, 184, 0.5)",
            animation: "sourcingNotifPulse 2s ease-in-out infinite",
          }}
        />
      )}
      <style>{`
        @keyframes sourcingNotifPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
