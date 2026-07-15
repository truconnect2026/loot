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

// HOW IT WORKS — the dead-simple mechanic, taught before any feature can
// matter. point -> know -> decide, scannable in two seconds. The "even the
// stuff you can't name" hook (step 1) is the page's most differentiated
// promise and pre-answers the beginner objection. This is the POSITIVE
// "here's how"; it complements GutPunch's "vs the old grind" contrast rather
// than repeating it. Picker voice, lowercase, tight.
//
// Entrance is the shared FadeUp (compositor opacity/transform); reduced
// motion renders each step in its end-state with no transition (Reveal
// handles the static twin), and the mint rail is a static gradient.
const STEPS = [
  {
    n: "01",
    verb: "point",
    caption: "your phone at anything in the bin —",
    hook: "even the stuff you can't name.",
  },
  {
    n: "02",
    verb: "know",
    caption: "real ebay sold comps, condition, and a fake check. in seconds.",
  },
  {
    n: "03",
    verb: "decide",
    caption: "buy it or skip it — before you're stuck with it.",
  },
];

export default function HowItWorks() {
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
      <SectionShell>
        <FadeUp>
          <Eyebrow text="— how it works" color={C.mint} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2 style={{ ...SECTION_HEADLINE_STYLE, paddingBottom: "0.25em", marginBottom: 14 }}>
            POINT AT <span style={{ color: C.mint }}>ANYTHING.</span>
          </h2>
        </FadeUp>
        <FadeUp delay={0.28}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.55,
              margin: "0 0 34px",
            }}
          >
            even the stuff you can&apos;t name. here&apos;s the whole loop &mdash; in the time it takes to pick it up.
          </p>
        </FadeUp>

        <div style={{ position: "relative" }}>
          {/* mint rail behind the nodes — static gradient, reads as flow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 21,
              top: 16,
              bottom: 16,
              width: 2,
              background: "linear-gradient(180deg, rgba(92,224,184,0.55), rgba(92,224,184,0.1))",
            }}
          />
          {STEPS.map((s, i) => (
            <FadeUp key={s.n} delay={0.36 + i * 0.12}>
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                  marginBottom: i < STEPS.length - 1 ? 20 : 0,
                  position: "relative",
                }}
              >
                {/* node — masks the rail so numbers sit ON the line */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: `1.5px solid ${C.mint}`,
                    background: "rgba(7,5,16,0.92)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: 20,
                    color: C.mint,
                    letterSpacing: "0.02em",
                    boxShadow: "0 0 16px rgba(92,224,184,0.18)",
                  }}
                >
                  {s.n}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-bebas), sans-serif",
                      fontSize: "clamp(26px,7vw,34px)",
                      lineHeight: 1,
                      letterSpacing: "0.03em",
                      color: "#fff",
                      marginBottom: 5,
                    }}
                  >
                    {s.verb}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,0.62)",
                    }}
                  >
                    {s.caption}
                    {s.hook && (
                      <>
                        {" "}
                        <span style={{ color: C.gold, fontWeight: 600 }}>{s.hook}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </SectionShell>
    </section>
  );
}
