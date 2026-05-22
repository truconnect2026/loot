"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import CountUp from "@/components/partners/CountUp";
import EarningsCalculator from "@/components/partners/EarningsCalculator";

/**
 * Founding20 — the entire former /partners page ported into /kit as a
 * single deep section. Overview → who-this-is-for → commission cards →
 * earnings calculator → perks → leaderboard → creators grid → how-it-works
 * → FAQ → application form.
 *
 * Styles namespaced under .f20-section so they don't collide with the
 * monolithic .kit-page styles or the standalone .partners-page styles
 * (which we'll delete once we know this section is live).
 */

// MANUAL UPDATE: change LAST_CLAIMED_AT + CLAIMED_SPOTS when a new
// founding spot fills. TODO(David): wire to Supabase once founding-creators
// table exists.
const LAST_CLAIMED_AT = "2 hours ago";
const CLAIMED_SPOTS = 3;
const TOTAL_FOUNDING_SPOTS = 20;

const FORM_MAX_WHY = 250;

const FAQS = [
  {
    q: "When do I get paid?",
    a: "Digistore: bi-weekly after 14-day hold. Stripe via Rewardful: monthly net-30.",
  },
  {
    q: "What if my audience doesn't convert?",
    a: "no quota, no contract — drop us anytime.",
  },
  {
    q: "Can I use my existing affiliate code style?",
    a: "yes — we mint you a custom vanity code (loot.works/yourname → DS24).",
  },
  {
    q: "Will this conflict with my Flipwise / Vendoo / List Perfectly deals?",
    a: "no — Loot is pre-purchase sourcing, those are post-sale bookkeeping. complement, not compete.",
  },
  {
    q: "What's the catch?",
    a: "Founding 20 rates are lifetime. after spot #20, rates drop to standard tiers — lock yours now.",
  },
];

export default function Founding20() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("");
  const [followers, setFollowers] = useState("");
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");
  const [why, setWhy] = useState("");

  const [countdown, setCountdown] = useState<string>("");

  // Monthly leaderboard countdown (resets at end of month).
  // TODO(David): replace local-time end-of-month with timezone-aware target.
  useEffect(() => {
    function tick() {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      setCountdown(`${days}d ${hours}h`);
    }
    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  function toggleFaq(idx: number) {
    setOpenFaq((cur) => (cur === idx ? null : idx));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    // TODO(David): wire submission backend. For now form just sets local
    // submitted state — confirm whether submissions go to email / Slack
    // webhook / Supabase before launch.
    setSubmitted(true);
  }

  return (
    <section id="founding-20" className="f20-section">
      <style dangerouslySetInnerHTML={{ __html: F20_STYLES }} />

      <div className="f20-wrap">
        {/* OVERVIEW */}
        <div className="f20-overview">
          <p className="f20-eyebrow">FOUNDING 20</p>
          <h2 className="f20-headline">
            FLIP PAYS BETTER THAN YOUR LAST 3 AFFILIATE PROGRAMS.
          </h2>
          <p className="f20-sub">
            Founding 20 creators get{" "}
            <strong>60% setup + 40% recurring</strong>. For life.
          </p>

          <div className="f20-scarcity">
            <div className="f20-scarcity-line">
              <span className="f20-pulse-dot" aria-hidden="true" />
              <CountUp value={CLAIMED_SPOTS} duration={800} /> of{" "}
              <CountUp
                value={TOTAL_FOUNDING_SPOTS}
                duration={1000}
                delay={200}
              />{" "}
              founding spots claimed
            </div>
            <div className="f20-last-claimed">
              last spot claimed {LAST_CLAIMED_AT}
            </div>
          </div>

          <a
            href="#founding-20-form"
            className="f20-cta-primary"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("founding-20-form");
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
          >
            CLAIM A SPOT →
          </a>
        </div>

        {/* WHO THIS IS FOR */}
        <div className="f20-block">
          <div className="f20-section-label">WHO THIS IS FOR</div>
          <div className="f20-callouts">
            <div className="f20-callout">
              <span className="f20-arrow">→</span> you make videos about
              thrift, resale, sneakers, vintage, or any combo
            </div>
            <div className="f20-callout">
              <span className="f20-arrow">→</span> your audience already pays
              for reseller tools and listing software
            </div>
            <div className="f20-callout">
              <span className="f20-arrow">→</span> you&apos;ve seen what most
              affiliate programs pay. you deserve different math.
            </div>
            <div className="f20-callout f20-callout--not">
              not for: dropshippers, mass-affiliate aggregators, anyone with
              bought followers. we check.
            </div>
          </div>
        </div>

        {/* THE DEAL */}
        <div className="f20-block">
          <div className="f20-section-label">THE DEAL</div>
          <div className="f20-comm-cards">
            <div className="f20-comm-card">
              <div className="f20-plan-name">MONTHLY</div>
              <div className="f20-plan-price">
                $14.99 <small>/mo</small>
              </div>
              <div className="f20-founding-badge">★ FOUNDING 20 · LIFETIME</div>
              <div className="f20-rate-line">
                <span className="f20-rate-big">60%</span>
                <span className="f20-rate-txt">setup</span>
                <span className="f20-rate-payout">($9.00)</span>
              </div>
              <div className="f20-rate-line">
                <span className="f20-rate-big">40%</span>
                <span className="f20-rate-txt">recurring</span>
              </div>
              <div className="f20-std-row">
                standard tiers: <span>up to 50% / 30% (Gold)</span>
              </div>
            </div>

            <div className="f20-comm-card">
              <div className="f20-plan-name">ANNUAL</div>
              <div className="f20-plan-price">
                $99.99 <small>/yr</small>
              </div>
              <div className="f20-founding-badge">★ FOUNDING 20 · LIFETIME</div>
              <div className="f20-rate-line">
                <span className="f20-rate-big">40%</span>
                <span className="f20-rate-txt">setup</span>
                <span className="f20-rate-payout">($40.00)</span>
              </div>
              <div className="f20-rate-line">
                <span className="f20-rate-big">30%</span>
                <span className="f20-rate-txt">renewal</span>
              </div>
              <div className="f20-std-row">
                standard tiers: <span>up to 40% / 25%</span>
              </div>
            </div>
          </div>

          <div className="f20-comm-pills">
            <span className="f20-comm-pill">365-DAY COOKIE</span>
            <span className="f20-comm-pill">DIGISTORE24 PAYOUT</span>
            <span className="f20-comm-pill">STRIPE + REWARDFUL OPTIONAL</span>
          </div>
        </div>

        {/* EARNINGS CALCULATOR — reuses partners-page styles. Wrap in
            .partners-page to inherit the existing CSS scope. */}
        <div className="f20-block">
          <div className="f20-section-label">DO THE MATH</div>
          <div className="partners-page f20-calc-wrap">
            <EarningsCalculator />
          </div>
          {/* TODO(David): "AT THIS RATE: you'd be #1 on the leaderboard"
              callout is deferred — needs hook into calculator's output state */}
        </div>

        {/* PERKS */}
        <div className="f20-block">
          <div className="f20-section-label">WHAT YOU GET</div>
          <div className="f20-perks-grid">
            <div className="f20-perk">
              <div className="f20-perk-icon">🪐</div>
              <h3>free Pro account for life</h3>
              <p>full access to every Loot feature, no cap on scans, forever</p>
            </div>
            <div className="f20-perk">
              <div className="f20-perk-icon">▦</div>
              <h3>asset bundle</h3>
              <p>banners, mockups, 3 ready-to-post TikTok scripts, IG sticker pack</p>
            </div>
            <div className="f20-perk">
              <div className="f20-perk-icon">📦</div>
              <h3>physical kit</h3>
              <p>Saturn sticker pack, Flip enamel pin, custom thrifted tag with your code</p>
            </div>
            <div className="f20-perk">
              <div className="f20-perk-icon">🔗</div>
              <h3>custom vanity code</h3>
              <p>branded redirect (loot.works/yourname → DS24), ready to drop in your bio</p>
            </div>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="f20-block">
          <div className="f20-section-label">MONTHLY LEADERBOARD</div>
          <div className="f20-lb">
            <h3 className="f20-lb-headline">THIS MONTH&apos;S TOP CREATORS.</h3>
            <ol className="f20-lb-list">
              <li className="f20-lb-row f20-lb-row--1">
                <span className="f20-lb-rank">1st</span>
                <span className="f20-lb-name">
                  {/* TODO(David): seed real handle when leaderboard ships */}
                  <em className="f20-lb-placeholder">— available —</em>
                </span>
                <span className="f20-lb-prize">$500 + Coach Pick feature</span>
              </li>
              <li className="f20-lb-row">
                <span className="f20-lb-rank">2nd</span>
                <span className="f20-lb-name">
                  <em className="f20-lb-placeholder">— available —</em>
                </span>
                <span className="f20-lb-prize">$300</span>
              </li>
              <li className="f20-lb-row">
                <span className="f20-lb-rank">3rd</span>
                <span className="f20-lb-name">
                  <em className="f20-lb-placeholder">— available —</em>
                </span>
                <span className="f20-lb-prize">$200</span>
              </li>
              <li className="f20-lb-row">
                <span className="f20-lb-rank">4th</span>
                <span className="f20-lb-name">
                  <em className="f20-lb-placeholder">— available —</em>
                </span>
                <span className="f20-lb-prize">$100</span>
              </li>
            </ol>
            <div className="f20-lb-bonus">
              🔥 First to 100 paid signups →{" "}
              <strong>$2,500 bonus + Flip merch drop + Coach Pick feature</strong>
            </div>
            <div className="f20-lb-countdown">
              Resets in <strong>{countdown || "—"}</strong>
            </div>
          </div>
        </div>

        {/* FOUNDING CREATORS GRID */}
        <div className="f20-block">
          <div className="f20-section-label">FOUNDING CREATORS</div>
          <div className="f20-creators-grid">
            {Array.from({ length: TOTAL_FOUNDING_SPOTS }).map((_, i) => {
              const isLastFilled = i === CLAIMED_SPOTS;
              return (
                <div
                  key={i}
                  className={`f20-creator-slot${
                    i < CLAIMED_SPOTS ? " f20-creator-slot--filled" : ""
                  }${isLastFilled ? " f20-creator-slot--yours" : ""}`}
                  aria-label={
                    i < CLAIMED_SPOTS
                      ? `Slot ${i + 1} filled`
                      : isLastFilled
                        ? `Slot ${i + 1} — your spot is here`
                        : `Slot ${i + 1} open`
                  }
                >
                  {i < CLAIMED_SPOTS ? (
                    <span className="f20-creator-handle">
                      {/* TODO(David): real handle once signed */}
                      @creator{i + 1}
                    </span>
                  ) : (
                    <span className="f20-creator-plus" aria-hidden="true">
                      +
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="f20-creators-caption">
            <span className="f20-arrow">→</span> your spot is here
          </p>
          {/* TODO(David): seed real creators once 3+ have signed */}
        </div>

        {/* HOW IT WORKS */}
        <div className="f20-block">
          <div className="f20-section-label">HOW IT WORKS</div>
          <div className="f20-steps">
            <div className="f20-step">
              <div className="f20-step-n">1</div>
              <div className="f20-step-body">
                <h3>APPLY</h3>
                <p>60-second form. we read it the same day.</p>
              </div>
            </div>
            <div className="f20-step">
              <div className="f20-step-n">2</div>
              <div className="f20-step-body">
                <h3>GET YOUR KIT</h3>
                <p>digital assets land same-day. physical kit ships in 5 days.</p>
              </div>
            </div>
            <div className="f20-step">
              <div className="f20-step-n">3</div>
              <div className="f20-step-body">
                <h3>POST ONCE, PAID FOREVER</h3>
                <p>your audience scans loot. you collect on every recurring month, forever.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ (Founding-20-specific quick FAQ; full FAQ is at #sec-faq) */}
        <div className="f20-block">
          <div className="f20-section-label">FOUNDING 20 · QUICK FAQ</div>
          <div className="f20-faq">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`f20-faq-item${isOpen ? " f20-faq-item--open" : ""}`}
                >
                  <button
                    type="button"
                    className="f20-faq-q"
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(idx)}
                  >
                    {item.q}
                    <span className="f20-faq-chev" aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  <div className="f20-faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APPLICATION FORM */}
        <div className="f20-block">
          <div id="founding-20-form" className="f20-apply">
            <h3 className="f20-apply-hd">claim your spot</h3>
            <p className="f20-apply-sub">
              60 seconds. we reply same day, every day, no ghosting.
            </p>

            {!submitted && (
              <form noValidate onSubmit={handleSubmit}>
                <div className="f20-form-row f20-form-row--2">
                  <div className="f20-fg">
                    <label className="f20-fl" htmlFor="f20-name">
                      Name
                    </label>
                    <input
                      className="f20-fi"
                      id="f20-name"
                      type="text"
                      placeholder="your name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="f20-fg">
                    <label className="f20-fl" htmlFor="f20-email">
                      Email
                    </label>
                    <input
                      className="f20-fi"
                      id="f20-email"
                      type="email"
                      placeholder="you@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="f20-form-row f20-form-row--2">
                  <div className="f20-fg">
                    <label className="f20-fl" htmlFor="f20-platform">
                      Primary platform
                    </label>
                    <select
                      className="f20-fi"
                      id="f20-platform"
                      required
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                    >
                      <option value="" disabled>
                        select
                      </option>
                      <option>TikTok</option>
                      <option>YouTube</option>
                      <option>Instagram</option>
                      <option>Podcast</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="f20-fg">
                    <label className="f20-fl" htmlFor="f20-followers">
                      Follower count
                    </label>
                    <select
                      className="f20-fi"
                      id="f20-followers"
                      required
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                    >
                      <option value="" disabled>
                        select tier
                      </option>
                      <option>&lt;10k</option>
                      <option>10k – 50k</option>
                      <option>50k – 250k</option>
                      <option>250k+</option>
                    </select>
                  </div>
                </div>

                <div className="f20-fg">
                  <label className="f20-fl" htmlFor="f20-handle">
                    Handle
                  </label>
                  <input
                    className="f20-fi"
                    id="f20-handle"
                    type="text"
                    placeholder="@yourhandle"
                    required
                    pattern="^@[a-zA-Z0-9_.]{1,29}$"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />
                </div>

                <div className="f20-fg">
                  <label className="f20-fl" htmlFor="f20-url">
                    Channel URL (optional)
                  </label>
                  <input
                    className="f20-fi"
                    id="f20-url"
                    type="url"
                    placeholder="https://tiktok.com/@yourhandle"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="f20-fg">
                  <label className="f20-fl" htmlFor="f20-why">
                    Anything we should know?
                  </label>
                  <textarea
                    className="f20-fi"
                    id="f20-why"
                    maxLength={FORM_MAX_WHY}
                    placeholder="optional — one line about you, your audience, or a recent flip"
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                  />
                  <div className="f20-char-ct">
                    {why.length} / {FORM_MAX_WHY}
                  </div>
                </div>

                <p className="f20-trust-line">
                  // no contract · no quota · drop anytime
                </p>
                <button type="submit" className="f20-cta-submit">
                  CLAIM MY SPOT →
                </button>
                <p className="f20-apply-note">
                  we reply within 24 hours, no ghosting
                </p>
              </form>
            )}

            {submitted && (
              <div className="f20-form-ok">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5CE0B8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ margin: "0 auto 12px", display: "block" }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <h3>you&apos;re in the queue</h3>
                <p>
                  decision same day (we promise). check your @ — we DM from
                  @loot.works.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const F20_STYLES = `
.f20-section {
  position: relative;
  padding: 64px 0;
  background: rgba(255,255,255,0.01);
  border-top: 1px solid rgba(245,197,24,0.08);
  border-bottom: 1px solid rgba(245,197,24,0.08);
}
@media (min-width: 768px) { .f20-section { padding: 96px 0; } }
.f20-section .f20-wrap { max-width: 880px; margin: 0 auto; padding: 0 24px; }

.f20-section .f20-overview { margin-bottom: 48px; }
.f20-section .f20-eyebrow {
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.28em;
  color: #F5C518;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.f20-section .f20-headline {
  font: 600 clamp(28px, 4.5vw, 44px)/1.1 var(--display);
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 14px;
  text-transform: uppercase;
  max-width: 760px;
}
.f20-section .f20-sub {
  font: 400 16px/1.55 var(--display);
  color: rgba(255,255,255,0.7);
  margin-bottom: 24px;
}
.f20-section .f20-sub strong { color: #F5C518; font-weight: 600; }

.f20-section .f20-scarcity { margin-bottom: 24px; }
.f20-section .f20-scarcity-line {
  display: inline-flex; align-items: center; gap: 8px;
  font: 500 13px/1 var(--mono);
  color: #5CE0B8;
  margin-bottom: 4px;
}
.f20-section .f20-pulse-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #5CE0B8;
  box-shadow: 0 0 8px rgba(92,224,184,0.6);
  animation: f20-pulse 2.4s ease-in-out infinite;
}
@keyframes f20-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.92); }
}
.f20-section .f20-last-claimed {
  font: 500 10px/1.4 var(--mono);
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.4);
  padding-left: 16px;
}
.f20-section .f20-cta-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 30px;
  background: linear-gradient(180deg, #F5C518 0%, #E0B414 100%);
  color: #0A0A0A;
  font: 700 13px/1 var(--mono);
  letter-spacing: 0.08em;
  text-decoration: none;
  border-radius: 9999px;
  box-shadow: 0 8px 24px rgba(245,197,24,0.3);
  transition: transform 0.15s, box-shadow 0.2s;
}
.f20-section .f20-cta-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 32px rgba(245,197,24,0.45);
}

.f20-section .f20-block { padding: 36px 0; border-top: 1px solid rgba(255,255,255,0.04); }
.f20-section .f20-block:first-of-type { border-top: none; padding-top: 0; }
.f20-section .f20-section-label {
  font: 600 11px/1 var(--mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 20px;
}

/* Who this is for */
.f20-section .f20-callouts { display: flex; flex-direction: column; }
.f20-section .f20-callout {
  font: 500 13px/1.55 var(--mono);
  color: rgba(255,255,255,0.85);
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.f20-section .f20-callout:last-child { border-bottom: none; }
.f20-section .f20-callout--not { color: rgba(255,255,255,0.5); font-style: italic; }
.f20-section .f20-arrow { color: #5CE0B8; margin-right: 6px; }

/* Commission cards */
.f20-section .f20-comm-cards {
  display: grid; grid-template-columns: 1fr; gap: 12px;
  margin-bottom: 16px;
}
@media (min-width: 640px) { .f20-section .f20-comm-cards { grid-template-columns: 1fr 1fr; } }
.f20-section .f20-comm-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(245,197,24,0.2);
  border-radius: 16px; padding: 22px 20px;
}
.f20-section .f20-plan-name {
  font: 700 10px/1 var(--mono);
  letter-spacing: 0.14em; color: rgba(255,255,255,0.4); margin-bottom: 6px;
}
.f20-section .f20-plan-price { font: 700 28px/1 var(--mono); color: #fff; margin-bottom: 12px; }
.f20-section .f20-plan-price small { font: 400 14px/1 var(--display); color: rgba(255,255,255,0.4); }
.f20-section .f20-founding-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font: 700 9px/1 var(--mono); letter-spacing: 0.14em;
  color: #F5C518;
  background: rgba(245,197,24,0.1); border: 1px solid rgba(245,197,24,0.22);
  border-radius: 6px; padding: 5px 10px; margin-bottom: 12px;
}
.f20-section .f20-rate-line { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
.f20-section .f20-rate-big { font: 700 24px/1 var(--mono); color: #5CE0B8; }
.f20-section .f20-rate-txt { font: 400 13px/1.3 var(--display); color: rgba(255,255,255,0.65); }
.f20-section .f20-rate-payout { font: 700 13px/1 var(--mono); color: rgba(92,224,184,0.7); }
.f20-section .f20-std-row {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.04);
  font: 400 12px/1.4 var(--display); color: rgba(255,255,255,0.4);
}
.f20-section .f20-std-row span { color: rgba(255,255,255,0.55); font-family: var(--mono); font-weight: 500; }

.f20-section .f20-comm-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.f20-section .f20-comm-pill {
  font: 500 11px/1 var(--mono); letter-spacing: 0.12em;
  color: #5CE0B8; padding: 10px 14px;
  border: 1px solid rgba(92,224,184,0.25); border-radius: 9999px;
}
.f20-section .f20-comm-compare {
  font: 500 13px/1.55 var(--display); color: rgba(255,255,255,0.55);
}

/* Calculator wrapper — let .partners-page scope handle the inner CSS */
.f20-section .f20-calc-wrap { background: transparent; }

/* Perks */
.f20-section .f20-perks-grid {
  display: grid; gap: 12px; grid-template-columns: 1fr;
}
@media (min-width: 640px) { .f20-section .f20-perks-grid { grid-template-columns: 1fr 1fr; } }
.f20-section .f20-perk {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 22px;
}
.f20-section .f20-perk-icon { font-size: 24px; margin-bottom: 12px; }
.f20-section .f20-perk h3 { font: 600 15px/1.35 var(--display); color: #fff; margin-bottom: 5px; }
.f20-section .f20-perk p { font: 400 13px/1.5 var(--display); color: rgba(255,255,255,0.6); }

/* Leaderboard */
.f20-section .f20-lb {
  background: rgba(245,197,24,0.04);
  border: 1px solid rgba(245,197,24,0.25);
  border-radius: 16px; padding: 28px 24px;
}
.f20-section .f20-lb-headline {
  font: 600 24px/1 var(--display);
  letter-spacing: 0.02em;
  color: #fff;
  margin-bottom: 20px;
  text-transform: uppercase;
}
.f20-section .f20-lb-list { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 8px; }
.f20-section .f20-lb-row {
  display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center;
  padding: 12px 14px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  font: 500 13px/1.3 var(--mono);
}
.f20-section .f20-lb-row--1 { border-color: rgba(245,197,24,0.4); background: rgba(245,197,24,0.08); }
.f20-section .f20-lb-rank { font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 0.08em; }
.f20-section .f20-lb-row--1 .f20-lb-rank { color: #F5C518; }
.f20-section .f20-lb-name { color: rgba(255,255,255,0.85); }
.f20-section .f20-lb-placeholder { font-style: italic; color: rgba(255,255,255,0.3); }
.f20-section .f20-lb-prize { color: #F5C518; font-weight: 700; text-align: right; }
.f20-section .f20-lb-bonus {
  font: 400 13px/1.55 var(--display);
  color: rgba(255,255,255,0.7);
  padding: 12px 14px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  margin-bottom: 10px;
}
.f20-section .f20-lb-bonus strong { color: #F5C518; font-weight: 600; }
.f20-section .f20-lb-countdown {
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.5);
  text-align: right;
}
.f20-section .f20-lb-countdown strong { color: #F5C518; font-weight: 700; }

/* Founding creators grid */
.f20-section .f20-creators-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
@media (min-width: 768px) { .f20-section .f20-creators-grid { grid-template-columns: repeat(5, 1fr); } }
.f20-section .f20-creator-slot {
  aspect-ratio: 1;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
}
.f20-section .f20-creator-slot--filled {
  border: 1px solid rgba(92,224,184,0.4);
  background: rgba(92,224,184,0.06);
}
.f20-section .f20-creator-slot--yours {
  border: 1px dashed rgba(92,224,184,0.6);
  background: rgba(92,224,184,0.1);
  position: relative;
}
.f20-section .f20-creator-handle {
  font: 500 9px/1 var(--mono);
  letter-spacing: 0.04em;
  color: #5CE0B8;
  text-align: center;
  padding: 0 6px;
  word-break: break-all;
}
.f20-section .f20-creator-plus {
  font: 500 18px/1 var(--mono);
  color: rgba(255,255,255,0.2);
}
.f20-section .f20-creators-caption {
  font: 400 13px/1.4 var(--display);
  color: rgba(255,255,255,0.6);
}

/* Steps */
.f20-section .f20-steps {
  display: grid; grid-template-columns: 1fr; gap: 16px;
}
@media (min-width: 640px) { .f20-section .f20-steps { grid-template-columns: 1fr 1fr 1fr; } }
.f20-section .f20-step { display: flex; gap: 14px; align-items: flex-start; }
.f20-section .f20-step-n {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid rgba(92,224,184,0.3);
  display: flex; align-items: center; justify-content: center;
  font: 700 14px/1 var(--mono); color: #5CE0B8; flex-shrink: 0;
}
.f20-section .f20-step h3 {
  font: 700 12px/1 var(--mono);
  letter-spacing: 0.1em; color: #5CE0B8; margin-bottom: 6px;
}
.f20-section .f20-step p { font: 400 14px/1.5 var(--display); color: rgba(255,255,255,0.65); }

/* FAQ */
.f20-section .f20-faq { display: flex; flex-direction: column; }
.f20-section .f20-faq-item {
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.f20-section .f20-faq-q {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  background: none; border: none; cursor: pointer;
  width: 100%; text-align: left;
  font: 500 14px/1.45 var(--display); color: rgba(255,255,255,0.85);
}
.f20-section .f20-faq-q:hover { color: #fff; }
.f20-section .f20-faq-chev {
  flex-shrink: 0; color: #F5C518;
  transition: transform 250ms cubic-bezier(0.16,1,0.3,1);
}
.f20-section .f20-faq-item--open .f20-faq-chev { transform: rotate(180deg); }
.f20-section .f20-faq-a {
  max-height: 0; overflow: hidden;
  transition: max-height 350ms ease, padding 350ms ease;
}
.f20-section .f20-faq-item--open .f20-faq-a { max-height: 220px; padding-bottom: 16px; }
.f20-section .f20-faq-a p { font: 400 14px/1.6 var(--display); color: rgba(255,255,255,0.65); }

/* Application form */
.f20-section .f20-apply {
  max-width: 540px; margin: 0 auto;
  padding: 32px 24px;
  background: rgba(92,224,184,0.03);
  border: 1px solid rgba(92,224,184,0.25);
  border-radius: 18px;
}
.f20-section .f20-apply-hd { font: 700 24px/1.15 var(--display); color: #fff; text-align: center; margin-bottom: 8px; }
.f20-section .f20-apply-sub {
  font: 400 14px/1.5 var(--display); color: rgba(255,255,255,0.6);
  text-align: center; margin-bottom: 28px;
}
.f20-section .f20-form-row { display: grid; gap: 14px; grid-template-columns: 1fr; }
@media (min-width: 480px) { .f20-section .f20-form-row--2 { grid-template-columns: 1fr 1fr; } }
.f20-section .f20-fg { margin-bottom: 14px; }
.f20-section .f20-fl {
  display: block;
  font: 500 10px/1 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  margin-bottom: 6px;
}
.f20-section .f20-fi {
  width: 100%; height: 48px; padding: 0 14px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  font: 500 16px/1 var(--display); color: rgba(255,255,255,0.85);
  outline: none;
  transition: border-color 200ms, box-shadow 200ms;
}
.f20-section textarea.f20-fi { height: 96px; padding: 12px 14px; resize: none; line-height: 1.45; }
.f20-section select.f20-fi {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
}
.f20-section .f20-fi:focus, .f20-section .f20-fi:focus-visible {
  border-color: #5CE0B8;
  box-shadow: 0 0 0 3px rgba(92,224,184,0.12);
}
.f20-section .f20-fi::placeholder { color: rgba(255,255,255,0.25); }
.f20-section .f20-char-ct { text-align: right; font: 400 11px/1 var(--display); color: rgba(255,255,255,0.35); margin-top: 4px; }
.f20-section .f20-trust-line {
  text-align: center; margin-bottom: 14px;
  font: 500 11px/1 var(--mono); color: rgba(255,255,255,0.5);
}
.f20-section .f20-cta-submit {
  width: 100%;
  padding: 16px;
  background: linear-gradient(180deg, #6FE5C0 0%, #5CE0B8 100%);
  color: #0A0A0A;
  font: 700 13px/1 var(--mono);
  letter-spacing: 0.08em;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 0 24px rgba(92,224,184,0.25), 0 2px 8px rgba(0,0,0,0.3);
  transition: transform 0.15s, box-shadow 0.2s;
}
.f20-section .f20-cta-submit:hover { transform: translateY(-1px); box-shadow: 0 0 36px rgba(92,224,184,0.4); }
.f20-section .f20-apply-note { text-align: center; margin-top: 14px; font: 400 13px/1 var(--display); color: rgba(255,255,255,0.4); }
.f20-section .f20-form-ok { text-align: center; padding: 36px 20px; }
.f20-section .f20-form-ok h3 { font: 700 22px/1.2 var(--display); color: #5CE0B8; margin-bottom: 8px; }
.f20-section .f20-form-ok p { font: 400 14px/1.5 var(--display); color: rgba(255,255,255,0.65); }

@media (prefers-reduced-motion: reduce) {
  .f20-section .f20-pulse-dot { animation: none; }
}
`;
