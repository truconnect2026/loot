import { ImageResponse } from "next/og";
import { getPuzzleNumber } from "@/app/flip/items";

export const runtime = "edge";
export const contentType = "image/png";

const SIZE = { width: 1200, height: 630 };
const MINT = "#5CE0B8";

// Custom fonts (Outfit, JetBrains Mono) aren't bundled — see og-flip.png for
// the same trade-off note. ImageResponse falls back to its built-in sans for
// headlines and the system monospace for mono. Looks clean at 96px headline.
export async function GET() {
  const day = getPuzzleNumber();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          color: MINT,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: 64,
        }}
      >
        {/* Subtle mint dot-grid pattern — radial gradient as a CSS background.
            ImageResponse supports background-image with `radial-gradient`. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(92,224,184,0.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            display: "flex",
          }}
        />

        {/* Saturn glyph — top-left logo mark, 24px */}
        <div style={{ position: "absolute", top: 56, left: 64, display: "flex" }}>
          <svg width="44" height="44" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="8" fill="none" stroke={MINT} strokeWidth="2" />
            <ellipse
              cx="20"
              cy="20"
              rx="18"
              ry="5"
              fill="none"
              stroke={MINT}
              strokeWidth="1.5"
              transform="rotate(-23 20 20)"
            />
          </svg>
        </div>

        {/* DAY {N} chip — top-right, signals "this product is alive, daily" */}
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 64,
            padding: "10px 18px",
            border: `2px solid ${MINT}`,
            color: MINT,
            fontSize: 20,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "0.18em",
            display: "flex",
          }}
        >
          DAY {day}
        </div>

        {/* Headline — center-left, 96px, mint */}
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 64,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: MINT,
            display: "flex",
          }}
        >
          SCAN. PRICE. FLIP.
        </div>

        {/* Subhead — under the headline, 28px, white at 80% */}
        <div
          style={{
            position: "absolute",
            top: 360,
            left: 68,
            fontSize: 28,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.005em",
            display: "flex",
            maxWidth: 1000,
          }}
        >
          AI thrift arbitrage. Real verdicts in seconds.
        </div>

        {/* Stats line — bottom-left, mono 18px mint */}
        <div
          style={{
            position: "absolute",
            bottom: 64,
            left: 64,
            fontSize: 18,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: MINT,
            letterSpacing: "0.08em",
            opacity: 0.9,
            display: "flex",
          }}
        >
          BUILT FOR RESELLERS · AI THRIFT ARBITRAGE · $14.99/MO
        </div>

        {/* Footer URL — bottom-right, mono 18px mint */}
        <div
          style={{
            position: "absolute",
            bottom: 64,
            right: 64,
            fontSize: 18,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: MINT,
            opacity: 0.7,
            letterSpacing: "0.05em",
            display: "flex",
          }}
        >
          loot.works
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
