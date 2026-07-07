"use client";

import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";

export default function GutPunch() {
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
          <Eyebrow text="— the difference" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
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
              fontSize: SECTION_BODY_SIZE,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.6,
            }}
          >
            the old way needs you to already know what it is, pull your phone, type it, sort by sold,
            scroll past the junk. loot needs you to point. even at stuff you can&apos;t name.
          </p>
        </FadeUp>

        {/* Old-way vs loot — the density contrast IS the argument: left
            crowded/dim/tedious, right sparse/bright/one move. */}
        <FadeUp delay={0.4}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 40,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "16px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 12,
                }}
              >
                the old way
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {["know what it is", "pull your phone", "type it", "sort by sold", "scroll past junk"].map(
                  (step, i, arr) => (
                    <div key={step}>
                      <div
                        style={{
                          fontFamily: "var(--font-manrope), sans-serif",
                          fontSize: 12,
                          lineHeight: 1.3,
                          color: "rgba(255,255,255,0.42)",
                          padding: "5px 8px",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 6,
                        }}
                      >
                        {step}
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          aria-hidden="true"
                          style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.16)",
                            fontSize: 10,
                            lineHeight: "14px",
                          }}
                        >
                          &darr;
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div
              style={{
                background: "rgba(92,224,184,0.06)",
                border: "1px solid rgba(92,224,184,0.25)",
                borderRadius: 14,
                padding: "24px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.mint,
                  marginBottom: 16,
                }}
              >
                loot
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(28px,7vw,44px)",
                  lineHeight: 1.1,
                  letterSpacing: "0.03em", // Bebas sub-32px optical tracking
                  color: "#fff",
                }}
              >
                point.
                <br />
                <span style={{ color: C.mint }}>done.</span>
              </div>
            </div>
          </div>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
