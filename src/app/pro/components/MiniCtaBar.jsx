"use client";

import { useEffect, useState } from "react";
import { C } from "../lib/colors.js";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * Persistent mini-CTA bar — fixed to the VIEWPORT, rendered as a
 * sibling of .pro-scroll-main (never inside it), so it can't
 * participate in snap. Anchor-only: the CLAIM button scrolls to
 * #pricing inside the snap scroller; zero checkout interaction.
 *
 * Visibility: shows once the authenticate section has been scrolled
 * past, hides while the pricing OR closer section is on-screen,
 * reappears in between. Driven by one passive scroll listener on the
 * scroller (cheap rect reads, no IO churn on three targets).
 * Transform/opacity only; reduced motion toggles instantly.
 */

export default function MiniCtaBar() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scroller = document.querySelector(".pro-scroll-main");
    if (!scroller) return;
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
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
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
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.75)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        loot pro &middot; $14.99/mo
      </span>
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
        style={{
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
