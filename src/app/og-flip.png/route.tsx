import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

const SIZE = { width: 1200, height: 630 };
const MINT = "#5CE0B8";

// Custom fonts (Outfit, JetBrains Mono) aren't bundled — we'd need to fetch
// woff2 buffers from Google to use them in ImageResponse. That works but
// adds a Google fetch on every render. For now we render with the default
// @vercel/og sans + system monospace; the wordmark still reads clearly at
// 120px and the OG image is generated on demand and cached by social
// platforms once fetched.
export async function GET() {
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
        {/* Saturn glyph — top-left logo mark */}
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

        {/* Flip silhouette — right side, single-color mint outline */}
        <div style={{ position: "absolute", top: 90, right: 70, display: "flex" }}>
          <svg width="380" height="380" viewBox="0 0 160 160">
            {/* Saturn ring */}
            <ellipse
              cx="80"
              cy="80"
              rx="70"
              ry="20"
              fill="none"
              stroke={MINT}
              strokeWidth="2"
              transform="rotate(-23 80 80)"
            />
            <ellipse
              cx="80"
              cy="80"
              rx="58"
              ry="14"
              fill="none"
              stroke={MINT}
              strokeWidth="1"
              opacity="0.5"
              transform="rotate(-23 80 80)"
            />
            {/* Ears */}
            <path d="M 50 50 L 44 22 L 66 42 Z" fill="none" stroke={MINT} strokeWidth="2" />
            <path d="M 110 50 L 116 22 L 94 42 Z" fill="none" stroke={MINT} strokeWidth="2" />
            {/* Head */}
            <ellipse cx="80" cy="86" rx="38" ry="36" fill="none" stroke={MINT} strokeWidth="2" />
            {/* Snout */}
            <path
              d="M 62 102 Q 80 132 98 102 Q 94 116 80 118 Q 66 116 62 102 Z"
              fill="none"
              stroke={MINT}
              strokeWidth="2"
            />
            {/* Nose */}
            <ellipse cx="80" cy="108" rx="3" ry="2.4" fill={MINT} />
            {/* Eyes (smirk) */}
            <path d="M 60 80 Q 67 76 74 80" stroke={MINT} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <ellipse cx="98" cy="80" rx="3.5" ry="3" fill={MINT} />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            bottom: 200,
            left: 64,
            fontSize: 120,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: MINT,
            display: "flex",
          }}
        >
          FLIP OR SKIP
        </div>

        {/* Subtitle */}
        <div
          style={{
            position: "absolute",
            bottom: 144,
            left: 68,
            fontSize: 32,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: MINT,
            opacity: 0.85,
            display: "flex",
            letterSpacing: "0.02em",
          }}
        >
          wordle for thrifters
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            right: 64,
            fontSize: 22,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: MINT,
            opacity: 0.7,
            display: "flex",
            letterSpacing: "0.05em",
          }}
        >
          loot.works/flip
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
