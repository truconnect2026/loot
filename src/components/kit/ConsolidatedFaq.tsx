"use client";

import { useState } from "react";

/**
 * ConsolidatedFaq — the single FAQ section that combines affiliate +
 * Founding 20 + general questions. The /partners-specific FAQ is also
 * preserved as a "quick FAQ" inside the Founding 20 section, but this
 * is the canonical one.
 */

const FAQS = [
  {
    q: "How fast do I get paid?",
    a: "Digistore pays weekly. $50 threshold. PayPal / bank / check supported.",
  },
  {
    q: "What's the cookie window?",
    a: "60 days for Standard, 365 days for Founding 20.",
  },
  {
    q: "Can I climb tiers automatically?",
    a: "Yes. Hit $1,000 in 90 days → auto-promoted to Gold (50% recurring + vanity code unlocked).",
  },
  {
    q: "Can I apply directly for Founding 20?",
    a: "Yes. 20 spots total. Application form is in the Founding 20 section above. We reply same-day, no ghosting.",
  },
  {
    q: "What if I'm already at Gold and want Founding 20?",
    a: "Gold affiliates get priority review for Founding 20 spots when they open. Email us with your traffic data.",
  },
  {
    q: "Do I earn on annual subs?",
    a: "Yes. $40 one-time per annual sub at Standard (40%). $50 at Gold (50%). $60 setup at Founding 20 (60%).",
  },
  {
    q: "What if the customer refunds?",
    a: "60-day refund clawback applies (matches the customer refund window). Encourages quality referrals over volume spam.",
  },
  {
    q: "Can I run paid ads to loot.works?",
    a: "Yes — with one exception. Branded keyword bidding (loot.works, loot works, etc.) is NOT allowed. All other paid traffic is fine. Email us for large campaigns.",
  },
  {
    q: "Do you provide leads / lists?",
    a: "No. We don't share user data with affiliates.",
  },
  {
    q: "How does the leaderboard work?",
    a: "Top 4 affiliates by referrals each month win cash prizes ($500/$300/$200/$100). First to 100 paid signups all-time → $2,500 + Flip merch drop + Coach Pick feature.",
  },
  {
    q: "Will this conflict with my Flipwise / Vendoo / List Perfectly deals?",
    a: "Each program has its own terms. Run them in parallel if their TOS allow. We don't restrict.",
  },
];

export default function ConsolidatedFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="sec-faq" className="cfaq-section">
      <style dangerouslySetInnerHTML={{ __html: CFAQ_STYLES }} />

      <div className="cfaq-wrap">
        <p className="cfaq-eyebrow">FAQ</p>
        <h2 className="cfaq-headline">EVERYTHING ELSE.</h2>

        <div className="cfaq-list">
          {FAQS.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className={`cfaq-item${isOpen ? " cfaq-item--open" : ""}`}
              >
                <button
                  type="button"
                  className="cfaq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  <span className="cfaq-chev" aria-hidden="true">
                    ▾
                  </span>
                </button>
                <div className="cfaq-a">
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const CFAQ_STYLES = `
.cfaq-section { padding: 56px 0; }
@media (min-width: 768px) { .cfaq-section { padding: 80px 0; } }
.cfaq-section .cfaq-wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }
.cfaq-section .cfaq-eyebrow {
  font: 500 11px/1 var(--mono, var(--font-space-mono), monospace);
  letter-spacing: 0.28em;
  color: #5CE0B8;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.cfaq-section .cfaq-headline {
  font: 600 clamp(32px, 5vw, 48px)/1 var(--display, var(--font-manrope), sans-serif);
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 32px;
  text-transform: uppercase;
}
.cfaq-section .cfaq-list { display: flex; flex-direction: column; }
.cfaq-section .cfaq-item { border-bottom: 1px solid rgba(255,255,255,0.06); }
.cfaq-section .cfaq-q {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px;
  width: 100%;
  padding: 18px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font: 500 15px/1.45 var(--display);
  color: rgba(255,255,255,0.9);
}
.cfaq-section .cfaq-q:hover { color: #fff; }
.cfaq-section .cfaq-chev {
  flex-shrink: 0;
  color: #5CE0B8;
  font-size: 14px;
  transition: transform 250ms cubic-bezier(0.16,1,0.3,1);
}
.cfaq-section .cfaq-item--open .cfaq-chev { transform: rotate(180deg); }
.cfaq-section .cfaq-a {
  max-height: 0; overflow: hidden;
  transition: max-height 400ms ease, padding 400ms ease;
}
.cfaq-section .cfaq-item--open .cfaq-a { max-height: 260px; padding-bottom: 16px; }
.cfaq-section .cfaq-a p {
  font: 400 14px/1.65 var(--display);
  color: rgba(255,255,255,0.65);
  max-width: 600px;
}
`;
