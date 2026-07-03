/**
 * /adcard — standalone verdict-card still for compositing onto ad
 * photos (e.g. dropped onto a phone screen in a lifestyle shot).
 *
 * Not linked anywhere user-facing, no auth (outside the middleware
 * matcher — see src/middleware.ts). Hardcoded marketing content, not
 * live scan data. The ad photo itself already shows the real item,
 * so this card is deliberately just the verdict UI — no product
 * illustration — kept to the two hero elements (verdict pill, price
 * row) plus the comp trust line.
 *
 * Card fills the viewport edge to edge at a ~9:19.5 (tall phone)
 * ratio, centered with matching background so there's no visible
 * seam if the capture viewport isn't an exact ratio match.
 */

export const metadata = {
  title: "ad card",
  robots: { index: false, follow: false },
};

const MINT = "#5CE0B8";
const BG = "#070510";

export default function AdCardPage() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "min(100vw, calc(100dvh * 9 / 19.5))",
          maxHeight: "calc(100vw * 19.5 / 9)",
          background: BG,
          color: "#fff",
          fontFamily: "var(--font-outfit), sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            padding: "8vw 7vw",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          {/* Item identity */}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-bebas-neue), sans-serif",
                fontSize: "clamp(32px,10vw,54px)",
                lineHeight: 1.08,
                margin: 0,
                letterSpacing: "0.01em",
              }}
            >
              PYREX BUTTERPRINT 403
            </h1>
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "clamp(11px,3.2vw,15px)",
                color: "rgba(255,255,255,0.55)",
                margin: "8px 0 0",
              }}
            >
              1957&ndash;68 &middot; Pyrex
            </p>
          </div>

          {/* Verdict badge — the hero element, nothing overlaps it */}
          <div
            style={{
              width: "100%",
              background: MINT,
              borderRadius: 12,
              padding: "clamp(18px,5vw,28px) 0",
              boxShadow: "0 0 0 1px rgba(92,224,184,0.4), 0 16px 48px rgba(92,224,184,0.4)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-bebas-neue), sans-serif",
                fontSize: "clamp(32px,10.5vw,52px)",
                letterSpacing: "0.04em",
                color: BG,
              }}
            >
              &#128058; WOLF
            </span>
          </div>

          {/* Buy → Resell — the second hero element */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4vw",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: "clamp(30px,9vw,48px)",
                color: "#fff",
              }}
            >
              $4
            </span>
            <svg width="34" height="22" viewBox="0 0 30 20" fill="none" aria-hidden="true">
              <path
                d="M2 10 H24 M18 4 L26 10 L18 16"
                stroke={MINT}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: "clamp(30px,9vw,48px)",
                color: MINT,
              }}
            >
              $85
            </span>
          </div>

          {/* Comp trust block */}
          <div style={{ width: "100%" }}>
            <div
              aria-hidden="true"
              style={{ height: 1, background: MINT, opacity: 0.4, marginBottom: "4vw" }}
            />
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "clamp(9px,2.6vw,11px)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: MINT,
                fontWeight: 600,
                margin: "0 0 8px",
              }}
            >
              based on recent sold comps
            </p>
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "clamp(14px,3.8vw,18px)",
                color: "rgba(255,255,255,0.9)",
                margin: 0,
              }}
            >
              sold 3 days ago &middot; $85
            </p>
          </div>

          {/* Footer brand mark */}
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "clamp(11px,3vw,14px)",
              letterSpacing: "0.1em",
              color: MINT,
              margin: 0,
            }}
          >
            loot.works
          </p>
        </div>
      </div>
    </div>
  );
}
