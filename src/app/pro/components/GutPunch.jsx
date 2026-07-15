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
          <Eyebrow text="— vs what you use now" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              paddingBottom: "0.5em",
              marginBottom: 24,
            }}
          >
            vs GOOGLE LENS. vs <span style={{ color: C.mint }}>EBAY SOLD.</span>
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
            {/* Phase 3: name and beat the two tools a cold reseller actually
                uses — google lens + ebay sold-search — on the exact job they
                do today. Honest, not strawman (both genuinely need you to know
                what it is first; lens genuinely returns no sold prices). Same
                framing as the "is this just google lens?" FAQ. */}
            right now it&apos;s google lens &mdash; what it <em>is</em>, never what it sold for &mdash; or ebay
            sold-search: type it, sort by sold, scroll past the junk, still guessing on condition. loot needs
            one move: point. even at stuff you can&apos;t name &mdash; and it hands back real solds, condition,
            and a fake check.
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
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                what you use now
              </div>
              {/* Phase 3: the two named incumbents + their real failures, so
                  loot is beaten by name on the exact job. Legible (0.5), not a
                  dim strawman — these are true limits of each tool today. */}
              {[
                { tool: "google lens", fail: "what it IS — never what it sold for. no comps, no fake check." },
                { tool: "ebay sold search", fail: "type it (if you know it), sort by sold, scroll past the junk — still guessing on condition." },
              ].map((row) => (
                <div key={row.tool}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: 4,
                    }}
                  >
                    {row.tool}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {row.fail}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                position: "relative",
                background: "rgba(92,224,184,0.06)",
                border: "1px solid rgba(92,224,184,0.25)",
                borderRadius: 14,
                padding: "24px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              {/* faint interior glow so the payoff panel reads charged,
                  not empty (static, opacity-only) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 50% 60%, rgba(92,224,184,0.14) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              {/* label pinned to the panel top (mirrors the old-way
                  card's label position) so the payoff type below can
                  TRULY center in the remaining space — with the label
                  in-flow it sat high and left dead space underneath */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 12,
                  right: 12,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.mint,
                }}
              >
                loot
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  // Scaled up to own the panel instead of floating in it.
                  fontSize: "clamp(44px,11.5vw,72px)",
                  lineHeight: 1.05,
                  letterSpacing: "0.03em",
                  color: "#fff",
                  position: "relative",
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
