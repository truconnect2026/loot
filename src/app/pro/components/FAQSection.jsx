"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp, SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE, SECTION_PADDING, SectionShell } from "./atoms.jsx";

const faqData = [
  {
    q: "what if i'm not even a 'real' flipper yet?",
    // "the map finds sales / alerts catch trends before they spike"
    // referenced unbuilt features — aligned to what actually ships.
    a: "perfect. Pro turns you into one faster. the AI identifies items you wouldn't recognize, the planner times your store runs, and the watch list pings you when a grail shows up.",
  },
  {
    q: "what if i don't like it?",
    a: "60-day full refund, no questions. you can also cancel anytime from settings. no chat, no email, no friction. you're in control.",
  },
  {
    q: "why subscription vs. one-time?",
    a: "live eBay comps require ongoing data infrastructure. the AI improves weekly. new features ship monthly. subscription means you always have the sharpest tool.",
  },
  {
    q: "can i switch between monthly and annual?",
    a: "yes. upgrade to annual anytime and we'll prorate. downgrade at any renewal.",
  },
  {
    // Rewritten to the SHIPPED /sourcing feature. The old answer claimed
    // Craigslist/FB/estate-sale scraping with distance filters and nearby
    // push alerts — none of which exists in the app (fabricated claim).
    q: "how does the sale-day planner work?",
    a: "add the stores you actually hit. loot knows each chain's rhythm — 50% off days, senior days, restock days — and builds your week around them. your own check-ins confirm the pattern over time.",
  },
  {
    q: "do you sell my data?",
    a: "never. your scans stay yours. your hauls stay yours. the only data we use is aggregated, anonymized comps to improve the AI.",
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) setHeight(contentRef.current.scrollHeight);
  }, [isOpen]);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "#fff",
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: isOpen ? "#fff" : "rgba(255,255,255,0.75)",
            transition: "color 0.2s",
          }}
        >
          {item.q}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            // 22px glyph in a 24px box: the old 18px + read as microscopic
            // on device; the row is full-width tappable, the glyph just
            // needs to LOOK tappable.
            fontSize: 22,
            color: C.mint,
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(45deg)" : "rotate(0)",
            flexShrink: 0,
            // Fixed square + flex centering so the glyph rotates around its
            // true optical center instead of drifting when it becomes x.
            width: 24,
            height: 24,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transformOrigin: "center",
            lineHeight: 1,
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          height: isOpen ? height : 0,
          overflow: "hidden",
          transition: "height 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.3s",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: 15,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.65,
              paddingBottom: 22,
            }}
          >
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  // -1 = all collapsed on landing so the question list scans at a
  // glance (item 0 used to auto-expand purely because this was 0).
  const [open, setOpen] = useState(-1);
  return (
    <section
      className="pro-snap-section"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: SECTION_PADDING,
        // Internal-scroll section: extra bottom room so an in-app-browser
        // fold (~620px usable) never rests decapitating the last card.
        paddingBottom: 96,
        position: "relative",
        zIndex: 1,
        // Six FAQ rows reliably exceed one viewport — top-align + scroll
        // internally rather than center-force.
        justifyContent: "flex-start",
      }}
    >
      <SectionShell maxWidth={750}>
        <FadeUp>
          <Eyebrow text="— still on the fence?" color={C.mint} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2
            className="faq-headline"
            style={{
              ...SECTION_HEADLINE_STYLE,
              paddingBottom: "0.25em",
              // 28 (was 48): headline + at least three question rows must
              // share one 390x844 viewport.
              marginBottom: 28,
            }}
          >
            REAL QUESTIONS. <span style={{ color: C.mint }}>REAL ANSWERS.</span>
          </h2>
        </FadeUp>

        <div>
          {faqData.map((item, i) => (
            <FadeUp key={i} delay={0.04 * i}>
              <FAQItem
                item={item}
                isOpen={open === i}
                onToggle={() => {
                  const opening = open !== i;
                  if (opening) track("pro_faq_expanded", { question: item.q });
                  setOpen(opening ? i : -1);
                }}
              />
            </FadeUp>
          ))}
        </div>
      </SectionShell>
    </section>
  );
}
