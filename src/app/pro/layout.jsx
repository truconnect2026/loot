import { Bebas_Neue, Manrope, Space_Mono } from "next/font/google";

/**
 * /pro layout — server component.
 *
 * Switched from Google Fonts <link> to next/font/google. The previous <link>
 * approach was racey in production (FOUT to system condensed sans). next/font
 * self-hosts the woff2 + ships a CSS variable so headlines reliably resolve
 * to Bebas Neue even on slow connections.
 *
 * Every section component reads --font-bebas / --font-manrope / --font-mono
 * via var(...) in its inline styles.
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
  title: "loot.works/pro — the unfair advantage for resellers",
  description:
    "AI thrift arbitrage. Real eBay comps in about a second. Yard sale map. BOLO alerts. $14.99/mo, cancel anytime. Built for flippers.",
  alternates: { canonical: "https://loot.works/pro" },
  openGraph: {
    title: "LOOT.WORKS / pro",
    description:
      "Stop leaving money on the shelf. Real comps. Real maps. Real alerts. $14.99/mo.",
    url: "https://loot.works/pro",
    type: "website",
    images: [{ url: "/og-pro.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOOT.WORKS / pro",
    description:
      "Stop leaving money on the shelf. Real comps. Real maps. Real alerts. $14.99/mo.",
    images: ["/og-pro.png"],
  },
};

export default function ProLayout({ children }) {
  return (
    <div className={`${bebasNeue.variable} ${manrope.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
