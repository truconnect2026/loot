"use client";

import { useEffect, useState } from "react";
import { C } from "../lib/colors.js";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * Persistent mini-CTA bar — fixed to the VIEWPORT, rendered as a
 * sibling of .pro-scroll-main (never inside it), so it can't
 * participate in snap. Anchor-only: the CLAIM button smooth-scrolls to
 * #pricing inside the snap scroller; zero checkout interaction.
 *
 * Visibility: shows once the authenticate section has been scrolled
 * past, hides while the pricing OR closer section is on-screen,
 * reappears in between. Driven by one passive scroll listener on the
 * scroller (cheap rect reads, no IO churn).
 *
 * CONTEXTUAL LABEL: a static bar goes banner-blind, so the label swaps
 * by zone — features → the $200-mistake hook, math → the price,
 * gutpunch (the section delivering the user into pricing) and FAQ →
 * the annual frame, so the bar's last visible state before it hides
 * always matches where it's sending the user. Swap = opacity crossfade
 * on absolutely-stacked spans in a FIXED-width slot (bar geometry never
 * moves). Reduced motion: instant swap.
 */

const LABELS = {
  mistake: "never eat a $200 mistake",
  price: "loot pro · $14.99/mo",
  annual: "$8.33/mo billed annually",
};

export default function MiniCtaBar() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const [zone, setZone] = useState("price");

  useEffect(() => {
    const scroller = document.querySelector(".pro-scroll-main");
    if (!scroller) return;
    const sections = [...scroller.querySelectorAll(".pro-snap-section")];
    const authSec = [...document.querySelectorAll("h2")]
      .find((h) => h.textContent.includes("catch the rep"))
      ?.closest(".pro-snap-section");
    const pricingSec = document.getElementById("pricing");
    const closerSec = [...document.querySelectorAll("h2")]
      .find((h) => h.textContent.includes("already in the bin"))
      ?.closest(".pro-snap-section");
    if (!authSec || !pricingSec || !closerSec) return;
    // trailing end-aligned wrapper (LegitStrip + Footer): at the bottom
    // rest it fills the viewport with no scroll room left, so the bar
    // must not float over the legal band either.
    const tail = closerSec.nextElementSibling;
    // Zone anchors by index in the section list (features=3, math=4,
    // gutpunch=5, faq=7 — the pricing/closer zones hide the bar anyway).
    const zoneFor = (idx) => {
      if (idx <= 3) return "mistake";
      if (idx === 4) return "price";
      return "annual"; // gutpunch onward: deliver the annual frame
    };

    const update = () => {
      const top = scroller.getBoundingClientRect().top;
      const vh = scroller.clientHeight;
      const passedAuth = authSec.getBoundingClientRect().bottom < top + vh * 0.4;
      const onScreen = (el) => {
        // 2px epsilon: at a snap landing the previous section's bottom sits
        // EXACTLY on the scroller top, and sub-pixel rounding must not count
        // that abutting edge as "on screen" (it kept the bar hidden over FAQ).
        const r = el.getBoundingClientRect();
        return r.top < top + vh - 2 && r.bottom > top + 2;
      };
      setVisible(
        passedAuth && !onScreen(pricingSec) && !onScreen(closerSec) && !(tail && onScreen(tail))
      );
      // current section = last one whose top sits above the viewport middle
      let idx = 0;
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top - top <= vh * 0.5) idx = i;
      }
      setZone(zoneFor(idx));
    };
    scroller.addEventListener("scroll", update, { passive: true });
    update();
    return () => scroller.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50, // above section content (z 1), below the top header (z 100)
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        // Pinned to the exact band .pro-page-root reserves (see
        // pro.module.css) so the bar overlays reserved space only.
        height: "calc(56px + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
        padding: "0 16px env(safe-area-inset-bottom, 0px)",
        background: "rgba(7,5,16,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(92,224,184,0.2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: reduced ? "none" : "opacity 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1)",
        // The bar is a SIBLING of the scroller, so a touch that lands on
        // it can't scroll-chain into .pro-scroll-main. Keep the container
        // transparent to input and let only the button take events —
        // swipes starting over the bar still scroll the page underneath.
        pointerEvents: "none",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
.mcb-claim { transition: transform 120ms ease, filter 120ms ease; }
.mcb-claim:active { transform: scale(0.97); filter: brightness(0.92); }
`,
        }}
      />
      {/* Label slot sized by CONTENT, not a guessed px width: all three
          zone labels stack in the same 1/1 grid cell, so the slot is
          always exactly as wide as the widest label at the device's real
          font metrics. (A hard-coded 186px slot was 13px narrower than
          the longest label and its text painted under the CLAIM button
          on-device.) Crossfade unchanged; geometry constant. */}
      <span
        style={{
          display: "inline-grid",
          whiteSpace: "nowrap",
        }}
      >
        {Object.entries(LABELS).map(([key, text]) => (
          <span
            key={key}
            style={{
              gridArea: "1 / 1",
              textAlign: "right",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              lineHeight: "16px",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.75)",
              fontVariantNumeric: "tabular-nums",
              opacity: zone === key ? 1 : 0,
              transition: reduced ? "none" : "opacity 250ms ease",
            }}
          >
            {text}
          </span>
        ))}
      </span>
      <button
        type="button"
        className="mcb-claim"
        tabIndex={visible ? 0 : -1}
        onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
        style={{
          flexShrink: 0,
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: 15,
          letterSpacing: "0.06em",
          color: C.bg,
          background: "linear-gradient(180deg, #6FE5C0 0%, #4FD1A5 100%)",
          border: "none",
          borderRadius: 9,
          padding: "8px 18px",
          cursor: "pointer",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        CLAIM &rarr;
      </button>
    </div>
  );
}
