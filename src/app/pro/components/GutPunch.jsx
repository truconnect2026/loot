"use client";

import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp } from "./atoms.jsx";

export default function GutPunch() {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "clamp(80px,10vw,128px) 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="the difference" color={C.blue} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: 24,
            }}
          >
            THE OLD WAY VS <span style={{ color: C.mint }}>LOOT.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: "clamp(16px,2vw,20px)",
              color: "rgba(255,255,255,0.65)",
              maxWidth: 620,
              lineHeight: 1.6,
            }}
          >
            the old way needs you to already know what it is, pull your phone, type it, sort by sold,
            scroll past the junk. loot needs you to point. even at stuff you can&apos;t name.
          </p>
        </FadeUp>

        {/* PROMPT 2: old-way vs loot two-column visual */}
      </div>
    </section>
  );
}
