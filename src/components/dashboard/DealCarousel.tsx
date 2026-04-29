"use client";

import DealCard, { type DealItem } from "./DealCard";

interface DealCarouselProps {
  label: string;
  deals: DealItem[];
  onDealTap: (deal: DealItem) => void;
  emptyMessage?: string;
}

export default function DealCarousel({
  label,
  deals,
  onDealTap,
  emptyMessage = "No deals nearby right now.",
}: DealCarouselProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            color: "#3D2E55",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {deals.length > 0 && (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 9,
              color: "#5CE0B8",
            }}
          >
            · {deals.length}
          </span>
        )}
      </div>

      <div
        className="carousel-row"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap: 10,
          paddingRight: 18,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {deals.length === 0 ? (
          <div
            style={{
              width: 260,
              height: 150,
              flexShrink: 0,
              border: "1px dashed rgba(255,255,255,0.06)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: "#3D2E55",
              padding: 16,
              textAlign: "center",
              scrollSnapAlign: "start",
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onTap={onDealTap} />
          ))
        )}
      </div>
    </>
  );
}
