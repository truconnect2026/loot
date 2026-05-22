"use client";

import { useMemo, useState } from "react";

/**
 * OpenProgram — Standard 40% tier section. Where casual visitors convert
 * into open-program affiliates via Digistore signup.
 *
 * Includes inline earnings preview (single-row slider, mint border) and
 * a program-specs card with the boring numbers spelled out so visitors
 * can compare apples-to-apples against the competition.
 *
 * Bottom gold callout points up the ladder: $1,000 in 90 days auto-promotes
 * to Gold. This is the "you're not stuck at 40%" hook.
 */

const DIGISTORE_SIGNUP = "https://digistore24.com/signup/691098/";
const MONTHLY_COMMISSION = 14.99 * 0.4; // 5.996

export default function OpenProgram() {
  const [referrals, setReferrals] = useState(10);

  const { monthly, annual, future } = useMemo(() => {
    const m = Math.round(referrals * MONTHLY_COMMISSION);
    const a = m * 12;
    // Compound preview: grow from current → 50 over 12 months (linear),
    // then sum the monthly earnings over that growth path.
    const grown = 50;
    const months = 12;
    let f = 0;
    for (let i = 1; i <= months; i++) {
      const r = referrals + ((grown - referrals) * i) / months;
      f += r * MONTHLY_COMMISSION;
    }
    return { monthly: m, annual: a, future: Math.round(f) };
  }, [referrals]);

  return (
    <section className="op-section" id="sec-open">
      <style dangerouslySetInnerHTML={{ __html: OPEN_PROGRAM_STYLES }} />

      <div className="op-wrap">
        <div className="op-header">
          <p className="op-eyebrow">THE OPEN PROGRAM</p>
          <h2 className="op-headline">JOIN IN 60 SECONDS.</h2>
          <p className="op-sub">
            No application. No vetting. Sign up via Digistore → get your link
            → start earning today.
          </p>
        </div>

        {/* Earnings preview */}
        <div className="op-earnings">
          <div className="op-earnings-head">
            <span className="op-earnings-label">REFERRALS YOU SEND PER MONTH</span>
            <span className="op-earnings-value">{referrals}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={referrals}
            onChange={(e) => setReferrals(Number(e.target.value))}
            className="op-slider"
            aria-label="Monthly referrals"
          />
          <div className="op-earnings-output">
            <div className="op-out-row">
              <span className="op-out-label">MONTHLY COMMISSION</span>
              <span className="op-out-monthly">${monthly}</span>
            </div>
            <div className="op-out-row">
              <span className="op-out-label">ANNUAL VALUE</span>
              <span className="op-out-annual">${annual.toLocaleString()}</span>
            </div>
            <div className="op-out-compound">
              After 1 year of growth ({referrals} → 50 referrals):{" "}
              <strong>${future.toLocaleString()}</strong>
            </div>
            <div className="op-out-caption">
              *assumes monthly Pro subs at $14.99 × 40%. annual subs payout once
              per renewal · refunds clawback within 60 days.
            </div>
          </div>
        </div>

        {/* Program specs */}
        <div className="op-specs">
          <div className="op-specs-title">PROGRAM SPECS</div>
          <ul className="op-specs-list">
            <li>
              <span>Commission</span>
              <strong>40% recurring</strong>
            </li>
            <li>
              <span>Cookie window</span>
              <strong>60 days</strong>
            </li>
            <li>
              <span>Payout</span>
              <strong>Weekly via Digistore (PayPal / bank / check)</strong>
            </li>
            <li>
              <span>Threshold</span>
              <strong>$50 minimum</strong>
            </li>
            <li>
              <span>Refund clawback</span>
              <strong>60-day window (matches refund policy)</strong>
            </li>
          </ul>
        </div>

        <a
          href={DIGISTORE_SIGNUP}
          target="_blank"
          rel="noopener noreferrer"
          className="op-cta"
        >
          GET YOUR LINK →
        </a>

        {/* Gold callout — ladder up */}
        <div className="op-gold-callout">
          <span className="op-gold-icon" aria-hidden="true">
            ★
          </span>
          <div className="op-gold-text">
            Hit <strong>$1,000 in 90 days</strong> → auto-promoted to{" "}
            <strong>Gold (50% recurring + vanity code unlocked)</strong>
            <a
              href="#sec-ladder"
              className="op-gold-link"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("sec-ladder");
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - 80;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
            >
              → See Gold benefits
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const OPEN_PROGRAM_STYLES = `
.op-section { padding: 56px 0; }
@media (min-width: 768px) { .op-section { padding: 80px 0; } }
.op-section .op-wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }
.op-section .op-header { margin-bottom: 32px; }
.op-section .op-eyebrow {
  font: 500 11px/1 var(--mono, 'JetBrains Mono', monospace);
  letter-spacing: 0.28em;
  color: #5CE0B8;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.op-section .op-headline {
  font: 600 clamp(36px, 7vw, 72px)/1 var(--display, 'Outfit', sans-serif);
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.op-section .op-sub {
  font: 400 16px/1.55 var(--display);
  color: rgba(255,255,255,0.65);
  max-width: 540px;
}
.op-section .op-earnings {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(92,224,184,0.35);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 16px;
  box-shadow: 0 0 32px rgba(92,224,184,0.04);
}
.op-section .op-earnings-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 14px;
}
.op-section .op-earnings-label {
  font: 500 10px/1 var(--mono);
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
}
.op-section .op-earnings-value {
  font: 700 24px/1 var(--mono);
  color: #5CE0B8;
}
.op-section .op-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  outline: none;
  margin-bottom: 24px;
  cursor: pointer;
}
.op-section .op-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; border-radius: 50%;
  background: #5CE0B8;
  border: 2px solid #0A0A0A;
  box-shadow: 0 0 12px rgba(92,224,184,0.6);
  cursor: grab;
}
.op-section .op-slider::-moz-range-thumb {
  width: 20px; height: 20px; border-radius: 50%;
  background: #5CE0B8; border: 2px solid #0A0A0A;
  box-shadow: 0 0 12px rgba(92,224,184,0.6);
}
.op-section .op-earnings-output {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.op-section .op-out-row {
  display: flex; justify-content: space-between; align-items: baseline;
}
.op-section .op-out-label {
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
}
.op-section .op-out-monthly {
  font: 600 40px/1 var(--display);
  color: #F5C518;
}
.op-section .op-out-annual {
  font: 700 18px/1 var(--mono);
  color: #5CE0B8;
}
.op-section .op-out-compound {
  font: 400 13px/1.5 var(--display);
  color: rgba(255,255,255,0.55);
  padding: 10px 0;
  border-top: 1px solid rgba(255,255,255,0.04);
}
.op-section .op-out-compound strong { color: #5CE0B8; font-weight: 600; }
.op-section .op-out-caption {
  font: 400 11px/1.5 var(--mono);
  color: rgba(255,255,255,0.35);
}
.op-section .op-specs {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}
.op-section .op-specs-title {
  font: 500 10px/1 var(--mono);
  letter-spacing: 0.18em;
  color: rgba(255,255,255,0.5);
  margin-bottom: 16px;
  text-transform: uppercase;
}
.op-section .op-specs-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 0;
}
.op-section .op-specs-list li {
  display: flex; justify-content: space-between; gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font: 400 13px/1.4 var(--mono);
}
.op-section .op-specs-list li:last-child { border-bottom: none; }
.op-section .op-specs-list span { color: rgba(255,255,255,0.5); letter-spacing: 0.06em; }
.op-section .op-specs-list strong {
  color: #fff; font-weight: 700; text-align: right;
}
.op-section .op-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font: 700 16px/1 var(--mono);
  letter-spacing: 0.08em;
  background: linear-gradient(180deg, #6FE5C0 0%, #5CE0B8 100%);
  color: #0A0A0A;
  text-decoration: none;
  padding: 22px 28px;
  border: none;
  border-radius: 100px;
  border-top: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 12px 36px rgba(92,224,184,0.35), inset 0 0 0 1px rgba(92,224,184,0.3);
  transition: transform 0.15s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;
  cursor: pointer;
  margin-bottom: 16px;
}
.op-section .op-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 44px rgba(92,224,184,0.5), inset 0 0 0 1px rgba(92,224,184,0.4); }
.op-section .op-cta:active { transform: translateY(0); }
.op-section .op-gold-callout {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: rgba(245,197,24,0.05);
  border: 1px solid rgba(245,197,24,0.3);
  border-radius: 12px;
}
.op-section .op-gold-icon {
  flex-shrink: 0;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #F5C518;
  border: 1px solid rgba(245,197,24,0.5);
  border-radius: 50%;
}
.op-section .op-gold-text {
  font: 400 14px/1.55 var(--display);
  color: rgba(255,255,255,0.85);
  flex: 1;
}
.op-section .op-gold-text strong { color: #F5C518; font-weight: 700; }
.op-section .op-gold-link {
  display: inline-block;
  margin-top: 6px;
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.08em;
  color: #F5C518;
  text-decoration: underline;
}
.op-section .op-gold-link:hover { opacity: 0.8; }
`;
