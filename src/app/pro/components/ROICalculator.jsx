"use client";

import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_SIZE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

export default function ROICalculator() {
  return (
    <section
      className="pro-snap-section"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
        background: "linear-gradient(180deg, rgba(92,224,184,0.025) 0%, transparent 100%)",
      }}
    >
      <SectionShell style={{ textAlign: "center" }}>
        <FadeUp>
          <Eyebrow text="the math" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: SECTION_HEADLINE_SIZE,
              lineHeight: 1.1,
              margin: "0 0 28px",
              padding: 0,
            }}
          >
            CHEAPER THAN <span style={{ color: C.mint }}>ONE BAD BUY.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            one find you&apos;d have overpaid on covers the month.
          </p>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
