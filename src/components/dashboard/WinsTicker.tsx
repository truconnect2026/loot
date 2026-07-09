"use client";

import { useEffect, useState } from "react";

/**
 * Anonymized wins ticker — a single-line rotating signal that other
 * resellers are using the app. Keeps the page from feeling lonely
 * when the user has no scan history of their own yet.
 *
 * Static at launch. When the listings + scans feeds wire up for real,
 * this can pull from a Supabase view that anonymizes recent BUY
 * verdicts within the user's zip range. For now: a curated rotation.
 *
 * Voice rule: lowercase, no terminal periods, mid-line punctuation OK.
 * Color rule: amounts in mint (money), narrator copy in muted grey.
 */

interface WinMessage {
  /** The narrator part — neutral grey. */
  prefix: string;
  /** The amount — mint, money. Empty string when there's no money phrase. */
  amount?: string;
  /** Anything that comes after the amount. */
  suffix?: string;
}

// Order matters: 7s rotation × 5 messages = 35s full loop. Most users
// only see the first message before scrolling away or tapping into a
// scan flow, so the slot at index 0 has to land. Ordered by impact —
// biggest dollar amount + most recognizable thrift-flip item first,
// then concrete dollar stories, then ambient activity counts last.
// Impact decreases monotonically from index 0 to the end of the array.
const WINS: WinMessage[] = [
  // Highest dollar + iconic thrift-flip brand. The opener.
  {
    prefix: "vintage Pyrex flip near you — ",
    amount: "+$120",
  },
  // Solid dollar + universally recognizable household brand.
  {
    prefix: "a reseller near you flipped a KitchenAid for ",
    amount: "+$85",
  },
  // Smaller absolute number but the strongest leverage story (16× return)
  // — the kind of detail a reseller forwards to their group chat.
  {
    prefix: "someone scored a $5 cast iron worth ",
    amount: "$80",
    suffix: " nearby",
  },
  // Ambient activity, no dollar — implies profitable transactions
  // happening nearby.
  {
    prefix: "3 deals claimed in your area today",
  },
  // Ambient volume, no dollar — softest signal, sits last.
  {
    prefix: "12 free curbside finds posted in your area today",
  },
];

const ROTATE_MS = 7000;
const FADE_MS = 320;

export default function WinsTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Rotation: fade out → swap message → fade in. setTimeout pair so
    // the swap happens with the message hidden, no jarring text change.
    const tick = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % WINS.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => window.clearInterval(tick);
  }, []);

  const win = WINS[index] ?? WINS[0];
  if (!win) return null;

  return (
    // Outer: full-width centering row so the pill sits centered in
    // whatever container the ticker is dropped into. The pill
    // itself is the inline-flex chip below.
    <div style={{ display: "flex", justifyContent: "center" }}>
    <div
      role="status"
      aria-live="polite"
      style={{
        // Pill — frames the ticker as intentional content instead
        // of floating prose. Soft 0.02 white surface + 20px corners
        // gives it just enough chrome to read as a chip without
        // competing with the section header above.
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.02)",
        opacity: visible ? 0.9 : 0,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {/* Live indicator dot — pulses 0.4 → 1.0 over 2s for subtle
          urgency. The pulse cadence is the rhythm of the ticker
          itself: each rotation is 7s, so the dot breathes ~3.5
          times per message. Mint at 70% alpha. */}
      <span
        aria-hidden="true"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: "rgba(92, 224, 184, 0.7)",
          flexShrink: 0,
          animation: "winsTickerPulse 2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes winsTickerPulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>
      <span
        style={{
          // Slightly brighter than the previous 50% white so the
          // ticker reads at arm's length without competing with the
          // section headers above. Stays secondary to the carousel
          // cards below.
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "#8A7FA0",
          letterSpacing: "0.01em",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.3,
        }}
      >
        {win.prefix}
        {win.amount && (
          <span
            style={{
              // Money number — JBMono 13/700 mint. Slightly larger
              // than the surrounding 12px prose so the dollar amount
              // earns peripheral attention.
              fontFamily: "var(--font-space-mono)",
              fontSize: 13,
              color: "#5CE0B8",
              fontWeight: 700,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {win.amount}
          </span>
        )}
        {win.suffix}
      </span>
    </div>
    </div>
  );
}
