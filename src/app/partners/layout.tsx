import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loot Partners — earn 40% lifetime as a thrift creator",
  description:
    "Founding 20 creators get 60% setup + 40% recurring, for life. Beats List Perfectly, Vendoo, PrimeLister. No contract, no quota, drop anytime.",
  openGraph: {
    title: "Flip pays better than your last 3 affiliate programs",
    description:
      "Founding 20 spots: 60% setup + 40% recurring, for life. Apply in 60 seconds.",
    url: "/partners",
    siteName: "Loot",
    images: [
      {
        url: "/og/partners.png",
        width: 1200,
        height: 630,
        alt: "Loot Partners — Flip pays better than your last 3 affiliate programs",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flip pays better than your last 3 affiliate programs",
    description:
      "Founding 20 spots: 60% setup + 40% recurring, for life. Apply in 60 seconds. loot.works/partners",
    images: ["/og/partners.png"],
    creator: "@loot.works",
  },
  alternates: {
    canonical: "/partners",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
