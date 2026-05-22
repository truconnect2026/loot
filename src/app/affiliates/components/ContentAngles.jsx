"use client";

import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

const ANGLES = [
  {
    n: "1",
    title: "THE GOODWILL SHOCK",
    body:
      "Film a thrift run. Scan items. Reveal prices on screen. Hook: \"I scanned everything in my cart and...\"",
    platforms: "TikTok, Reels",
  },
  {
    n: "2",
    title: "THE GRAIL HUNT",
    body:
      "Show ONE big find. The scan. The verdict. The eBay listing. The sale.",
    platforms: "TikTok, IG, YouTube Shorts",
  },
  {
    n: "3",
    title: "THE COMPARISON",
    body:
      "Show your old workflow (eBay tabs + spreadsheets) vs the app. Time saved = sold.",
    platforms: "YouTube, Twitter, Newsletter",
  },
  {
    n: "4",
    title: "THE BEGINNER GUIDE",
    body:
      "Position as the tool for new flippers. \"I started reselling 30 days ago and made $X with this app.\"",
    platforms: "Long-form video, blog, newsletter",
  },
  {
    n: "5",
    title: "THE NICHE PLAY",
    body:
      "Sneakers, vintage, glassware, specific niche creator — show the tool authenticating YOUR niche.",
    platforms: "All platforms",
  },
];

export default function ContentAngles() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="what's converting now" color={C.blue} />
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
            ANGLES THAT <span style={{ color: C.blue }}>PRINT.</span>
          </h2>
        </FadeUp>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {ANGLES.map((a, i) => (
            <FadeUp key={a.n} delay={0.08 * i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: 22,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: C.mint,
                    color: C.bg,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: 32,
                  }}
                >
                  {a.n}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-bebas), sans-serif",
                      fontSize: 26,
                      color: "#fff",
                      margin: 0,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {a.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                      lineHeight: 1.55,
                      margin: "8px 0 10px",
                    }}
                  >
                    {a.body}
                  </p>
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: C.mint,
                      opacity: 0.7,
                      textTransform: "uppercase",
                    }}
                  >
                    📊 working best for: {a.platforms}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
