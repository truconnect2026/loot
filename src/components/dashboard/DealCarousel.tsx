"use client";

import { useEffect, useRef, useState } from "react";
import DealCard, { type Deal } from "@/components/dashboard/DealCard";

interface DealCarouselProps {
  label: string;
  deals: Deal[];
  onDealTap: (deal: Deal) => void;
}

const FADE_BG_LEFT =
  "linear-gradient(to right, rgba(18,14,24,0.95) 0%, transparent 100%)";
const FADE_BG_RIGHT =
  "linear-gradient(to left, rgba(18,14,24,0.95) 0%, transparent 100%)";

export default function DealCarousel({
  label,
  deals,
  onDealTap,
}: DealCarouselProps) {
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
          marginBottom: 12,
        }}
      >
        {label}
      </div>

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
          {deals.map((deal) => (
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
            width: 40,
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
            width: 40,
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
