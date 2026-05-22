import type { Metadata } from "next";
import { ITEMS, getDailyIndex, getPuzzleNumber } from "./items";

const BASE_URL = "https://loot.works";

// Per-day metadata — title, description, and OG image all rotate with the
// daily drop. OG route accepts ?day=N&item=<name> search params and renders
// them at request time.
export function generateMetadata(): Metadata {
  const day = getPuzzleNumber();
  const item = ITEMS[getDailyIndex()];
  const title = `FLIP OR SKIP — Day ${day} | loot.works`;
  const description = `Today's drop: ${item.name}. Call the price. Beat Flip.`;
  const ogQuery = `?day=${day}&item=${encodeURIComponent(item.name)}`;
  const ogUrl = `/og-flip.png${ogQuery}`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    icons: [{ rel: "icon", url: "/favicon-flip.svg", type: "image/svg+xml" }],
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function FlipLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
