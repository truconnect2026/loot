"use client";

/**
 * /pro — public sales page (production version).
 *
 * Previously this route was a .tsx file. Turbopack 404'd at runtime on the
 * heavy-JSX .tsx version (this is a known Turbopack quirk in this repo — it
 * has bitten twice already). Rewriting every component as .jsx fixes the
 * runtime 404. Keep all components in this directory as .jsx.
 *
 * Component tree (every component is a Client Component — all use hooks):
 *   <CosmicBackground />
 *   <TopStrip />
 *   <HeroSection />          smooth-scrolls to #pricing
 *   <TheEdgeSection />       "the picker next to you is guessing"
 *   <GutPunch />             old-way-vs-loot head-to-head (despite the name,
 *                            no longer a shame/stat section — see file)
 *   <FeatureMatrix />
 *   <ROICalculator />        single defensible line, no income projection
 *   <PricingSection onCTA={handleCTA} />
 *   <FAQSection />
 *   <CloserSection onCTA={handleCTA} />  ← annual_closer UTM
 *   <Toast />
 *
 * CTA flow forks on auth:
 *   - Signed-in visitor → POST /api/stripe/checkout, redirect to Stripe.
 *   - Signed-out visitor → stash plan + UTMs in sessionStorage, bounce
 *     to / (login). After auth, /onboarding (or /app) honors the
 *     pending plan and forwards to /account, which auto-launches the
 *     same Stripe checkout call. UTMs ride along into Stripe metadata.
 *
 * Digistore (checkout-ds24.com/product/691098) stays wired as the
 * affiliate-cookie rail (see digistore-affiliate.ts) and as a last-
 * resort fallback if the Stripe POST itself fails.
 */

import { useCallback, useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { createClient } from "@/lib/supabase";
import { withUTM } from "@/lib/utm";
import { savePendingPlan, utmsFromSearch } from "@/lib/pending-plan";
import "./pro.module.css";
import CosmicBackground from "./components/CosmicBackground.jsx";
import TopStrip from "./components/TopStrip.jsx";
import HeroSection from "./components/HeroSection.jsx";
import ShelfScannerDemo from "./components/ShelfScannerDemo.jsx";
import AuthCheckDemo from "./components/AuthCheckDemo.jsx";
import TheEdgeSection from "./components/TheEdgeSection.jsx";
import GutPunch from "./components/GutPunch.jsx";
import FeatureMatrix from "./components/FeatureMatrix.jsx";
import ROICalculator from "./components/ROICalculator.jsx";
import PricingSection from "./components/PricingSection.jsx";
import FAQSection from "./components/FAQSection.jsx";
import CloserSection from "./components/CloserSection.jsx";
import Footer from "./components/Footer.jsx";
import CookieBanner from "./components/CookieBanner.jsx";
import Toast from "./components/Toast.jsx";

const DIGISTORE_BASE = "https://checkout-ds24.com/product/691098";

// Map the in-page CTA campaign slug to the canonical utm_content used
// in docs/utm-tracking.md. Keep both in sync when adding new CTAs.
const UTM_CONTENT_BY_CAMPAIGN = {
  monthly: "pro_pricing_monthly",
  annual: "pro_pricing_annual",
  annual_closer: "pro_closer",
};

function digistoreCheckoutUrl(campaign) {
  const content = UTM_CONTENT_BY_CAMPAIGN[campaign] || `pro_${campaign}`;
  return withUTM(DIGISTORE_BASE, content, "pro_purchase");
}

// The CTA campaign slug ("annual_closer") collapses into the plan key
// the Stripe API understands ("annual"). Closer != a different price,
// just a different placement on the page; the analytics distinction
// lives in utm_content above.
function planFromCampaign(campaign) {
  return campaign === "annual_closer" ? "annual" : campaign;
}

function priceIdFor(plan) {
  if (plan === "annual") return process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL ?? "";
  return process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? "";
}

export default function ProPage() {
  const [toast, setToast] = useState({ msg: "", vis: false });

  // Scroll depth tracking — fire once per session per 25/50/75/100 threshold.
  // Uses session-scoped Set so a single visitor doesn't generate four events
  // per minute as they scroll up and down the page.
  //
  // Scroll now happens inside .pro-scroll-main (a dedicated, owned scroll
  // container — see pro.module.css) rather than the document, since relying
  // on html/body scroll behaved inconsistently across contexts (installed
  // standalone PWA in particular). Depth is read off that element instead
  // of window/document.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scroller = document.querySelector(".pro-scroll-main");
    if (!scroller) return;
    const fired = new Set();
    const thresholds = [25, 50, 75, 100];
    const onScroll = () => {
      const scrolled = scroller.scrollTop + scroller.clientHeight;
      const total = scroller.scrollHeight;
      if (total <= 0) return;
      const pct = (scrolled / total) * 100;
      for (const t of thresholds) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          track("pro_scroll_depth", { depth: `${t}%` });
        }
      }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = useCallback(async (campaign) => {
    const plan = planFromCampaign(campaign);
    const label = plan === "annual" ? "Annual Pro" : "Monthly Pro";
    setToast({ msg: `→ ${label} · routing to checkout`, vis: true });

    // Capture ad-source attribution from the current URL — these are
    // the UTMs the ad referrer dropped on /pro. We carry them through
    // either rail so post-conversion reporting still ties back.
    const utms = typeof window !== "undefined" ? utmsFromSearch(window.location.search) : {};

    // Signed-in path: straight to Stripe. The /api/stripe/checkout
    // route validates the priceId and creates a hosted Session URL.
    // Failure here drops to the Digistore fallback so a Stripe outage
    // doesn't silently kill the conversion.
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (user) {
      try {
        const priceId = priceIdFor(plan);
        if (!priceId) throw new Error("Stripe price not configured");
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, plan, ...utms }),
        });
        if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
        const { url } = await res.json();
        if (!url) throw new Error("Stripe did not return a URL");
        window.setTimeout(() => { window.location.href = url; }, 600);
        window.setTimeout(() => setToast((t) => ({ ...t, vis: false })), 3000);
        return;
      } catch (err) {
        console.error("[pro] Stripe checkout failed, falling back to Digistore", err);
        // intentional fall-through to the Digistore redirect below
      }
    } else {
      // Signed-out path: stash plan + UTMs, bounce to login. /account
      // picks the pending plan up post-auth and auto-launches Stripe.
      savePendingPlan(plan, utms);
      window.setTimeout(() => { window.location.href = "/"; }, 600);
      window.setTimeout(() => setToast((t) => ({ ...t, vis: false })), 3000);
      return;
    }

    // Fallback: Digistore-hosted checkout. Used only if the Stripe POST
    // above threw — keeps the affiliate rail available and means a
    // Stripe-side outage still produces revenue.
    window.setTimeout(() => {
      window.location.href = digistoreCheckoutUrl(campaign);
    }, 600);
    window.setTimeout(() => setToast((t) => ({ ...t, vis: false })), 3000);
  }, []);

  return (
    <div className="pro-page-root">
      <CosmicBackground />
      <TopStrip />
      {/* .pro-scroll-main is the one, explicit, owned scroll container —
          see pro.module.css. TopStrip sits outside it (structurally
          always visible, no "sticky" needed) and Footer sits inside it
          as trailing, non-snapped content after the closer. */}
      <main className="pro-scroll-main">
        <HeroSection />
        <ShelfScannerDemo />
        <AuthCheckDemo />
        <TheEdgeSection />
        <hr className="pro-section-divider" />
        <GutPunch />
        <hr className="pro-section-divider" />
        <FeatureMatrix />
        <hr className="pro-section-divider" />
        <ROICalculator />
        <hr className="pro-section-divider" />
        <PricingSection onCTA={handleCTA} />
        <hr className="pro-section-divider" />
        <FAQSection />
        <hr className="pro-section-divider" />
        <CloserSection onCTA={handleCTA} />
        <Footer />
      </main>
      <CookieBanner />
      <Toast message={toast.msg} visible={toast.vis} />
    </div>
  );
}
