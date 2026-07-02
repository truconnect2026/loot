"use client";

import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp } from "./atoms.jsx";

export default function TheEdgeSection() {
  return (
    <section style={{ padding: "clamp(64px,8vw,96px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="— the edge" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(36px,6vw,64px)",
              lineHeight: 1.15,
              margin: "0 0 20px",
              padding: 0,
              color: "#fff",
            }}
          >
            the picker next to you is guessing.
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: "clamp(16px,2vw,20px)",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              maxWidth: 620,
              margin: 0,
            }}
          >
            you&apos;re not. point, scan, and you&apos;ve got the maker, the year, and what it actually
            sold for, while he&apos;s still turning it over trying to remember if it&apos;s the good one.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
