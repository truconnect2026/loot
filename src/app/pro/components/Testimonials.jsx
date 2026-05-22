"use client";

import { C } from "../lib/colors.js";
import { CheckIcon, Eyebrow, FadeUp } from "./atoms.jsx";

const reviewsData = [
  {
    mono: "T",
    h: "@thriftking47",
    t: "2h",
    stars: 5,
    q: "scanned 12 items at goodwill in 8 mins. caught a $180 le creuset i would've walked past. pro pays for itself daily.",
  },
  {
    mono: "C",
    h: "@crate_digger_atl",
    t: "6h",
    stars: 5,
    q: "the yard sale map alone is worth it. found 3 estate sales i didn't know about saturday. came home with $400 in inventory.",
  },
  {
    mono: "G",
    h: "@goodwillgrails",
    t: "1d",
    stars: 5,
    q: "BOLO pinged me on a Polo Stadium '92 in the bins. $14 → $400. paid for the year in one find.",
  },
  {
    mono: "F",
    h: "@flipperflora",
    t: "2d",
    stars: 4,
    q: "replaced my vendoo + ebay tabs + spreadsheets workflow. love it. only ask: wish the yard sale map covered more rural areas.",
  },
];

export default function Testimonials() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="from the hunters" color={C.blue} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: "0.5em",
            }}
          >
            REAL FLIPPERS.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              color: C.blue,
              marginBottom: 40,
            }}
          >
            REAL FLIPS.
          </p>
        </FadeUp>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {reviewsData.map((r, i) => (
            <FadeUp key={i} delay={0.08 * i}>
              <div
                className="review-card"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: 24,
                  transition: "border-color 0.25s",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        border: "2px solid rgba(92,224,184,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-bebas), sans-serif",
                        fontSize: 22,
                        color: C.mint,
                        background: "transparent",
                      }}
                    >
                      {r.mono}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "#fff" }}>
                          {r.h}
                        </span>
                        <CheckIcon size={13} color={C.mint} />
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontSize: 11,
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        {r.t} · loot.works
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {[0, 1, 2, 3, 4].map((j) => (
                      <span
                        key={j}
                        style={{
                          color: j < r.stars ? C.gold : "rgba(255,255,255,0.15)",
                          fontSize: 15,
                          textShadow: j < r.stars ? "0 0 8px rgba(245,197,24,0.4)" : "none",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-manrope), sans-serif",
                    fontSize: 15,
                    color: "rgba(255,255,255,0.82)",
                    lineHeight: 1.6,
                  }}
                >
                  {r.q}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
