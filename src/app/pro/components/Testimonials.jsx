"use client";

import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp } from "./atoms.jsx";

/**
 * Compliance — these are beta-tester quotes shown as "early feedback", NOT
 * verified in-app reviews:
 *   - removed verified ✓ checkmark (no review platform is verifying these)
 *   - removed time stamps ("2h", "6h") that imply a live review feed
 *   - changed @handle prefix to "—" so they read as attribution not platform
 *   - removed star rating column (no rating system exists yet)
 *   - added "early feedback from our beta testers" disclaimer above
 *
 * TODO(David): replace these with REAL beta tester quotes you have written
 * permission to display, OR remove this section entirely before Digistore
 * submits for approval.
 */
const reviewsData = [
  {
    mono: "T",
    h: "thriftking47",
    q: "scanned 12 items at goodwill in 8 mins. caught a $180 le creuset i would've walked past. pro pays for itself daily.",
  },
  {
    mono: "C",
    h: "crate_digger_atl",
    q: "the yard sale map alone is worth it. found 3 estate sales i didn't know about saturday. came home with $400 in inventory.",
  },
  {
    mono: "G",
    h: "goodwillgrails",
    q: "BOLO pinged me on a Polo Stadium '92 in the bins. $14 → $400. paid for the year in one find.",
  },
  {
    mono: "F",
    h: "flipperflora",
    q: "replaced my vendoo + ebay tabs + spreadsheets workflow. love it. only ask: wish the yard sale map covered more rural areas.",
  },
];

export default function Testimonials() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="early feedback from our beta testers" color={C.blue} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              margin: 0,
              padding: 0,
            }}
          >
            REAL FLIPPERS.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              color: C.blue,
              margin: "0 0 40px",
              padding: 0,
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
                {/* Beta-tester attribution — no verified ✓, no timestamp, no
                    star rating. "—handle" reads as attribution not platform. */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: 16,
                    gap: 12,
                  }}
                >
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
                      flexShrink: 0,
                    }}
                  >
                    {r.mono}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 13,
                        color: "#fff",
                      }}
                    >
                      — {r.h}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        marginTop: 2,
                      }}
                    >
                      beta tester
                    </div>
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
