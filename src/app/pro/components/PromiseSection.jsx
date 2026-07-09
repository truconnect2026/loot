"use client";

import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

/**
 * The human beat — guarantee + founder, directly before the closer.
 * De-risking only: no CTA here (the final CLAIM sits one swipe below),
 * no timers, no motion beyond the shared FadeUp reveals (which already
 * respect prefers-reduced-motion with a static end-state). The shield
 * accent is a static inline SVG, mint, deliberately quiet.
 */

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 44 50" width="40" height="46" aria-hidden="true" style={{ display: "block", opacity: 0.8 }}>
      <path
        d="M22 3 L39 9 L39 24 Q39 39 22 47 Q5 39 5 24 L5 9 Z"
        fill="rgba(92,224,184,0.06)"
        stroke={C.mint}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <text
        x="22"
        y="29"
        textAnchor="middle"
        fill={C.mint}
        fontFamily="var(--font-bebas), sans-serif"
        fontSize="17"
        letterSpacing="0.03em"
      >
        60
      </text>
    </svg>
  );
}

export default function PromiseSection() {
  return (
    <section
      className="pro-snap-section"
      style={{
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionShell maxWidth={720}>
        <FadeUp>
          <div style={{ marginBottom: 18 }}>
            <ShieldGlyph />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <Eyebrow text="— the promise" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              margin: "0 0 24px",
              padding: 0,
              color: "#fff",
            }}
          >
            60 days. <span style={{ color: C.mint }}>my problem, not yours.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.28}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            run loot pro for two months. if it doesn&apos;t find you more than it costs, email me
            and i refund every cent. cancel anytime, keep your account till the day it ends.
          </p>
        </FadeUp>

        <FadeUp delay={0.38}>
          {/* TODO(David): the brief's founder line ends with
              [DAVID_FOUNDER_SENTENCE] — a sentence only you can write.
              Shipping the placeholder token would print bracket-text on a
              live sales page, so only the real first sentence ships until
              you supply the second. */}
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              letterSpacing: "0.06em",
              lineHeight: 1.7,
              color: "rgba(92,224,184,0.6)",
              margin: "26px 0 0",
            }}
          >
            built by someone who got burned in the aisle, not a startup.
          </p>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
