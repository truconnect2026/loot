"use client";

import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

const CARDS = [
  {
    title: "PROVEN MARKET",
    body:
      "130M Americans resell. Reselling tools is a $2B/yr category. AI thrift is brand new. You're early.",
  },
  {
    title: "RIDICULOUS HOOK",
    body:
      "FLIP OR SKIP daily game brings traffic. Pro converts it. Free → Pro funnel is built in.",
  },
  {
    title: "STICKY PRODUCT",
    // TODO(David): "8+ months" retention claim is unverified — confirm against
    // real Stripe + Digistore subscription retention data before submitting
    // /affiliates for external review.
    body:
      "Users scan 50-200 items/weekend. Once they're hooked, they stay. Avg retention 8+ months.",
  },
];

export default function WhyConverts() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="why this product moves" color={C.gold} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              margin: "0 0 48px",
            }}
          >
            BUILT TO <span style={{ color: C.gold }}>CONVERT.</span>
          </h2>
        </FadeUp>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {CARDS.map((card, i) => (
            <FadeUp key={i} delay={0.1 * i}>
              <div
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(92,224,184,0.2)",
                  borderRadius: 16,
                  padding: 28,
                  height: "100%",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: 28,
                    color: C.mint,
                    margin: 0,
                    marginBottom: 16,
                    letterSpacing: "0.02em",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-manrope), sans-serif",
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.7)",
                    margin: 0,
                  }}
                >
                  {card.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
