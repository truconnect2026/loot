import FlipGame from "./FlipGame.jsx";
import BrowserGate from "./components/BrowserGate.jsx";
import FlipErrorBoundary from "./components/FlipErrorBoundary.jsx";
import { getPuzzleNumber } from "./items.js";

// Per-day metadata — title + OG image both rotate with the daily drop.
// /og-flip.png is the existing image route; it already accepts ?day & ?item
// search params but works fine without them too. Layout.tsx still owns the
// per-day item title for now (kept for back-compat until the next prompt).
export function generateMetadata() {
  const day = getPuzzleNumber();
  const title = `FLIP OR SKIP — Day ${day} | loot.works`;
  const description =
    "Daily thrift flipping game. One round. 10 items. How many can you call?";
  return {
    metadataBase: new URL("https://loot.works"),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: "/og-flip.png", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-flip.png"],
    },
  };
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <noscript>
        <div style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "32px", background: "#000", color: "#fff", textAlign: "center",
          fontFamily: "var(--font-manrope), sans-serif",
        }}>
          <h1 style={{ color: "#5CE0B8", fontSize: 28, marginBottom: 8 }}>this game needs JavaScript.</h1>
          <p style={{ opacity: 0.8 }}>
            <a href="/app" style={{ color: "#5CE0B8", textDecoration: "underline" }}>
              loot.works has more, no signup required →
            </a>
          </p>
        </div>
      </noscript>
      <BrowserGate>
        <FlipErrorBoundary>
          <FlipGame />
        </FlipErrorBoundary>
      </BrowserGate>
    </main>
  );
}
