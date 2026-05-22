"use client";

/**
 * /pro/thanks — post-checkout landing.
 *
 * Digistore product 691098 should be configured to redirect customers here
 * (or to /thanks at the top level — both work; /thanks is the legacy URL).
 *
 * TODO(David): in the Digistore admin panel, set the "Thank-you page" URL
 * for product 691098 to https://loot.works/pro/thanks if you want buyers
 * to land on the cosmic-themed page. Otherwise keep /thanks.
 *
 * Pure static: no auth gate, no Supabase, no analytics. order_id from the
 * Digistore redirect (if present) is surfaced verbatim for support tickets.
 */

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CosmicBackground from "../components/CosmicBackground.jsx";
import Footer from "../components/Footer.jsx";
import { CoinMark, FadeUp } from "../components/atoms.jsx";
import { C } from "../lib/colors.js";

function ThanksInner() {
  const search = useSearchParams();
  const orderId = search.get("order_id");

  return (
    <div className="pro-page-root" style={{ position: "relative", overflow: "hidden", minHeight: "100dvh" }}>
      <CosmicBackground />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(48px,10vw,96px) 24px 80px",
          textAlign: "center",
          color: "rgba(255,255,255,0.85)",
          fontFamily: "var(--font-manrope), sans-serif",
        }}
      >
        <FadeUp>
          <div style={{ display: "inline-flex", marginBottom: 16 }}>
            <CoinMark size={36} color={C.mint} />
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <h1
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(56px,10vw,128px)",
              lineHeight: 1.0,
              letterSpacing: "-0.01em",
              color: "#fff",
              margin: 0,
            }}
          >
            WELCOME TO <span style={{ color: C.mint }}>PRO.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.25}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 540,
              margin: "32px auto 0",
            }}
          >
            Your account has been upgraded. Check your email for the receipt
            and access details.
          </p>
        </FadeUp>

        {orderId && (
          <FadeUp delay={0.3}>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.08em",
                marginTop: 16,
              }}
            >
              Order ID: {orderId}
            </p>
          </FadeUp>
        )}

        <FadeUp delay={0.4}>
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: "48px auto 0",
              maxWidth: 480,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <Step n={1} label="Open the loot.works app" />
            <Step n={2} label="Sign in with the email you just used" />
            <Step n={3} label="Hit your first scan within 60 seconds" />
          </ol>
        </FadeUp>

        <FadeUp delay={0.55}>
          <Link
            href="/app"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 40,
              padding: "20px 48px",
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: 24,
              letterSpacing: "0.04em",
              background: C.mint,
              color: "#070510",
              textDecoration: "none",
              borderRadius: 6,
              boxShadow: "0 8px 32px rgba(92,224,184,0.35)",
            }}
          >
            OPEN APP →
          </Link>
        </FadeUp>

        <FadeUp delay={0.65}>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              marginTop: 32,
              lineHeight: 1.6,
            }}
          >
            Questions?{" "}
            <a href="mailto:support@loot.works" style={{ color: C.mint }}>
              support@loot.works
            </a>
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginTop: 24,
            }}
          >
            7-day refund · cancel anytime from settings
          </p>
        </FadeUp>
      </main>

      <Footer />
    </div>
  );
}

function Step({ n, label }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 20px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: `1px solid ${C.mint}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: 22,
          color: C.mint,
        }}
      >
        {n}
      </div>
      <span
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </li>
  );
}

export default function ProThanksPage() {
  return (
    <Suspense fallback={null}>
      <ThanksInner />
    </Suspense>
  );
}
