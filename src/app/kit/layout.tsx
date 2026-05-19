import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loot Brand Kit — everything you need to post about Loot",
  description:
    "Logos, scripts, screenshots, voice guidelines, press facts. Free to use for affiliates and press. Just don't make us look bad.",
  openGraph: {
    title: "Everything you need to post about Loot",
    description:
      "Logos, copy, screenshots, scripts. Free to use. Just don't make us look bad.",
    url: "/kit",
    siteName: "Loot",
    images: [
      {
        url: "/og/kit.png",
        width: 1200,
        height: 630,
        alt: "Loot Brand Kit — everything you need to post about Loot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Everything you need to post about Loot",
    description:
      "Logos, scripts, screenshots, voice guidelines. Free to use. loot.works/kit",
    images: ["/og/kit.png"],
    creator: "@loot.works",
  },
  alternates: {
    canonical: "/kit",
  },
};

export default function KitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
