"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

const FAQ_DATA = [
  {
    q: "How fast do I get paid?",
    a: "Digistore pays weekly. Minimum $50 threshold. PayPal, bank transfer, or check.",
  },
  {
    q: "What's the cookie window?",
    a: "60 days. Someone clicks your link, signs up within 60 days = your commission. 60 days is generous in SaaS.",
  },
  {
    q: "Do I earn on annual subs?",
    a: "Yes. $40 one-time per annual sub. Lower lifetime value than monthly subs typically, but bigger upfront.",
  },
  {
    q: "What if the customer refunds?",
    a: "Standard refund clawback applies. If they refund within the 7-day window, your commission reverses. Encourages quality referrals.",
  },
  {
    q: "Can I run paid ads to loot.works?",
    a: "Yes — but branded keyword bidding (loot.works, loot works app, etc.) is NOT allowed. All other paid traffic is fine. Email lootworks.goflip@gmail.com to discuss large campaigns.",
  },
  {
    q: "Do you provide leads / lists?",
    a: "No. We don't share user data with affiliates. Standard SaaS practice.",
  },
  {
    q: "What's the average conversion rate?",
    // TODO(David): these conversion rates are illustrative ranges, not pulled
    // from real Digistore reporting. Validate against real attribution data
    // (or remove the question) before submitting externally.
    a: "Varies by channel. TikTok: 1-3%. Newsletter: 5-8%. Direct DM: 10%+. Your mileage will vary.",
  },
  {
    q: "Can I earn more than 40%?",
    // TODO(David): define the actual top-tier threshold + how affiliates qualify.
    a: "Possibly. Top affiliates get bumped to 50%. Email lootworks.goflip@gmail.com to discuss once you're producing.",
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
          aria-hidden="true"
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

export default function AffiliateFAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "clamp(80px,10vw,128px) 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 750, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="questions" color={C.mint} />
        </FadeUp>
        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              margin: "0 0 48px",
            }}
          >
            REAL QUESTIONS. <span style={{ color: C.mint }}>REAL ANSWERS.</span>
          </h2>
        </FadeUp>

        <div>
          {FAQ_DATA.map((item, i) => (
            <FadeUp key={i} delay={0.04 * i}>
              <FAQItem
                item={item}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
