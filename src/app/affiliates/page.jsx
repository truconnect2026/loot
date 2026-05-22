"use client";

/**
 * /affiliates — affiliate operating manual for the Digistore Pro program.
 *
 * Reuses /pro's atoms, CosmicBackground, Footer, CookieBanner, and CSS
 * keyframes by importing pro.module.css alongside the page-specific
 * affiliates.module.css. .jsx only (Turbopack trap — see /pro page header).
 *
 * Section order locked by spec:
 *   TopStrip → Hero → WhyConverts → CommissionDetails → SwipeCopy →
 *   ContentAngles → VisualAssets → AffiliateFAQ → Leaderboard → Closer →
 *   SupportContact → Footer + CookieBanner
 */

import "../pro/pro.module.css";
import "./affiliates.module.css";

import CosmicBackground from "../pro/components/CosmicBackground.jsx";
import Footer from "../pro/components/Footer.jsx";
import CookieBanner from "../pro/components/CookieBanner.jsx";

import TopStrip from "./components/TopStrip.jsx";
import HeroSection from "./components/HeroSection.jsx";
import WhyConverts from "./components/WhyConverts.jsx";
import CommissionDetails from "./components/CommissionDetails.jsx";
import SwipeCopy from "./components/SwipeCopy.jsx";
import ContentAngles from "./components/ContentAngles.jsx";
import VisualAssets from "./components/VisualAssets.jsx";
import AffiliateFAQ from "./components/AffiliateFAQ.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Closer from "./components/Closer.jsx";
import SupportContact from "./components/SupportContact.jsx";

export default function AffiliatesPage() {
  return (
    <div className="aff-page-root pro-page-root">
      <CosmicBackground />
      <TopStrip />

      <main>
        <HeroSection />
        <hr className="pro-section-divider" />
        <WhyConverts />
        <hr className="pro-section-divider" />
        <CommissionDetails />
        <hr className="pro-section-divider" />
        <SwipeCopy />
        <hr className="pro-section-divider" />
        <ContentAngles />
        <hr className="pro-section-divider" />
        <VisualAssets />
        <hr className="pro-section-divider" />
        <AffiliateFAQ />
        <hr className="pro-section-divider" />
        <Leaderboard />
        <hr className="pro-section-divider" />
        <Closer />
        <SupportContact />
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
