"use client";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * FIRST-SCAN MOMENT — a single Flip-voice line under the first-time
 * scan CTA that sells the model without apology: scans run the Pro
 * engine, the daily game is free, that's the deal. Shown only to users
 * who have never seen the paywall and aren't Pro (page.tsx owns that
 * gate); it vanishes forever the first time the paywall opens.
 *
 * Motion: the line fades in AFTER the hero settles (--motion-fast, held
 * behind a delay), then a mint rule draws left→right under the payoff
 * phrase (transform: scaleX, --ease-out) — money = mint, one clean
 * gesture, no pulse.
 *
 * Reduced motion: no fade, no draw — the full line renders with its
 * mint underline already complete (the underline's resting transform is
 * scaleX(1); the draw only exists as an entrance).
 */
export default function FirstScanNote() {
  const reduced = useReducedMotion();

  return (
    <div
      style={{
        marginTop: 10,
        padding: "0 4px",
        textAlign: "center",
        animation: reduced
          ? undefined
          : "sgFade var(--motion-fast) var(--ease-out) 520ms both",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11.5,
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.52)",
          letterSpacing: "0.01em",
        }}
      >
        scans run the pro engine.{" "}
        <span style={{ position: "relative", color: "#5CE0B8", whiteSpace: "nowrap" }}>
          flip or skip&rsquo;s free daily
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -2,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(92,224,184,0.9), rgba(92,224,184,0.3))",
              transformOrigin: "left center",
              // Resting state is fully drawn; the draw is an entrance only,
              // so reduced motion shows the complete underline.
              animation: reduced
                ? undefined
                : "fsUnderline 440ms var(--ease-out) 760ms both",
            }}
          />
        </span>
        {" "}&mdash; no catch, no clock.
      </span>
    </div>
  );
}
