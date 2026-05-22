import { Bebas_Neue, Manrope, Space_Mono } from "next/font/google";

/**
 * /affiliates layout — mirrors /pro's font setup.
 *
 * /affiliates is a sibling route to /pro, so the next/font CSS variables
 * declared in /pro/layout.jsx don't apply here. We re-declare them so
 * components can use var(--font-bebas) / var(--font-manrope) / var(--font-mono)
 * without overlapping with /pro's instance.
 */

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const manrope = Manrope({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "loot.works/affiliates — 40% recurring commission on AI thrift arbitrage",
  description:
    "Promote loot.works Pro. Earn 40% recurring on every monthly + annual sub. 60-day cookie. Weekly payouts. Built for resellers, sneakers, vintage, and thrift creators.",
  alternates: { canonical: "https://loot.works/affiliates" },
  openGraph: {
    title: "loot.works / affiliates",
    description:
      "Earn 40% recurring on every Pro sub you send. 60-day cookie. Weekly payouts.",
    url: "https://loot.works/affiliates",
    type: "website",
    images: [{ url: "/og-pro.png" }], // TODO(David): replace with /og-affiliates.png once designed
  },
  twitter: {
    card: "summary_large_image",
    title: "loot.works / affiliates",
    description:
      "Earn 40% recurring on every Pro sub you send. 60-day cookie. Weekly payouts.",
    images: ["/og-pro.png"], // TODO(David): same as above
  },
  robots: { index: true, follow: true },
};

export default function AffiliatesLayout({ children }) {
  return (
    <div className={`${bebasNeue.variable} ${manrope.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
