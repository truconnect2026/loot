"use client";

import { C } from "../lib/colors.js";
import {
  Eyebrow,
  ExampleTag,
  FadeUp,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

// REAL-PROOF SLOT — scaffolded honest, filled with real assets later.
//
// We do NOT fake testimonials, names, quotes, ratings, or counts. Until David
// has a REAL win asset (a genuine before->comp->sold screenshot, or a quote he
// has permission to use), this shows an EXAMPLE-tagged illustration of the
// MATH — flagged with the same EXAMPLE system as every other demo — so the
// section reads finished without pretending to be a real result. Chosen over
// an empty slot (which would look unfinished) per Phase 3.1(b).
//
// >>> DAVID / REAL-ASSET TASK: replace WIN below with a real win. The layout
//     swaps 1:1 — drop in a genuine found->sold pair (and/or a screenshot
//     <img>) or a permissioned quote. REMOVE the <ExampleTag> the moment the
//     content is a real, verifiable result (keep it only while illustrative).
//     If a real, confirmable number exists (e.g. a Supabase "X scans run"),
//     it can seed a stat here too — but never guess it. When a REAL win is in
//     place, flip the eyebrow back to "— real wins" (honest once it's real). <<<
const WIN = {
  found: "$4",
  foundLabel: "thrift tag",
  sold: "$87",
  soldLabel: "sold in 4 days",
  comps: "real ebay solds: $75–$95",
};

function Stat({ value, label, color, glow = false }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "clamp(40px,11vw,64px)",
          lineHeight: 1,
          letterSpacing: "0.02em",
          color,
          fontVariantNumeric: "tabular-nums",
          filter: glow ? "drop-shadow(0 0 22px rgba(92,224,184,0.4))" : "none",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function RealWins() {
  return (
    <section
      className="pro-snap-section"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionShell maxWidth={600}>
        <FadeUp>
          {/* Honest for the current illustrative state — the section shows
              what a win LOOKS like (EXAMPLE below), not a claimed result.
              Becomes "— real wins" once David drops in real assets. */}
          <Eyebrow text="— what a win looks like" color={C.mint} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2 style={{ ...SECTION_HEADLINE_STYLE, paddingBottom: "0.25em", marginBottom: 16 }}>
            THE SHAPE OF A <span style={{ color: C.mint }}>GOOD FLIP.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.28}>
          <div
            style={{
              position: "relative",
              background: "rgba(92,224,184,0.05)",
              border: "1px solid rgba(92,224,184,0.22)",
              borderRadius: 18,
              padding: "clamp(22px,4vw,30px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <ExampleTag label="EXAMPLE" />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(16px,5vw,34px)",
              }}
            >
              <Stat value={WIN.found} label={WIN.foundLabel} color="rgba(255,255,255,0.85)" />
              <div
                aria-hidden="true"
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(28px,7vw,40px)",
                  color: C.mint,
                  lineHeight: 1,
                }}
              >
                &rarr;
              </div>
              <Stat value={WIN.sold} label={WIN.soldLabel} color={C.mint} glow />
            </div>

            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                letterSpacing: "0.04em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {WIN.comps}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.55,
              textAlign: "center",
              margin: "16px 0 0",
            }}
          >
            an illustration of the math &mdash; the kind of gap loot is built to catch before you walk past it.
          </p>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
