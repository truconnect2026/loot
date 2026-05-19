"use client";

import { FontLoader, ScreenFrame, TabBar, TOKENS } from "../_frame";

type Card = {
  badge: string;
  badgeBg: string;
  title: string;
  meta: string;
  amount: string;
  posted: string;
  highlighted?: boolean;
};

const CARDS: Card[] = [
  {
    badge: "🚨 BOLO",
    badgeBg: TOKENS.mint,
    title: "90s Carhartt Detroit Jacket spotted",
    meta: "2.4 mi · $8 likely",
    amount: "$8",
    posted: "Posted 12m ago",
    highlighted: true,
  },
  {
    badge: "💰 PENNY",
    badgeBg: TOKENS.camel,
    title: "Goodwill Decatur — books 90% off Mon",
    meta: "4.1 mi · Storewide",
    amount: "−90%",
    posted: "1h ago",
  },
  {
    badge: "🆓 FREE",
    badgeBg: TOKENS.periwinkle,
    title: "Curb find: vintage Pyrex set",
    meta: "1.8 mi · Cherrywood Dr",
    amount: "FREE",
    posted: "23m ago",
  },
  {
    badge: "⚡ CLEARANCE",
    badgeBg: "#F0D26B",
    title: "Estate sale Sat — vintage clothing",
    meta: "6.2 mi · 60% off Day 2",
    amount: "−60%",
    posted: "Tomorrow",
  },
];

export default function DealFeedScreen() {
  return (
    <ScreenFrame>
      <FontLoader />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 18,
          right: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          DEAL FEED
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className="ms-pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: TOKENS.mint,
              boxShadow: `0 0 10px ${TOKENS.mint}`,
              display: "inline-block",
            }}
          />
          <span
            className="ms-mono"
            style={{
              fontSize: 10,
              color: TOKENS.mint,
              letterSpacing: "0.2em",
              fontWeight: 700,
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 18,
          right: 0,
          display: "flex",
          gap: 8,
          overflow: "hidden",
        }}
      >
        {[
          { label: "ALL", active: true },
          { label: "BOLO" },
          { label: "PENNIES" },
          { label: "FREE" },
          { label: "CLEARANCE" },
        ].map((c) => (
          <div
            key={c.label}
            className="ms-mono"
            style={{
              padding: "6px 12px",
              fontSize: 10,
              letterSpacing: "0.16em",
              fontWeight: 700,
              border: `1px solid ${
                c.active ? TOKENS.mint : "rgba(255,255,255,0.18)"
              }`,
              background: c.active ? TOKENS.mint : "transparent",
              color: c.active ? "#000" : "rgba(255,255,255,0.65)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Feed list */}
      <div
        style={{
          position: "absolute",
          top: 108,
          left: 18,
          right: 18,
          bottom: 76,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {CARDS.map((c, i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${
                c.highlighted
                  ? "rgba(92, 224, 184, 0.4)"
                  : "rgba(92, 224, 184, 0.15)"
              }`,
              background: c.highlighted
                ? "rgba(92, 224, 184, 0.04)"
                : "rgba(10, 10, 10, 0.45)",
              padding: "12px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                className="ms-mono"
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  background: c.badgeBg,
                  color: "#000",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                }}
              >
                {c.badge}
              </span>
              <span
                className="ms-mono"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color:
                    c.amount === "FREE"
                      ? TOKENS.periwinkle
                      : c.amount.startsWith("−")
                      ? TOKENS.camel
                      : TOKENS.mint,
                }}
              >
                {c.amount}
              </span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.25,
              }}
            >
              {c.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                className="ms-mono"
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {c.meta}
              </span>
              <span
                className="ms-mono"
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.08em",
                }}
              >
                {c.posted}
              </span>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="feed" />
    </ScreenFrame>
  );
}
