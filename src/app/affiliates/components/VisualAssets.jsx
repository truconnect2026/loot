"use client";

import { C } from "../../pro/lib/colors.js";
import { CoinMark, Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

// TODO(David): replace href: "#" with real zip/CDN URLs once asset bundles
// are uploaded. Each card's `files` + `lastUpdated` should also reflect the
// actual contents once shipped. The current values are placeholder strings.
const ASSETS = [
  {
    title: "STATIC BANNERS",
    files: "6 files · TODO(David)",
    desc: "300×250 · 728×90 · 160×600 · 970×250 · 1080×1080 · 1080×1920",
    href: "#",
    lastUpdated: "TODO(David)",
  },
  {
    title: "ANIMATED GIFS",
    files: "3 files · TODO(David)",
    desc: "scan → grail reveal · scroll loop · BOLO ping",
    href: "#",
    lastUpdated: "TODO(David)",
  },
  {
    title: "VIDEO BACKGROUNDS",
    files: "5 files · TODO(David)",
    desc: "5-sec cosmic loops for overlay",
    href: "#",
    lastUpdated: "TODO(David)",
  },
  {
    title: "LOGOS + BRAND",
    files: "8 files · TODO(David)",
    desc: "light/dark · transparent PNG · SVG",
    href: "#",
    lastUpdated: "TODO(David)",
  },
  {
    title: "SCREENSHOTS",
    files: "10 files · TODO(David)",
    desc: "clean app screenshots — scan + result UI",
    href: "#",
    lastUpdated: "TODO(David)",
  },
  {
    title: "DEMO VIDEO CLIPS",
    files: "10 files · TODO(David)",
    desc: "short product demo clips for reuse",
    href: "#",
    lastUpdated: "TODO(David)",
  },
];

export default function VisualAssets() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="visual assets" color={C.purple} />
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
            DROP IN. POST. <span style={{ color: C.purple }}>DONE.</span>
          </h2>
        </FadeUp>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {ASSETS.map((a, i) => (
            <FadeUp key={a.title} delay={0.06 * i}>
              <div
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(92,224,184,0.2)",
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 10",
                    borderRadius: 10,
                    background:
                      "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(92,224,184,0.06) 0%, transparent 70%), rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <CoinMark size={40} color="rgba(92,224,184,0.4)" />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: 22,
                    color: "#fff",
                    margin: 0,
                    letterSpacing: "0.02em",
                  }}
                >
                  {a.title}
                </h3>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    color: C.mint,
                    letterSpacing: "0.06em",
                    marginTop: 6,
                  }}
                >
                  {a.files}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-manrope), sans-serif",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.5,
                    margin: "10px 0 16px",
                    flex: 1,
                  }}
                >
                  {a.desc}
                </p>
                <a
                  href={a.href}
                  aria-label={`Download ${a.title} bundle`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: C.mint,
                    color: C.bg,
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textDecoration: "none",
                    padding: "12px 18px",
                    borderRadius: 6,
                  }}
                >
                  DOWNLOAD
                </a>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.08em",
                    marginTop: 12,
                  }}
                >
                  Last updated: {a.lastUpdated}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
