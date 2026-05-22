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
 *   <GutPunch />             counts to 487 on first scroll-into-view
 *   <FeatureMatrix />
 *   <ROICalculator />
 *   <Testimonials />
 *   <PricingSection onCTA={handleCTA} />
 *   <FAQSection />
 *   <CloserSection onCTA={handleCTA} />  ← annual_closer UTM
 *   <Toast />
 *
 * CTA flow: button fires a mint toast (visual confirmation), then 600ms
 * later window.location.href = digistore checkout URL with UTM params.
 * Metadata + Google Fonts loaded in layout.jsx (server component).
 */

import { useCallback, useState } from "react";
import "./pro.module.css";
import CosmicBackground from "./components/CosmicBackground.jsx";
import TopStrip from "./components/TopStrip.jsx";
import HeroSection from "./components/HeroSection.jsx";
import GutPunch from "./components/GutPunch.jsx";
import FeatureMatrix from "./components/FeatureMatrix.jsx";
import ROICalculator from "./components/ROICalculator.jsx";
import Testimonials from "./components/Testimonials.jsx";
import PricingSection from "./components/PricingSection.jsx";
import FAQSection from "./components/FAQSection.jsx";
import CloserSection from "./components/CloserSection.jsx";
import Toast from "./components/Toast.jsx";

const DIGISTORE_BASE = "https://checkout-ds24.com/product/691098";

function checkoutUrl(campaign) {
  return `${DIGISTORE_BASE}?utm_source=pro_page&utm_medium=cta&utm_campaign=${encodeURIComponent(campaign)}`;
}

export default function ProPage() {
  const [toast, setToast] = useState({ msg: "", vis: false });

  const handleCTA = useCallback((plan) => {
    const label =
      plan === "annual_closer"
        ? "Annual Pro"
        : plan === "annual"
          ? "Annual Pro"
          : "Monthly Pro";
    setToast({ msg: `→ ${label} · routing to checkout`, vis: true });
    // Brief 600ms hold so the user sees the confirmation, then redirect.
    window.setTimeout(() => {
      window.location.href = checkoutUrl(plan);
    }, 600);
    window.setTimeout(() => setToast((t) => ({ ...t, vis: false })), 3000);
  }, []);

  return (
    <div className="pro-page-root">
      <CosmicBackground />
      <TopStrip />
      <main>
        <HeroSection />
        <hr className="pro-section-divider" />
        <GutPunch />
        <hr className="pro-section-divider" />
        <FeatureMatrix />
        <hr className="pro-section-divider" />
        <ROICalculator />
        <hr className="pro-section-divider" />
        <Testimonials />
        <hr className="pro-section-divider" />
        <PricingSection onCTA={handleCTA} />
        <hr className="pro-section-divider" />
        <FAQSection />
        <hr className="pro-section-divider" />
        <CloserSection onCTA={handleCTA} />
      </main>
      <Toast message={toast.msg} visible={toast.vis} />
    </div>
  );
}
