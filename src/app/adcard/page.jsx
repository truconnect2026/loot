/**
 * /adcard — standalone verdict-card still for compositing onto ad
 * photos (e.g. dropped onto a phone screen in a lifestyle shot).
 *
 * Not linked anywhere user-facing, no auth (outside the middleware
 * matcher — see src/middleware.ts). Hardcoded marketing content, not
 * live scan data. Reuses the verdict-card visual language from the
 * flip game / marketing-screens captures: mint #5CE0B8 accents, dark
 * bg, the Pyrex Butterprint 403 vector art, and the BOLO-style
 * bordered trust block.
 *
 * Card fills the viewport edge to edge at a ~9:19.5 (tall phone)
 * ratio, centered with matching background so there's no visible
 * seam if the capture viewport isn't an exact ratio match.
 */

import FlipCoyote from "@/components/shared/FlipCoyote";
import { PyrexBowl } from "../marketing-screens/_frame";

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
        {/* Mascot — small, top-right corner */}
        <div style={{ position: "absolute", top: "5vw", right: "5vw", zIndex: 2 }}>
          <FlipCoyote mood="hyped" size={64} />
        </div>

        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "8vw 6vw 6vw",
            boxSizing: "border-box",
          }}
        >
          {/* Item identity */}
          <div style={{ paddingRight: "16vw" }}>
            <h1
              style={{
                fontFamily: "var(--font-bebas-neue), sans-serif",
                fontSize: "clamp(30px,9.5vw,52px)",
                lineHeight: 1.05,
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
                margin: "6px 0 0",
              }}
            >
              1957&ndash;68 &middot; Pyrex
            </p>
          </div>

          {/* Product art */}
          <div
            style={{
              flex: "1 1 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
              position: "relative",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: "80%",
                aspectRatio: "1",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(92,224,184,0.22) 0%, rgba(92,224,184,0.06) 45%, transparent 70%)",
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <PyrexBowl size={230} />
            </div>
          </div>

          {/* Verdict badge — strongest tier */}
          <div
            style={{
              background: MINT,
              borderRadius: 10,
              padding: "clamp(14px,3.4vw,20px) 0",
              textAlign: "center",
              boxShadow: `0 0 0 1px rgba(92,224,184,0.4), 0 12px 40px rgba(92,224,184,0.35)`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-bebas-neue), sans-serif",
                fontSize: "clamp(26px,8.5vw,44px)",
                letterSpacing: "0.04em",
                color: "#070510",
              }}
            >
              &#128058; WOLF
            </span>
          </div>

          {/* Buy → Resell */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3.5vw",
              margin: "clamp(16px,4.5vw,28px) 0",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: "clamp(24px,7.5vw,40px)",
                color: "#fff",
              }}
            >
              $4
            </span>
            <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
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
                fontSize: "clamp(24px,7.5vw,40px)",
                color: MINT,
              }}
            >
              $85
            </span>
          </div>

          {/* Comp trust block — BOLO-style bordered callout */}
          <div style={{ borderTop: `1px solid ${MINT}`, opacity: 1, paddingTop: "3.5vw" }}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "clamp(9px,2.6vw,11px)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: MINT,
                fontWeight: 600,
                margin: "0 0 6px",
              }}
            >
              based on recent sold comps
            </p>
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "clamp(13px,3.6vw,17px)",
                color: "rgba(255,255,255,0.9)",
                margin: 0,
              }}
            >
              sold 3 days ago &middot; $85
            </p>
          </div>

          <div style={{ flex: "0 0 clamp(20px,5vw,32px)" }} />

          {/* Footer brand mark */}
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "clamp(11px,3vw,14px)",
              letterSpacing: "0.1em",
              color: MINT,
              textAlign: "center",
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
