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

const WINS: WinMessage[] = [
  {
    prefix: "a reseller near you flipped a KitchenAid for ",
    amount: "+$85",
  },
  {
    prefix: "3 deals claimed in your area today",
  },
  {
    prefix: "someone scored a $5 cast iron worth ",
    amount: "$80",
    suffix: " nearby",
  },
  {
    prefix: "12 free curbside finds posted in your area today",
  },
  {
    prefix: "vintage Pyrex flip near you — ",
    amount: "+$120",
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
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 18,
        opacity: visible ? 0.9 : 0,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {/* Tiny pulsing dot — signals "live" without claiming real-time */}
      <span
        aria-hidden="true"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: "rgba(116, 182, 160, 0.7)",
          flexShrink: 0,
          animation: "winsTickerPulse 2.4s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes winsTickerPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "rgba(255,255,255,0.50)",
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
              color: "var(--money)",
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
  );
}
