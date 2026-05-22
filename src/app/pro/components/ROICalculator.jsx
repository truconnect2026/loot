"use client";

import { useState } from "react";
import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp, ShimmerText } from "./atoms.jsx";

const sliderTrack = (val, min, max, color) => ({
  background: `linear-gradient(to right, ${color} ${((val - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((val - min) / (max - min)) * 100}%)`,
});

export default function ROICalculator() {
  const [flips, setFlips] = useState(4);
  const [avg, setAvg] = useState(75);

  const monthly = Math.round(flips * avg * 4.33);
  const roi = Math.round(((monthly - 14.99) / 14.99) * 100);
  const fraction = 14.99 / avg;

  let punchline;
  if (fraction < 1) {
    const pct = Math.ceil(fraction * 100);
    punchline = (
      <>
        pro pays for itself with just{" "}
        <span style={{ color: C.mint, fontWeight: 700 }}>{pct}%</span> of one flip
      </>
    );
  } else {
    const n = Math.ceil(fraction);
    punchline = (
      <>
        pro pays for itself in just{" "}
        <span style={{ color: C.mint, fontWeight: 700 }}>{n}</span> flip{n > 1 ? "s" : ""}
      </>
    );
  }

  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "clamp(80px,10vw,128px) 24px",
        position: "relative",
        zIndex: 1,
        background: "linear-gradient(180deg, rgba(92,224,184,0.025) 0%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="do the math" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: "0.5em",
            }}
          >
            PRO PAYS FOR ITSELF.
          </h2>
          <p
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              color: C.mint,
              marginBottom: 40,
            }}
          >
            IN ONE FLIP.
          </p>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div
            style={{
              background: C.card,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "clamp(24px,4vw,40px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
            }}
          >
            {/* Flips per week */}
            <div style={{ marginBottom: 40 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 16,
                }}
              >
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  flips per week
                </label>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(48px,8vw,72px)",
                    color: C.mint,
                    lineHeight: 1,
                  }}
                >
                  {flips}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={flips}
                onChange={(e) => setFlips(+e.target.value)}
                className="slider-mint"
                style={sliderTrack(flips, 1, 20, C.mint)}
              />
            </div>

            {/* Avg flip profit */}
            <div style={{ marginBottom: 40 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 16,
                }}
              >
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  avg flip profit
                </label>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(48px,8vw,72px)",
                    color: C.gold,
                    lineHeight: 1,
                  }}
                >
                  ${avg}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={avg}
                onChange={(e) => setAvg(+e.target.value)}
                className="slider-gold"
                style={sliderTrack(avg, 10, 500, C.gold)}
              />
            </div>

            {/* Results */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: 28,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 20,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  you make
                </p>
                <p
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(28px,4vw,42px)",
                    color: C.mint,
                  }}
                >
                  ${monthly.toLocaleString()}
                  <span style={{ fontSize: "0.45em", color: "rgba(255,255,255,0.35)" }}>/mo</span>
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  pro costs
                </p>
                <p
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(28px,4vw,42px)",
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  $14.99
                  <span style={{ fontSize: "0.45em", color: "rgba(255,255,255,0.25)" }}>/mo</span>
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  pro ROI
                </p>
                <ShimmerText
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(28px,4vw,42px)",
                    display: "block",
                  }}
                >
                  {roi.toLocaleString()}%
                </ShimmerText>
              </div>
            </div>

            <p
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 16,
                color: "rgba(255,255,255,0.55)",
                marginTop: 28,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {punchline}
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
