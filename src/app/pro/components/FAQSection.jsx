"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import { Eyebrow, FadeUp, SECTION_HEADLINE_SIZE, SECTION_PADDING, SectionShell } from "./atoms.jsx";

const faqData = [
  {
    q: "what if i'm not even a 'real' flipper yet?",
    a: "perfect. Pro turns you into one faster. the AI identifies items you wouldn't recognize, the map finds sales you'd miss, and the alerts catch trends before they spike. Pro is most valuable for resellers leveling up.",
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
    q: "how does the yard sale map work?",
    a: "Pro pulls listings from Craigslist, Facebook Marketplace, Estatesales.net, and local newspapers. filters by date, distance, and item type. push alert when grail items are listed nearby.",
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
            fontSize: 18,
            color: C.purple,
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(45deg)" : "rotate(0)",
            flexShrink: 0,
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
  const [open, setOpen] = useState(0);
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
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: SECTION_HEADLINE_SIZE,
              lineHeight: 1.0,
              paddingBottom: "0.25em",
              marginBottom: 48,
            }}
          >
            REAL QUESTIONS. <span style={{ color: C.purple }}>REAL ANSWERS.</span>
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
