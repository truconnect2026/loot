"use client";

import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp } from "./atoms.jsx";
import { useInView, usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

// Editorial timeline bar — fills on scroll-into-view (transform: scaleX only),
// jumps straight to its end state under prefers-reduced-motion.
function CompareBar({ label, sublabel, color, targetScale, delay }) {
  const [ref, inView] = useInView();
  const reduced = usePrefersReducedMotion();
  const filled = reduced || inView;
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
      <div style={{ width: 148, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            fontWeight: 700,
            color,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            marginLeft: 6,
          }}
        >
          {sublabel}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            borderRadius: 3,
            background: color,
            transformOrigin: "left center",
            transform: `scaleX(${filled ? targetScale : 0})`,
            transition: reduced ? "none" : `transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
          }}
        />
      </div>
    </div>
  );
}

export default function TheEdgeSection() {
  return (
    <section
      className="pro-snap-section"
      style={{ padding: "clamp(42px,5.2vw,62px) 24px", position: "relative", zIndex: 1 }}
    >
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

        <FadeUp delay={0.45}>
          <div style={{ marginTop: 40, maxWidth: 480 }}>
            <CompareBar
              label="THEM"
              sublabel="~90 seconds, guessing"
              color="rgba(255,255,255,0.35)"
              targetScale={1}
              delay={0}
            />
            <CompareBar
              label="YOU"
              sublabel="about a second, locked"
              color={C.mint}
              targetScale={0.05}
              delay={0.15}
            />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
