"use client";

import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp } from "./atoms.jsx";

export default function ROICalculator() {
  return (
    <section
      className="pro-snap-section"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "clamp(52px,6.5vw,84px) 24px",
        position: "relative",
        zIndex: 1,
        background: "linear-gradient(180deg, rgba(92,224,184,0.025) 0%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <FadeUp>
          <Eyebrow text="the math" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(40px,7vw,72px)",
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
              fontSize: "clamp(17px,2.2vw,22px)",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            one find you&apos;d have overpaid on covers the month.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
