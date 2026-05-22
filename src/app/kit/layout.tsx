import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "loot.works/kit — affiliate program · brand assets · press",
  description:
    "40% recurring on AI thrift arbitrage. Climb the tier ladder: Standard (40%) → Gold (50%) → Founding 20 (60% lifetime). Plus brand assets, swipe copy, press kit. One page, everything you need to promote loot.works.",
  openGraph: {
    title: "loot.works/kit — affiliate hub + brand kit + press",
    description:
      "Climb the ladder: 40% → 50% → 60% recurring. Brand assets + swipe copy + press kit, all in one place.",
    url: "/kit",
    siteName: "Loot",
    images: [
      {
        url: "/og-kit.png",
        width: 1200,
        height: 630,
        alt: "loot.works/kit — affiliate program, brand assets, press",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "loot.works/kit — affiliate hub + brand kit + press",
    description:
      "40% → 50% → 60% recurring affiliate ladder. Brand assets + swipe copy + press. loot.works/kit",
    images: [
      {
        url: "/og-kit.png",
        width: 1200,
        height: 630,
        alt: "loot.works/kit — affiliate program, brand assets, press",
      },
    ],
    creator: "@loot.works",
  },
  alternates: {
    canonical: "/kit",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function KitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
