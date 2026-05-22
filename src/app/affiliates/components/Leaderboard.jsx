"use client";

import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

/**
 * TODO(David): wire this to real data once 5+ affiliates exist. Two paths:
 *   1. Pull from Digistore reporting API (manual export → JSON in /lib/)
 *   2. Hardcode top names monthly until automation is worth it
 * Until then we render a placeholder card so the section exists but doesn't
 * lie about traction.
 */
export default function Leaderboard() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="top affiliates this month" color={C.gold} />
        </FadeUp>

        <FadeUp delay={0.2}>
          <div
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "clamp(32px,5vw,56px)",
              textAlign: "center",
              marginTop: 24,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(40px,5vw,56px)",
                color: C.gold,
                opacity: 0.4,
                lineHeight: 1,
              }}
            >
              🪐
            </div>
            <h3
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(28px,4vw,40px)",
                color: "#fff",
                margin: "16px 0 12px",
                letterSpacing: "0.02em",
              }}
            >
              COMING SOON
            </h3>
            <p
              style={{
                fontFamily: "var(--font-manrope), sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.5)",
                margin: 0,
                lineHeight: 1.55,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Top affiliates will be featured here once the program ramps. Be the first.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
