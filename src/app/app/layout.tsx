import type { Metadata } from "next";

const BASE_URL = "https://loot.works";
const TITLE = "loot.works — Scan. Price. Flip.";
const DESCRIPTION = "AI thrift arbitrage. Real verdicts in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/app",
    siteName: "Loot",
    images: [{ url: "/og-app.png", width: 1200, height: 630, alt: TITLE }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-app.png"],
    creator: "@loot.works",
  },
};

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
