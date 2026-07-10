import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import SplashGate from "@/components/shared/SplashGate";
import { TabBarMount } from "@/components/nav/TabBar";
import OrientationGuard from "@/components/shared/OrientationGuard";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: ["400"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://loot.works"),
  title: {
    default: "loot.works",
    template: "%s · loot.works",
  },
  description:
    "Scan a thrift find. Get buy price, resell price, and ROI in 2 seconds. Built for the 130M Americans who resell.",
  applicationName: "loot.works",
  keywords: [
    "thrift flipping",
    "reseller app",
    "thrift scanner",
    "resale arbitrage",
    "ROI calculator",
  ],
  // Preserved from the pre-merge metadata — the new spec doesn't
  // redefine icons, so favicon + apple-touch-icon stay wired.
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  openGraph: {
    title: "loot.works",
    description:
      "Scan it. Price it. Flip it. AI thrift-flip scanner — buy, resell, ROI in 2 seconds.",
    url: "https://loot.works",
    siteName: "loot.works",
    images: [
      {
        url: "/og-thumbnail.png",
        width: 1200,
        height: 630,
        alt: "loot.works — AI thrift-flip scanner",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@davidjones_dev",
    creator: "@davidjones_dev",
    title: "loot.works",
    description:
      "Scan it. Price it. Flip it. AI thrift-flip scanner — buy, resell, ROI in 2 seconds.",
    images: ["/og-thumbnail.png"],
  },
  robots: { index: true, follow: true },
};

// Lock pinch-to-zoom — iOS auto-zoom on small inputs and accidental
// pinch gestures both broke the fixed dashboard layout. Inputs are
// already font-size 16+ to prevent the auto-zoom focus path; this
// kills the pinch path too.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Without viewport-fit=cover, iOS resolves env(safe-area-inset-bottom)
  // to 0 in the standalone PWA — the tab bar sat flush against the screen
  // edge and its bottom ~34px landed in the home-indicator gesture zone.
  viewportFit: "cover",
};

// Film-grain SVG overlay — fractal noise desaturated to grayscale.
const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${manrope.variable} ${spaceMono.variable}`}
      // #0A0812 on html/body so there's no perceivable color flash
      // before the splash mounts — the splash uses the same surface
      // color, which then fades to reveal the app's content (which
      // paints its own #120e18 / lighter card surfaces on top).
      style={{ backgroundColor: "#0A0812" }}
    >
      <body style={{ backgroundColor: "#0A0812" }}>
        <SplashGate>{children}</SplashGate>
        {/* Film-grain overlay — sits above all content but never intercepts pointer events. */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            pointerEvents: "none",
            opacity: 0.045,
            mixBlendMode: "overlay",
            backgroundImage: NOISE_SVG,
          }}
        />
        <TabBarMount />
        <OrientationGuard />
        <Analytics />
      </body>
    </html>
  );
}
