"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { C } from "../lib/colors.js";
import { getPuzzleNumber } from "../../flip/lib/dailySeed.js";

/**
 * Legit signal — a quiet mono band between the closer and the footer.
 * True facts only: who builds this, how checkout is processed, a
 * plain refund-policy link (terms live on /refund-policy — the sales
 * page carries the legal minimum), and a link to the free daily game,
 * which is the living proof the product is real. The puzzle number
 * comes from the same daily-index helper the game itself uses
 * (src/app/flip/lib/dailySeed.js) — computed after mount because this
 * page is statically prerendered and Date.now() at build time would
 * hydrate stale.
 *
 * Deliberately NOT a snap section — it flows as trailing content
 * before the footer, same as the footer itself. No timers, no loops,
 * no animation beyond link hover color.
 */

const mono = { fontFamily: "var(--font-mono), monospace" };

function Item({ children }) {
  return (
    <span
      style={{
        ...mono,
        fontSize: 11,
        letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.45)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </span>
  );
}

const linkStyle = {
  color: "rgba(92,224,184,0.75)",
  textDecoration: "none",
  borderBottom: "1px solid rgba(92,224,184,0.3)",
};

export default function LegitStrip() {
  // Client-only puzzle number — null until mounted (SSR renders the
  // line without the day number rather than baking a build-time date).
  const [day, setDay] = useState(null);
  useEffect(() => {
    setDay(getPuzzleNumber());
  }, []);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        // Tight vertical padding on purpose: strip + footer must fit one
        // 850px-class viewport together, since they share the single
        // end-aligned snap rest position at the bottom of the scroller.
        padding: "20px 24px 22px",
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 7,
          textAlign: "center",
        }}
      >
        <Item>built by one reseller-obsessed engineer. no vc, no growth team.</Item>
        <Item>secure checkout by stripe</Item>
        <Item>
          <Link href="/refund-policy" style={linkStyle}>
            refund policy
          </Link>
        </Item>
        <Item>
          <Link href="/flip" style={{ ...linkStyle, color: C.mint, borderBottomColor: "rgba(92,224,184,0.5)" }}>
            {/* number renders client-side post-mount (static prerender
                must not bake a build date); width reserved so the line
                never shifts when N lands */}
            <span style={{ display: "inline-block", minWidth: "2.2ch", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {day !== null ? day : "\u00a0"}
            </span>{" "}
            daily drops and counting. play today&apos;s free &rarr;
          </Link>
        </Item>
      </div>
    </div>
  );
}
