/**
 * /pro layout — server component.
 *
 * Loads Bebas Neue + Manrope + Space Mono via Google Fonts so the literal
 * font-family names in the section components' inline styles resolve
 * directly. (next/font would rename them, which would break the 1:1 port
 * from the standalone HTML's inline styles.)
 *
 * Also owns the page-level Next.js metadata export — the SEO + OG tags
 * port directly from the source HTML's <head>.
 */

export const metadata = {
  title: "loot.works/pro — the unfair advantage for resellers",
  description:
    "AI thrift arbitrage. Real eBay comps in 1.4 seconds. Yard sale map. BOLO alerts. $14.99/mo, cancel anytime. Built for flippers.",
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
    <>
      {/* Next.js App Router auto-hoists these to <head>. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
      />
      {children}
    </>
  );
}
