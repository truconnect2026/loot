import type { Metadata } from "next";

const TITLE = "FLIP OR SKIP — loot.works";
const DESCRIPTION =
  "Wordle for thrifters. Daily mystery item, Flip drops the verdict.";

export const metadata: Metadata = {
  metadataBase: new URL("https://loot.works"),
  title: TITLE,
  description: DESCRIPTION,
  icons: [{ rel: "icon", url: "/favicon-flip.svg", type: "image/svg+xml" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-flip.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-flip.png"],
  },
};

export default function FlipLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
