"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import CountUp from "@/components/partners/CountUp";
import EarningsCalculator from "@/components/partners/EarningsCalculator";

// MANUAL UPDATE: change LAST_CLAIMED_AT when a new founding spot fills.
const LAST_CLAIMED_AT = "2 hours ago";
const CLAIMED_SPOTS = 3;
const TOTAL_FOUNDING_SPOTS = 20;

/**
 * /partners — partner / affiliate landing page.
 *
 * Converted from marketing/06-landing-page/partners.html (Claude Design
 * export). The visual design is preserved 1:1; only interactivity is
 * lifted into React state (FAQ accordion, character counter, form
 * submit). All asset hrefs that were "#" placeholders in the source
 * stay as "#" — they're wired in a follow-up commit.
 *
 * Public route — see middleware whitelist alongside /pro and /kit.
 */

const PAGE_STYLES = `
/* ═══ TOKENS ═══ */
:root {
  --bg-page: #120e18;
  --bg-darker: #0A0812;
  --mint: #5CE0B8;
  --camel: #D4A574;
  --periwinkle: #7B8FFF;
  --text-1: #C8C0D8;
  --text-2: rgba(255,255,255,0.62);
  --text-dim: #5A4E70;
  --text-ghost: #3D2E55;
  --border-hair: rgba(255,255,255,0.06);
  --border-mint: rgba(92,224,184,0.20);
  --surface-mint: rgba(92,224,184,0.08);
  --ff-body: 'Outfit', system-ui, sans-serif;
  --ff-mono: 'JetBrains Mono', ui-monospace, monospace;
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
}

/* ═══ RESET + BASE ═══ */
.partners-page *, .partners-page *::before, .partners-page *::after { box-sizing: border-box; margin: 0; padding: 0; }
.partners-page {
  font: 400 15px/1.5 var(--ff-body);
  color: var(--text-1);
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  background-color: var(--bg-page);
  background-image: radial-gradient(circle, rgba(92,224,184,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  overflow-x: hidden;
  scroll-behavior: smooth;
}
.partners-page::before {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 65% 55% at 15% 8%, rgba(92,224,184,0.05), transparent 65%),
    radial-gradient(ellipse 55% 60% at 85% 85%, rgba(123,143,255,0.04), transparent 60%);
  z-index: 0;
}
.partners-page a { color: inherit; text-decoration: none; }

/* ═══ LAYOUT ═══ */
.partners-page .page { position: relative; z-index: 1; }
.partners-page .wrap { max-width: 680px; margin: 0 auto; padding: 0 20px; }
.partners-page .wrap--wide { max-width: 780px; }
.partners-page .section-label {
  font: 600 11px/1 var(--ff-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 24px;
}
.partners-page .divider {
  height: 1px; max-width: 140px; margin: 0 auto;
  background: linear-gradient(90deg, transparent, rgba(92,224,184,0.3), transparent);
}

/* ═══ HERO ═══ */
.partners-page .hero { padding: 44px 0 56px; }
.partners-page .logo-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 52px; }
.partners-page .wm {
  font: 700 22px/1 var(--ff-mono);
  letter-spacing: 0.15em;
  color: var(--mint);
  text-shadow: 0 0 20px rgba(92,224,184,0.18), 0 0 4px rgba(92,224,184,0.3);
}
.partners-page .partners-tag {
  font: 500 11px/1 var(--ff-mono);
  letter-spacing: 0.2em; color: var(--mint); opacity: 0.6;
}
.partners-page .hero h1 {
  font: 700 30px/1.12 var(--ff-body);
  color: #fff; margin-bottom: 14px; max-width: 480px;
}
.partners-page .hero .sub {
  font: 400 16px/1.55 var(--ff-body);
  color: var(--text-2); margin-bottom: 32px; max-width: 440px;
}
.partners-page .hero .sub b { font-weight: 600; color: var(--mint); font-family: var(--ff-mono); }
.partners-page .hero .sub em { font-style: normal; color: var(--camel); font-weight: 600; }
.partners-page .scarcity {
  display: inline-flex; align-items: center; gap: 8px;
  font: 500 13px/1 var(--ff-mono); color: var(--mint); margin-bottom: 24px;
}
.partners-page .pulse-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--mint); box-shadow: 0 0 8px rgba(92,224,184,0.6);
  animation: partners-pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes partners-pulse {
  0%, 70% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(92,224,184,0.6); }
  72% { opacity: 0.2; transform: scale(0.85); box-shadow: 0 0 4px rgba(92,224,184,0.3); }
  74% { opacity: 1; transform: scale(1); box-shadow: 0 0 16px rgba(92,224,184,0.8); }
  78% { opacity: 0.2; transform: scale(0.85); box-shadow: 0 0 4px rgba(92,224,184,0.3); }
  80%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 16px rgba(92,224,184,0.8); }
}
.partners-page .scarcity-stack {
  display: flex; flex-direction: column; gap: 4px; margin-bottom: 24px;
}
.partners-page .scarcity-stack .scarcity { margin-bottom: 0; }
.partners-page .last-claimed {
  font: 500 10px/1.4 var(--ff-mono);
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.4);
  padding-left: 16px;
}
.partners-page .sticky-pill {
  position: fixed; bottom: 24px; right: 24px;
  display: inline-flex; align-items: center; gap: 12px;
  padding: 10px 18px;
  background: rgba(10,22,18,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(92,224,184,0.35);
  border-radius: 999px;
  font: 500 11px/1 var(--ff-mono); letter-spacing: 0.04em;
  color: rgba(255,255,255,0.85);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  opacity: 0; transform: translateY(20px); pointer-events: none;
  transition: opacity 280ms cubic-bezier(0.4,0,0.2,1), transform 280ms cubic-bezier(0.4,0,0.2,1);
  z-index: 50;
}
.partners-page .sticky-pill.visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
.partners-page .sticky-pill button {
  background: none; border: none; cursor: pointer; padding: 0;
  font: 500 14px/1 var(--ff-mono); color: rgba(92,224,184,0.5);
  width: 16px; height: 16px;
  transition: color 150ms ease;
}
.partners-page .sticky-pill button:hover { color: var(--mint); }
@media (max-width: 639px) {
  .partners-page .sticky-pill {
    bottom: 0; right: 0; left: 0;
    border-radius: 12px 12px 0 0;
    padding: 14px 20px;
    justify-content: space-between;
  }
}
.partners-page .cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 52px; padding: 0 30px;
  background: var(--mint); color: var(--bg-darker);
  font: 700 13px/1 var(--ff-mono); letter-spacing: 0.08em;
  border: none; border-radius: 9999px; cursor: pointer;
  transition: transform 120ms var(--ease-spring), box-shadow 200ms ease;
  box-shadow: 0 0 24px rgba(92,224,184,0.2), 0 2px 8px rgba(0,0,0,0.3);
}
.partners-page .cta:hover { box-shadow: 0 0 36px rgba(92,224,184,0.35), 0 2px 8px rgba(0,0,0,0.3); }
.partners-page .cta:active { transform: scale(0.97); }

/* ═══ WHO THIS IS FOR ═══ */
.partners-page .who-for { padding: 56px 0; }
.partners-page .callout {
  font: 500 13px/1.55 var(--ff-mono);
  color: var(--text-1); padding: 14px 0;
  border-bottom: 1px solid var(--border-hair);
}
.partners-page .callout:last-child { border-bottom: none; }
.partners-page .callout .arrow { color: var(--mint); margin-right: 6px; }

/* ═══ COMMISSIONS ═══ */
.partners-page .commissions { padding: 56px 0; }
.partners-page .comm-cards { display: grid; gap: 12px; margin-bottom: 20px; }
.partners-page .comm-card {
  background: var(--bg-page);
  border: 1px solid var(--border-mint);
  border-radius: 16px; padding: 22px 20px;
  box-shadow: var(--shadow-card);
}
.partners-page .plan-name {
  font: 700 10px/1 var(--ff-mono);
  letter-spacing: 0.14em; color: var(--text-dim); margin-bottom: 4px;
}
.partners-page .plan-price { font: 700 24px/1 var(--ff-mono); color: #fff; margin-bottom: 14px; }
.partners-page .plan-price small { font: 400 13px/1 var(--ff-body); color: var(--text-dim); }
.partners-page .founding-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font: 700 9px/1 var(--ff-mono); letter-spacing: 0.14em;
  color: var(--camel);
  background: rgba(212,165,116,0.10); border: 1px solid rgba(212,165,116,0.22);
  border-radius: 6px; padding: 5px 10px; margin-bottom: 10px;
}
.partners-page .rate-line { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
.partners-page .rate-big { font: 700 22px/1 var(--ff-mono); color: var(--mint); }
.partners-page .rate-txt { font: 400 13px/1.3 var(--ff-body); color: var(--text-2); }
.partners-page .rate-payout { font: 700 13px/1 var(--ff-mono); color: var(--mint); opacity: 0.7; }
.partners-page .std-row {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid var(--border-hair);
  font: 400 12px/1.4 var(--ff-body); color: var(--text-dim);
}
.partners-page .std-row span { color: rgba(255,255,255,0.35); font-family: var(--ff-mono); font-weight: 500; }
.partners-page .comm-compare {
  font: 500 13px/1.55 var(--ff-body); color: var(--text-2); margin-bottom: 10px;
}
.partners-page .comm-pills {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;
}
.partners-page .comm-pill {
  font: 500 11px/1 var(--ff-mono); letter-spacing: 0.12em;
  color: var(--mint); padding: 10px 14px;
  border: 1px solid var(--border-mint); border-radius: 9999px;
  background: transparent;
}

/* ═══ PERKS ═══ */
.partners-page .perks { padding: 56px 0; }
.partners-page .perks-grid { display: grid; gap: 12px; }
.partners-page .perk {
  background: var(--bg-page);
  background-image: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005));
  border: 1px solid var(--border-hair);
  border-radius: 16px; padding: 20px;
  box-shadow: var(--shadow-card);
}
.partners-page .perk svg { display: block; margin-bottom: 14px; }
.partners-page .perk h3 { font: 600 15px/1.35 var(--ff-body); color: #fff; margin-bottom: 5px; }
.partners-page .perk p { font: 400 13px/1.5 var(--ff-body); color: var(--text-2); }

/* ═══ LEADERBOARD ═══ */
.partners-page .leaderboard { padding: 40px 0; }
.partners-page .lb-strip {
  background: var(--bg-page);
  border: 1px solid rgba(212,165,116,0.14);
  border-radius: 16px; padding: 24px 20px;
  text-align: center; box-shadow: var(--shadow-card);
}
.partners-page .lb-title {
  font: 600 10px/1 var(--ff-mono);
  letter-spacing: 0.14em; color: var(--text-dim); margin-bottom: 14px;
}
.partners-page .lb-prizes { font: 700 18px/1.2 var(--ff-mono); color: var(--camel); margin-bottom: 14px; }
.partners-page .lb-bonus { font: 400 12px/1.55 var(--ff-body); color: var(--text-dim); }
.partners-page .lb-bonus strong { color: var(--camel); font-weight: 600; }

/* ═══ SOCIAL PROOF ═══ */
.partners-page .social { padding: 48px 0; text-align: center; }
.partners-page .logo-strip { display: flex; justify-content: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.partners-page .logo-ph {
  width: 52px; height: 52px;
  border: 1px dashed rgba(92,224,184,0.25);
  border-radius: 10px; background: var(--surface-mint);
  display: flex; align-items: center; justify-content: center;
}
.partners-page .logo-ph::after {
  content: '+';
  font: 500 18px/1 var(--ff-mono);
  color: rgba(92,224,184,0.3);
}
.partners-page .logo-ph.yours { position: relative; border-color: rgba(92,224,184,0.4); }
.partners-page .your-spot { font: 400 13px/1.4 var(--ff-body); color: var(--text-2); }
.partners-page .your-spot span { color: var(--mint); }

/* ═══ HOW IT WORKS ═══ */
.partners-page .how { padding: 56px 0; }
.partners-page .steps { display: grid; gap: 20px; }
.partners-page .step { display: flex; gap: 14px; align-items: flex-start; }
.partners-page .step-n {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid rgba(92,224,184,0.25);
  display: flex; align-items: center; justify-content: center;
  font: 700 14px/1 var(--ff-mono); color: var(--mint); flex-shrink: 0;
}
.partners-page .step h3 {
  font: 700 12px/1 var(--ff-mono);
  letter-spacing: 0.10em; color: var(--mint); margin-bottom: 6px;
}
.partners-page .step p { font: 400 14px/1.5 var(--ff-body); color: var(--text-2); }

/* ═══ FAQ ═══ */
.partners-page .faq { padding: 56px 0; }
.partners-page .faq-item { border-bottom: 1px solid var(--border-hair); }
.partners-page .faq-q {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 0; cursor: pointer;
  background: none; border: none; width: 100%; text-align: left;
  font: 500 14px/1.45 var(--ff-body); color: var(--text-1);
}
.partners-page .faq-q:hover { color: #fff; }
.partners-page .faq-chev {
  flex-shrink: 0;
  transition: transform 250ms var(--ease-spring);
}
.partners-page .faq-item.open .faq-chev { transform: rotate(180deg); }
.partners-page .faq-a {
  max-height: 0; overflow: hidden;
  transition: max-height 350ms ease, padding 350ms ease;
}
.partners-page .faq-item.open .faq-a { max-height: 200px; padding-bottom: 16px; }
.partners-page .faq-a p { font: 400 14px/1.6 var(--ff-body); color: var(--text-2); }

/* ═══ APPLICATION ═══ */
.partners-page .apply { padding: 56px 0 72px; max-width: 520px; margin: 0 auto; }
.partners-page .apply-hd { font: 700 24px/1.15 var(--ff-body); color: #fff; text-align: center; margin-bottom: 8px; }
.partners-page .apply-sub { font: 400 14px/1.5 var(--ff-body); color: var(--text-2); text-align: center; margin-bottom: 28px; }
.partners-page .fg { margin-bottom: 14px; }
.partners-page .fl {
  display: block; font: 500 10px/1 var(--ff-mono);
  letter-spacing: 0.10em; text-transform: uppercase;
  color: var(--text-dim); margin-bottom: 6px;
}
.partners-page .fi {
  width: 100%; height: 48px; padding: 0 14px;
  background: rgba(0,0,0,0.30);
  border: 1px solid var(--border-hair);
  border-radius: 10px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);
  font: 500 16px/1 var(--ff-body); color: var(--text-1); outline: none;
  transition: border-color 150ms ease;
}
.partners-page .fi { transition: border-color 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms cubic-bezier(0.4,0,0.2,1), background 200ms ease; }
.partners-page .fi:hover { border-color: rgba(92,224,184,0.4); }
.partners-page .fi:focus, .partners-page .fi:focus-visible {
  border-color: var(--mint);
  box-shadow: 0 0 0 3px rgba(92,224,184,0.12);
  background: rgba(255,255,255,0.03);
  outline: none;
}
.partners-page .fi::placeholder { color: var(--text-ghost); }
.partners-page .fhelp {
  display: block; margin-top: 6px;
  font: 500 10px/1.4 var(--ff-mono); letter-spacing: 0.02em;
  color: rgba(255,255,255,0.45);
}
.partners-page textarea.fi { height: 96px; padding: 12px 14px; resize: none; line-height: 1.45; }
.partners-page select.fi {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235A4E70' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
}
.partners-page select.fi option { background: var(--bg-page); color: var(--text-1); }
.partners-page .char-ct { text-align: right; font: 400 11px/1 var(--ff-body); color: var(--text-dim); margin-top: 4px; }
.partners-page .form-row { display: grid; gap: 14px; }
.partners-page .cta--full { width: 100%; margin-top: 8px; }
.partners-page .trust-line {
  text-align: center; margin-bottom: 14px;
  font: 500 11px/1 var(--ff-mono); color: rgba(255,255,255,0.55);
}
.partners-page .apply-note { text-align: center; margin-top: 14px; font: 400 13px/1 var(--ff-body); color: var(--text-dim); }
.partners-page .form-ok { text-align: center; padding: 48px 20px; }
.partners-page .form-ok h3 { font: 700 22px/1.2 var(--ff-body); color: var(--mint); margin-bottom: 8px; }
.partners-page .form-ok p { font: 400 14px/1.5 var(--ff-body); color: var(--text-2); }

/* ═══ FOOTER ═══ */
.partners-page footer { padding: 48px 20px 28px; max-width: 680px; margin: 0 auto; border-top: 1px solid var(--border-hair); }
.partners-page .ft-top { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.partners-page .ft-wm { font: 700 16px/1 var(--ff-mono); letter-spacing: 0.15em; color: var(--mint); opacity: 0.6; }
.partners-page .ft-links { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 14px; }
.partners-page .ft-links a { font: 400 13px/1 var(--ff-body); color: var(--text-dim); transition: color 150ms; }
.partners-page .ft-links a:hover { color: var(--text-1); }
.partners-page .ft-biz { font: 400 12px/1.5 var(--ff-body); color: var(--text-ghost); margin-bottom: 6px; }
.partners-page .ft-copy { font: 400 12px/1 var(--ff-body); color: var(--text-ghost); }

/* ═══ FOUNDER VIDEO ═══ */
.partners-page .founder-video {
  max-width: 720px; margin: 0 auto; padding: 24px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(92,224,184,0.06), transparent 65%),
    var(--bg-page);
  border: 1px solid rgba(92,224,184,0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), var(--shadow-card);
}
.partners-page .fv-eyebrow { font: 500 11px/1 var(--ff-mono); letter-spacing: 0.28em; color: var(--mint); text-transform: uppercase; }
.partners-page .fv-title { font: 700 24px/1.15 var(--ff-body); color: #fff; margin: 8px 0 6px; }
.partners-page .fv-dek { font: 400 14px/1.5 var(--ff-body); color: var(--text-2); margin-bottom: 20px; }
.partners-page .fv-frame {
  position: relative; width: 100%; aspect-ratio: 16 / 9;
  border: 1px solid rgba(92,224,184,0.4); border-radius: 10px;
  overflow: hidden; background: #000;
}
.partners-page .fv-frame iframe { width: 100%; height: 100%; border: 0; display: block; }
.partners-page .fv-thumb {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(92,224,184,0.12), transparent 60%),
    #0a0a0a;
  cursor: pointer; border: none; color: #fff;
}
.partners-page .fv-thumb img { width: 96px; height: 96px; object-fit: contain; filter: drop-shadow(0 0 24px rgba(92,224,184,0.25)); }
.partners-page .fv-play {
  font: 700 13px/1 var(--ff-mono); letter-spacing: 0.18em; color: var(--mint);
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px; border: 1px solid var(--mint); border-radius: 999px;
  background: rgba(0,0,0,0.4);
  transition: background 150ms ease, transform 150ms ease;
}
.partners-page .fv-thumb:hover .fv-play { background: var(--mint); color: var(--bg-darker); transform: scale(1.03); }
.partners-page .fv-caption {
  margin-top: 14px; text-align: center;
  font: 500 11px/1.4 var(--ff-mono); color: rgba(255,255,255,0.55);
}

/* ═══ EARNINGS CALCULATOR ═══ */
.partners-page .earnings-calculator {
  padding: 40px 24px; margin: 24px auto 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(92,224,184,0.06), transparent 65%),
    var(--bg-page);
  border: 1px solid rgba(92,224,184,0.3);
  border-radius: 18px;
  box-shadow: 0 0 60px rgba(92,224,184,0.05), var(--shadow-card);
}
.partners-page .ec-title { font: 700 28px/1.1 var(--ff-body); color: #fff; margin: 6px 0 6px; }
.partners-page .ec-dek { font: 400 14px/1.5 var(--ff-body); color: var(--text-2); margin-bottom: 24px; }
.partners-page .ec-grid {
  display: grid; gap: 28px;
  grid-template-columns: 1fr;
}
.partners-page .ec-sliders { display: flex; flex-direction: column; gap: 22px; }
.partners-page .ec-slider-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
.partners-page .ec-slider-label { font: 500 11px/1 var(--ff-mono); letter-spacing: 0.2em; color: var(--mint); text-transform: uppercase; }
.partners-page .ec-slider-value { font: 700 18px/1 var(--ff-mono); color: var(--mint); }
.partners-page .ec-slider input[type="range"] {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 4px;
  background: linear-gradient(to right, rgba(92,224,184,0.6) 0%, rgba(92,224,184,0.6) var(--filled, 50%), rgba(255,255,255,0.06) var(--filled, 50%), rgba(255,255,255,0.06) 100%);
  border: 1px solid rgba(92,224,184,0.25); border-radius: 999px; outline: none; cursor: pointer;
}
.partners-page .ec-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--mint); border: 2px solid var(--bg-page);
  box-shadow: 0 0 12px rgba(92,224,184,0.6); cursor: grab;
  transition: transform 120ms ease;
}
.partners-page .ec-slider input[type="range"]::-moz-range-thumb {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--mint); border: 2px solid var(--bg-page);
  box-shadow: 0 0 12px rgba(92,224,184,0.6); cursor: grab;
}
.partners-page .ec-slider input[type="range"]:hover::-webkit-slider-thumb,
.partners-page .ec-slider input[type="range"]:active::-webkit-slider-thumb { transform: scale(1.15); }
.partners-page .ec-slider-range { display: flex; justify-content: space-between; margin-top: 8px; font: 500 10px/1 var(--ff-mono); color: rgba(255,255,255,0.35); }
.partners-page .ec-helper { margin-top: 8px; font: 500 10px/1.4 var(--ff-mono); color: rgba(255,255,255,0.45); }
.partners-page .ec-outputs { display: flex; flex-direction: column; gap: 16px; padding-top: 24px; border-top: 1px solid rgba(92,224,184,0.15); }
.partners-page .ec-out {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 16px; border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-hair);
}
.partners-page .ec-out-hero {
  border-top: 1px dashed rgba(92,224,184,0.45);
  border-bottom: 1px dashed rgba(92,224,184,0.45);
  border-left: 1px solid rgba(92,224,184,0.25);
  border-right: 1px solid rgba(92,224,184,0.25);
  background: rgba(92,224,184,0.04);
  padding: 18px 16px;
}
.partners-page .ec-out-label { font: 500 11px/1 var(--ff-mono); letter-spacing: 0.16em; color: var(--text-dim); text-transform: uppercase; }
.partners-page .ec-out-value { font: 700 28px/1 var(--ff-body); color: var(--mint); font-variant-numeric: tabular-nums; }
.partners-page .ec-out-value-hero { font-size: 48px; text-shadow: 0 0 24px rgba(92,224,184,0.25); }
.partners-page .ec-out-value-sm { font: 700 18px/1 var(--ff-mono); }
.partners-page .ec-out-sub { font: 400 12px/1.4 var(--ff-body); color: var(--text-dim); }
.partners-page .ec-footnote { margin-top: 18px; text-align: center; font: 500 11px/1.4 var(--ff-mono); color: rgba(255,255,255,0.4); }
@media (min-width: 768px) {
  .partners-page .earnings-calculator { padding: 40px; }
  .partners-page .ec-grid { grid-template-columns: 0.85fr 1fr; gap: 48px; }
  .partners-page .ec-outputs { padding-top: 0; border-top: none; }
}

/* ═══ RESPONSIVE ═══ */
@media (min-width: 640px) {
  .partners-page .hero h1 { font-size: 40px; }
  .partners-page .comm-cards { grid-template-columns: 1fr 1fr; }
  .partners-page .perks-grid { grid-template-columns: 1fr 1fr; }
  .partners-page .form-row { grid-template-columns: 1fr 1fr; }
  .partners-page .steps { grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .partners-page .step { flex-direction: column; text-align: center; align-items: center; }
}
@media (min-width: 1024px) {
  .partners-page .hero h1 { font-size: 48px; max-width: 580px; }
  .partners-page .hero { padding-top: 64px; padding-bottom: 72px; }
  .partners-page .callout { font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .partners-page *, .partners-page *::before, .partners-page *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// TODO(deploy): replace PLACEHOLDER_LOOM_ID with the real Loom video id once
// David records the founder intro. See marketing/founder-loom-script.md.
const FOUNDER_LOOM_ID = "PLACEHOLDER_LOOM_ID";

function FounderVideo() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="fv-frame">
      {playing ? (
        <iframe
          src={`https://www.loom.com/embed/${FOUNDER_LOOM_ID}?autoplay=1`}
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          title="David — founder intro"
        />
      ) : (
        <button
          type="button"
          className="fv-thumb"
          onClick={() => setPlaying(true)}
          aria-label="Play founder video"
        >
          <img src="/brand-kit/flip/flip-smirk.png" alt="" />
          <span className="fv-play">▷ HEAR FROM DAVID</span>
        </button>
      )}
    </div>
  );
}

const FAQS = [
  {
    q: "When do I get paid?",
    a: "Digistore: bi-weekly after 14-day hold. Stripe via Rewardful: monthly net-30",
  },
  {
    q: "What if my audience doesn't convert?",
    a: "no quota, no contract — drop us anytime",
  },
  {
    q: "Can I use my existing affiliate code style?",
    a: "yes — we mint you a custom vanity code in our system",
  },
  {
    q: "Will this conflict with my Flipwise / Vendoo / List Perfectly deals?",
    a: "no — Loot is pre-purchase sourcing, those are post-sale bookkeeping. complement, not compete",
  },
  {
    q: "What's the catch?",
    a: "Founding 20 rates are lifetime. after spot #20, rates drop to standard tiers — lock yours now",
  },
];

const FORM_MAX_WHY = 250;

export default function PartnersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("");
  const [followers, setFollowers] = useState("");
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");
  const [why, setWhy] = useState("");
  const [showStickyPill, setShowStickyPill] = useState(false);
  const [pillDismissed, setPillDismissed] = useState(false);
  const commissionsRef = useRef<HTMLElement | null>(null);
  const applyRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!commissionsRef.current || !applyRef.current) return;
      const commissionsBottom =
        commissionsRef.current.getBoundingClientRect().bottom;
      const applyTop = applyRef.current.getBoundingClientRect().top;
      const pastCommissions = commissionsBottom < window.innerHeight * 0.3;
      const beforeApply = applyTop > window.innerHeight * 0.8;
      setShowStickyPill(pastCommissions && beforeApply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleFaq(idx: number) {
    setOpenFaq((cur) => (cur === idx ? null : idx));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
  }

  function handleScrollToApply(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const el = document.getElementById("apply");
    if (el) window.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="partners-page">
        <div className="page">
          {/* ═══ 1 · HERO ═══ */}
          <header className="hero wrap">
            <nav className="logo-bar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74"
                  stroke="#5CE0B8"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.32"
                />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="6.5"
                  ry="6"
                  stroke="#5CE0B8"
                  strokeWidth="1.5"
                />
                <path
                  d="M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74"
                  stroke="#5CE0B8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="wm">LOOT</span>
              <span className="partners-tag">PARTNERS</span>
            </nav>

            <h1>Flip pays better than your last 3 affiliate programs</h1>

            <p className="sub">
              <em>Founding{" "}
              <CountUp value={TOTAL_FOUNDING_SPOTS} duration={1000} />
              </em>{" "}creators get{" "}
              <b>
                <CountUp value={60} suffix="%" duration={1100} /> setup +{" "}
                <CountUp value={40} suffix="%" duration={1100} delay={200} />{" "}
                recurring
              </b>
              . For life.
            </p>

            <div className="scarcity-stack">
              <div className="scarcity">
                <span className="pulse-dot" aria-hidden="true"></span>
                <CountUp value={CLAIMED_SPOTS} duration={800} /> of{" "}
                <CountUp value={TOTAL_FOUNDING_SPOTS} duration={1000} delay={200} />{" "}
                founding spots claimed
              </div>
              <div className="last-claimed">
                last spot claimed {LAST_CLAIMED_AT}
              </div>
            </div>
            <a
              className="cta"
              href="#apply"
              onClick={handleScrollToApply}
            >
              CLAIM A SPOT →
            </a>
          </header>

          {/* ═══ 2 · WHO THIS IS FOR ═══ */}
          <section className="who-for wrap">
            <div className="section-label">WHO THIS IS FOR</div>
            <div className="callout">
              <span className="arrow">→</span> you make videos about
              thrift, resale, sneakers, vintage, or any combo
            </div>
            <div className="callout">
              <span className="arrow">→</span> your audience already pays
              for flipping tools — Vendoo, LP, Whatnot, take your pick
            </div>
            <div className="callout">
              <span className="arrow">→</span> you&apos;ve seen what 20%
              lifetime caps look like. you deserve different math.
            </div>
            <div
              className="callout"
              style={{
                color: "rgba(255,255,255,0.55)",
                marginTop: "8px",
                fontStyle: "italic",
              }}
            >
              not for: dropshippers, mass-affiliate aggregators, anyone
              with bought followers. we check.
            </div>
          </section>

          <div className="divider"></div>

          {/* ═══ 3 · THE COMMISSION TABLE ═══ */}
          <section className="commissions wrap wrap--wide" ref={commissionsRef}>
            <div className="section-label">THE DEAL</div>

            <div className="comm-cards">
              {/* Monthly */}
              <div className="comm-card">
                <div className="plan-name">MONTHLY</div>
                <div className="plan-price">
                  $14.99 <small>/mo</small>
                </div>
                <div className="founding-badge">
                  ★ FOUNDING 20 · LIFETIME
                </div>
                <div className="rate-line">
                  <span className="rate-big">60%</span>
                  <span className="rate-txt">setup</span>
                  <span className="rate-payout">($9.00)</span>
                </div>
                <div className="rate-line">
                  <span className="rate-big">40%</span>
                  <span className="rate-txt">recurring</span>
                </div>
                <div className="std-row">
                  standard tiers:{" "}
                  <span>up to 50% / 30% (Gold)</span>
                </div>
              </div>

              {/* Annual */}
              <div className="comm-card">
                <div className="plan-name">ANNUAL</div>
                <div className="plan-price">
                  $99.99 <small>/yr</small>
                </div>
                <div className="founding-badge">
                  ★ FOUNDING 20 · LIFETIME
                </div>
                <div className="rate-line">
                  <span className="rate-big">40%</span>
                  <span className="rate-txt">setup</span>
                  <span className="rate-payout">($40.00)</span>
                </div>
                <div className="rate-line">
                  <span className="rate-big">30%</span>
                  <span className="rate-txt">renewal</span>
                </div>
                <div className="std-row">
                  standard tiers: <span>up to 40% / 25%</span>
                </div>
              </div>
            </div>

            <div className="comm-pills">
              <span className="comm-pill">365-DAY COOKIE</span>
              <span className="comm-pill">DIGISTORE24 PAYOUT</span>
              <span className="comm-pill">OR STRIPE + REWARDFUL</span>
            </div>

            <p className="comm-compare">
              beats List Perfectly (20% lifetime), Vendoo (15% / 6mo),
              PrimeLister (30%)
            </p>
          </section>

          <div className="divider"></div>

          {/* ═══ 3.5 · EARNINGS CALCULATOR ═══ */}
          <EarningsCalculator />

          <div className="divider"></div>

          {/* ═══ 4 · WHAT YOU GET ═══ */}
          <section className="perks wrap">
            <div className="section-label">WHAT YOU GET</div>

            <div className="perks-grid">
              <div className="perk">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74"
                    stroke="#5CE0B8"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    opacity="0.32"
                  />
                  <ellipse
                    cx="12"
                    cy="12"
                    rx="6.5"
                    ry="6"
                    stroke="#5CE0B8"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74"
                    stroke="#5CE0B8"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <h3>free Pro account for life</h3>
                <p>
                  full access to every Loot feature, no cap on scans,
                  forever
                </p>
              </div>

              <div className="perk">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5CE0B8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <h3>asset bundle</h3>
                <p>
                  banners, mockups, 3 ready-to-post TikTok scripts, IG
                  sticker pack
                </p>
              </div>

              <div className="perk">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5CE0B8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <h3>physical kit</h3>
                <p>
                  Saturn sticker pack, Flip enamel pin, custom thrifted
                  tag with your code
                </p>
              </div>

              <div className="perk">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5CE0B8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <h3>custom vanity code</h3>
                <p>
                  branded redirect (loot.works/yourname → DS24), ready to
                  drop in your bio
                </p>
              </div>
            </div>
          </section>

          {/* ═══ 5 · LEADERBOARD ═══ */}
          <section className="leaderboard wrap">
            <div className="lb-strip">
              <div className="lb-title">MONTHLY LEADERBOARD</div>
              <div className="lb-prizes">
                <CountUp value={500} prefix="$" duration={900} /> ·{" "}
                <CountUp value={300} prefix="$" duration={900} delay={100} /> ·{" "}
                <CountUp value={200} prefix="$" duration={900} delay={200} /> ·{" "}
                <CountUp value={100} prefix="$" duration={900} delay={300} /> ·{" "}
                <CountUp value={100} prefix="$" duration={900} delay={400} />
              </div>
              <div className="lb-bonus">
                first to <CountUp value={100} duration={900} /> paid signups →{" "}
                <strong>
                  <CountUp value={2500} prefix="$" duration={1200} delay={300} />{" "}
                  bonus + Flip merch drop + Coach Pick feature
                </strong>
              </div>
            </div>
          </section>

          <div className="divider"></div>

          {/* ═══ 6 · WHO'S IN ═══ */}
          <section className="social wrap">
            <div className="section-label">FOUNDING CREATORS</div>
            <div className="logo-strip">
              <div className="logo-ph"></div>
              <div className="logo-ph"></div>
              <div className="logo-ph"></div>
              <div className="logo-ph"></div>
              <div className="logo-ph"></div>
              <div className="logo-ph yours"></div>
            </div>
            <p className="your-spot">
              <span>→</span> your spot is here
            </p>
          </section>

          <div className="divider"></div>

          {/* ═══ 6.5 · FOUNDER VIDEO ═══ */}
          <section className="wrap" style={{ padding: "40px 20px" }}>
            <div className="founder-video">
              <div className="fv-eyebrow">FROM THE FOUNDER</div>
              <h2 className="fv-title">
                Why we built Loot — and why this affiliate program is
                different.
              </h2>
              <p className="fv-dek">60 seconds. No deck. No music. Just the thing.</p>
              <FounderVideo />
              <p className="fv-caption">
                david jones · founder · locust grove, ga
              </p>
            </div>
          </section>

          <div className="divider"></div>

          {/* ═══ 7 · HOW IT WORKS ═══ */}
          <section className="how wrap">
            <div className="section-label">HOW IT WORKS</div>
            <div className="steps">
              <div className="step">
                <div className="step-n">1</div>
                <div>
                  <h3>APPLY</h3>
                  <p>60-second form. we read it the same day.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-n">2</div>
                <div>
                  <h3>GET YOUR KIT</h3>
                  <p>
                    digital assets land same-day. physical kit ships in 5
                    days.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-n">3</div>
                <div>
                  <h3>POST ONCE, PAID FOREVER</h3>
                  <p>
                    your audience scans loot. you collect on every
                    recurring month, forever.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="divider"></div>

          {/* ═══ 8 · FAQ ═══ */}
          <section className="faq wrap">
            <div className="section-label">FAQ</div>

            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-item${isOpen ? " open" : ""}`}
                >
                  <button
                    className="faq-q"
                    type="button"
                    onClick={() => toggleFaq(idx)}
                  >
                    {item.q}
                    <svg
                      className="faq-chev"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7B8FFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <div className="divider"></div>

          {/* ═══ 9 · APPLICATION CTA ═══ */}
          <section className="apply" id="apply" ref={applyRef}>
            <div className="apply-hd">claim your spot</div>
            <div className="apply-sub">
              60 seconds. we reply same day, every day, no ghosting.
            </div>

            {!submitted && (
              <>
                <form
                  id="partner-form"
                  noValidate
                  onSubmit={handleSubmit}
                >
                  <div
                    className="form-row"
                    style={{ gridTemplateColumns: "1fr 1fr" }}
                  >
                    <div className="fg">
                      <label className="fl" htmlFor="f-name">
                        Name
                      </label>
                      <input
                        className="fi"
                        id="f-name"
                        type="text"
                        placeholder="your name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="fg">
                      <label className="fl" htmlFor="f-email">
                        Email
                      </label>
                      <input
                        className="fi"
                        id="f-email"
                        type="email"
                        placeholder="you@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    className="form-row"
                    style={{ gridTemplateColumns: "1fr 1fr" }}
                  >
                    <div className="fg">
                      <label className="fl" htmlFor="f-platform">
                        Primary platform
                      </label>
                      <select
                        className="fi"
                        id="f-platform"
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
                    <div className="fg">
                      <label className="fl" htmlFor="f-followers">
                        Follower count
                      </label>
                      <select
                        className="fi"
                        id="f-followers"
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

                  <div className="fg">
                    <label className="fl" htmlFor="f-handle">
                      Handle
                    </label>
                    <input
                      className="fi"
                      id="f-handle"
                      type="text"
                      placeholder="@yourhandle"
                      required
                      pattern="^@[a-zA-Z0-9_.]{1,29}$"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      aria-describedby="f-handle-help"
                    />
                    <span className="fhelp" id="f-handle-help">
                      the @username on your primary platform
                    </span>
                  </div>

                  <div className="fg">
                    <label className="fl" htmlFor="f-url">
                      Channel URL (optional)
                    </label>
                    <input
                      className="fi"
                      id="f-url"
                      type="url"
                      placeholder="https://tiktok.com/@yourhandle (skip if obvious from your @)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>

                  <div className="fg">
                    <label className="fl" htmlFor="f-why">
                      Anything we should know?
                    </label>
                    <span className="fhelp" style={{ marginTop: 0, marginBottom: 6 }}>
                      totally optional. one line about you, your audience, or a recent flip.
                    </span>
                    <textarea
                      className="fi"
                      id="f-why"
                      maxLength={FORM_MAX_WHY}
                      placeholder="skip this if you're in a hurry — we'll figure it out from your @"
                      value={why}
                      onChange={(e) => setWhy(e.target.value)}
                    />
                    <div className="char-ct">
                      <span id="char-num">{why.length}</span> /{" "}
                      {FORM_MAX_WHY}
                    </div>
                  </div>

                  <p className="trust-line">
                    // no contract · no quota · drop anytime
                  </p>
                  <button
                    type="submit"
                    className="cta cta--full"
                  >
                    CLAIM MY SPOT →
                  </button>
                </form>

                <p className="apply-note">
                  we reply within 24 hours, no ghosting
                </p>
              </>
            )}

            {submitted && (
              <div className="form-ok" id="form-ok">
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
                  decision same day (we promise). check your @ — we DM
                  from @loot.works.
                </p>
              </div>
            )}
          </section>

          {/* ═══ 10 · FOOTER ═══ */}
          <footer>
            <div className="ft-top">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74"
                  stroke="#5CE0B8"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.32"
                />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="6.5"
                  ry="6"
                  stroke="#5CE0B8"
                  strokeWidth="1.5"
                />
                <path
                  d="M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74"
                  stroke="#5CE0B8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="ft-wm">LOOT</span>
            </div>
            <div className="ft-links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/partners">Partners</a>
              <a href="/pro">Pro</a>
              <a href="mailto:support@loot.works">Contact</a>
            </div>
            <p className="ft-biz">
              © 2026 Loot · loot.works · built in Locust Grove, GA
            </p>
            <div id="digistore-trust-badge"></div>
          </footer>

          {/* Sticky reassurance pill — appears past commissions, fades by form. */}
          <div
            className={`sticky-pill ${
              showStickyPill && !pillDismissed ? "visible" : ""
            }`}
            role="status"
            aria-live="polite"
          >
            <span>// no contract · no quota · drop anytime</span>
            <button
              onClick={() => setPillDismissed(true)}
              aria-label="Dismiss this notice"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
