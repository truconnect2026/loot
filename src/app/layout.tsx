import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SplashGate from "@/components/shared/SplashGate";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://loot.works"),
  title: "loot.works — AI Thrift Store Scanner",
  description:
    "Scan thrift store items, get instant profit estimates, condition grading, and listing generation. The AI-powered reselling toolkit.",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
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
      className={`${outfit.variable} ${jetbrainsMono.variable}`}
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
      </body>
    </html>
  );
}
