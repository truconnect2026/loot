"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * /kit — public Loot Brand & Partner Kit.
 *
 * Converted from marketing/06-landing-page/kit.html (Claude Design
 * export). Visual design is preserved 1:1; interactivity lifted into
 * React state: copy-to-clipboard, tab switching, accordions, scroll
 * reveal (IntersectionObserver), cursor-follow dot, smooth scroll.
 *
 * Asset hrefs that were "#" placeholders in the source stay as "#" —
 * wired up in a follow-up commit. Phone-mockup screen images live in
 * public/marketing-screens/ (mirroring marketing/03-screen-mockups/);
 * we deliberately keep their `src` paths as-authored in the export so
 * the asset-wiring pass is a single grep target.
 *
 * Public route — see middleware whitelist alongside /pro and /partners.
 */

const PAGE_STYLES = `
.kit-page *, .kit-page *::before, .kit-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

.kit-page {
  --bg: #0a0a0a;
  --mint: #5CE0B8;
  --camel: #D4A574;
  --peri: #7B8FFF;
  --red: #ff6b6b;
  --white: #ffffff;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --display: 'Outfit', sans-serif;
  --mono: 'JetBrains Mono', monospace;
  background: var(--bg);
  background-image: radial-gradient(ellipse at 50% 0%, #0a1612 0%, #000 70%);
  background-attachment: fixed;
  color: var(--white);
  font-family: var(--display);
  font-weight: 300;
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

html:has(.kit-page) { scroll-behavior: smooth; scroll-padding-top: 80px; }

/* Dot grid overlay */
.kit-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 0;
}

/* Cursor follow dot */
.kit-page #cursor-dot {
  position: fixed;
  width: 8px;
  height: 8px;
  background: var(--mint);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  z-index: 9999;
  transition: opacity 0.3s var(--ease);
  mix-blend-mode: screen;
  top: 0; left: 0;
}
.kit-page #cursor-dot.visible { opacity: 0.3; }

.kit-page .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

/* ═══ LAYOUT ═══ */
.kit-page .kit-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}
@media (min-width: 768px) { .kit-page .kit-wrap { padding: 0 48px; } }
@media (min-width: 1024px) { .kit-page .kit-wrap { padding: 0 64px; } }

.kit-page section { padding: 56px 0; }
@media (min-width: 768px) { .kit-page section { padding: 80px 0; } }
@media (min-width: 1024px) { .kit-page section { padding: 100px 0; } }

/* ═══ SECTION HEADERS ═══ */
.kit-page .sec-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--mint);
  margin-bottom: 40px;
}
.kit-page .sec-header h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: 24px;
  letter-spacing: -0.01em;
  color: var(--white);
}
@media (min-width: 768px) { .kit-page .sec-header h2 { font-size: 32px; } }
.kit-page .sec-header .sec-num {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 11px;
  color: var(--mint);
  letter-spacing: 0.12em;
  white-space: nowrap;
  opacity: 0.7;
}

/* ═══ SCROLL REVEAL ═══ */
.kit-page .reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
}
.kit-page .reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .kit-page .reveal { transform: none; }
}

/* ═══ NAV ═══ */
.kit-page .kit-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(10,10,10,0.82);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid var(--mint);
  z-index: 100;
}
@media (min-width: 768px) { .kit-page .kit-nav { padding: 0 48px; } }
@media (min-width: 1024px) { .kit-page .kit-nav { padding: 0 64px; } }

.kit-page .nav-left { display: flex; align-items: center; gap: 10px; }
.kit-page .nav-left .coinmark { width: 22px; height: 22px; color: var(--mint); }
.kit-page .nav-left .wordmark {
  font-family: var(--display);
  font-weight: 600;
  font-size: 14px;
  color: var(--white);
  letter-spacing: 0.08em;
}
.kit-page .nav-center {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 11px;
  color: var(--mint);
  letter-spacing: 0.24em;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.kit-page .nav-right a {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--mint);
  text-decoration: none;
  border: 1px solid var(--mint);
  padding: 6px 14px;
  transition: background 0.2s var(--ease), color 0.2s var(--ease);
}
.kit-page .nav-right a:hover { background: var(--mint); color: var(--bg); }
.kit-page .nav-right a:focus-visible { outline: 2px solid var(--mint); outline-offset: 2px; }

/* ═══ HERO ═══ */
.kit-page .hero { min-height: 50vh; display: flex; align-items: center; padding-top: 100px !important; }
@media (min-width: 768px) { .kit-page .hero { min-height: 40vh; padding-top: 120px !important; } }
.kit-page .hero-inner { display: flex; flex-direction: column; gap: 32px; width: 100%; }
@media (min-width: 1024px) {
  .kit-page .hero-inner { flex-direction: row; align-items: center; justify-content: space-between; }
}
.kit-page .hero-text { max-width: 680px; }
.kit-page .hero-eyebrow {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  color: var(--mint); letter-spacing: 0.28em; margin-bottom: 20px;
}
.kit-page .hero h1 {
  font-family: var(--display); font-weight: 600; font-size: 36px;
  line-height: 1.05; color: var(--white); margin-bottom: 16px;
}
@media (min-width: 768px) { .kit-page .hero h1 { font-size: 48px; } }
@media (min-width: 1024px) { .kit-page .hero h1 { font-size: 56px; } }
.kit-page .hero-sub {
  font-weight: 300; font-size: 18px; color: rgba(255,255,255,0.65);
  margin-bottom: 28px; max-width: 520px;
}
.kit-page .hero-chips { display: flex; gap: 12px; flex-wrap: wrap; }
.kit-page .chip {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.08em; padding: 8px 18px; border-radius: 100px;
  text-decoration: none; transition: background 0.2s var(--ease), color 0.2s var(--ease);
  display: inline-block;
}
.kit-page .chip--mint { color: var(--mint); border: 1px solid var(--mint); }
.kit-page .chip--mint:hover { background: rgba(92,224,184,0.12); }
.kit-page .chip--camel { color: var(--camel); border: 1px solid var(--camel); }
.kit-page .chip--camel:hover { background: rgba(212,165,116,0.12); }
.kit-page .hero-flip { display: flex; justify-content: center; flex-shrink: 0; }
.kit-page .hero-flip .flip-container { width: 120px; height: 120px; }
@media (min-width: 1024px) { .kit-page .hero-flip .flip-container { width: 200px; height: 200px; } }
.kit-page .flip-glow { filter: drop-shadow(0 0 40px rgba(92,224,184,0.08)); }

@keyframes kit-ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.kit-page .saturn-ring { animation: kit-ring-spin 4s linear infinite; transform-origin: center; }
@media (prefers-reduced-motion: reduce) { .kit-page .saturn-ring { animation: none; } }

/* ═══ DARK CARD ═══ */
.kit-page .dark-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 32px;
}
.kit-page .dark-card--mint { border-color: rgba(92,224,184,0.3); }

/* ═══ COPY BUTTON ═══ */
.kit-page .btn-copy {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.08em; color: var(--mint); background: transparent;
  border: 1px solid var(--mint); padding: 6px 14px; cursor: pointer;
  transition: all 0.2s var(--ease); line-height: 1; white-space: nowrap;
}
.kit-page .btn-copy:hover { background: rgba(92,224,184,0.08); }
.kit-page .btn-copy:focus-visible { outline: 2px solid var(--mint); outline-offset: 2px; }
.kit-page .btn-copy.copied { background: var(--mint); color: var(--bg); border-color: var(--mint); }

/* ═══ DOWNLOAD BUTTON ═══ */
.kit-page .btn-dl {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.08em; color: var(--bg); background: var(--mint);
  border: none; padding: 8px 16px; cursor: pointer; text-decoration: none;
  display: inline-block; transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
  line-height: 1;
}
.kit-page .btn-dl:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(92,224,184,0.08); }
.kit-page .btn-dl:focus-visible { outline: 2px solid var(--mint); outline-offset: 2px; }

/* ═══ ELEVATOR PITCH ═══ */
.kit-page .tab-row {
  display: flex; gap: 0; margin-bottom: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.kit-page .tab-btn {
  font-family: var(--mono); font-weight: 500; font-size: 11px;
  letter-spacing: 0.06em; color: rgba(255,255,255,0.45);
  background: none; border: none; padding: 12px 20px; cursor: pointer;
  position: relative; transition: color 0.24s var(--ease);
}
.kit-page .tab-btn::after {
  content: ''; position: absolute; bottom: -1px; left: 0;
  width: 0; height: 2px; background: var(--mint);
  transition: width 0.24s var(--ease);
}
.kit-page .tab-btn.active { color: var(--mint); }
.kit-page .tab-btn.active::after { width: 100%; }
.kit-page .tab-btn:focus-visible { outline: 2px solid var(--mint); outline-offset: 2px; }
.kit-page .tab-panel { display: none; }
.kit-page .tab-panel.active { display: block; }
.kit-page .tab-content { position: relative; }
.kit-page .tab-content .btn-copy { position: absolute; top: 0; right: 0; }
.kit-page .tab-text {
  font-family: var(--display); font-weight: 500; font-size: 18px;
  line-height: 1.5; color: var(--white); padding-right: 80px;
}
@media (min-width: 768px) { .kit-page .tab-text.lg { font-size: 22px; } }

/* ═══ LOGOS GRID ═══ */
.kit-page .logo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
@media (min-width: 768px) { .kit-page .logo-grid { grid-template-columns: repeat(3, 1fr); } }
.kit-page .logo-tile {
  aspect-ratio: 1; position: relative; display: flex;
  align-items: center; justify-content: center; overflow: hidden;
  border-radius: 16px; background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
  transition: border-color 0.2s var(--ease);
}
.kit-page .logo-tile:hover { border-color: rgba(92,224,184,0.3); }
.kit-page .logo-tile .tile-bg-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 16px 16px;
}
.kit-page .logo-tile--checker .tile-bg-grid {
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.07) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.07) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}
.kit-page .tile-subtitle {
  position: absolute; bottom: 24px; left: 12px;
  font-family: var(--mono); font-weight: 500; font-size: 8px;
  letter-spacing: 0.06em; color: rgba(255,255,255,0.3);
}
.kit-page .tile-label {
  position: absolute; bottom: 12px; left: 12px;
  font-family: var(--mono); font-weight: 500; font-size: 9px;
  letter-spacing: 0.1em; color: rgba(255,255,255,0.4);
}
.kit-page .tile-actions {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; gap: 0; opacity: 0; transform: translateY(4px);
  transition: opacity 0.2s var(--ease), transform 0.2s var(--ease);
}
.kit-page .logo-tile:hover .tile-actions { opacity: 1; transform: translateY(0); }
.kit-page .tile-actions a {
  flex: 1; text-align: center; padding: 10px;
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  letter-spacing: 0.08em; color: var(--bg); background: var(--mint);
  text-decoration: none; transition: background 0.15s var(--ease);
}
.kit-page .tile-actions a:first-child { border-bottom-left-radius: 15px; }
.kit-page .tile-actions a:last-child { border-bottom-right-radius: 15px; }
.kit-page .tile-actions a:hover { background: #4dc9a3; }
.kit-page .logo-tile .tile-asset { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; }
.kit-page .logo-tile .tile-asset svg { width: 72px; height: 72px; }
@media (min-width: 768px) { .kit-page .logo-tile .tile-asset svg { width: 96px; height: 96px; } }

/* ═══ FLIP MASCOT ═══ */
.kit-page .flip-section { display: flex; flex-direction: column; gap: 32px; }
@media (min-width: 768px) { .kit-page .flip-section { flex-direction: row; align-items: flex-start; gap: 48px; } }
.kit-page .flip-section .flip-visual { display: flex; justify-content: center; flex-shrink: 0; width: 160px; height: 160px; }
@media (min-width: 768px) { .kit-page .flip-section .flip-visual { width: 240px; height: 240px; } }
.kit-page .flip-info { flex: 1; }
.kit-page .flip-eyebrow {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.24em; color: var(--mint); margin-bottom: 8px;
}
.kit-page .flip-info h3 { font-family: var(--display); font-weight: 600; font-size: 32px; margin-bottom: 12px; }
.kit-page .flip-info p { font-weight: 300; font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 28px; line-height: 1.6; }
.kit-page .moods-row { display: flex; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
.kit-page .mood-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.kit-page .mood-item img { width: 64px; height: 64px; }
@media (min-width: 768px) { .kit-page .mood-item img { width: 80px; height: 80px; } }
.kit-page .mood-label { font-family: var(--mono); font-weight: 500; font-size: 10px; color: var(--mint); letter-spacing: 0.08em; }
.kit-page .flip-downloads { display: flex; gap: 12px; flex-wrap: wrap; }

/* ═══ COLORS ═══ */
.kit-page .swatch-row { display: flex; gap: 0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
.kit-page .swatch {
  flex: 1; height: 120px; position: relative; cursor: pointer;
  transition: transform 0.2s var(--ease); display: flex;
  align-items: flex-end; padding: 12px;
}
@media (min-width: 768px) { .kit-page .swatch { height: 200px; padding: 16px; } }
.kit-page .swatch-info { display: flex; flex-direction: column; gap: 2px; width: 100%; }
.kit-page .swatch-role { font-family: var(--mono); font-weight: 500; font-size: 8px; letter-spacing: 0.24em; opacity: 0.8; }
@media (min-width: 768px) { .kit-page .swatch-role { font-size: 10px; } }
.kit-page .swatch-hex {
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  display: flex; align-items: center; justify-content: space-between;
}
@media (min-width: 768px) { .kit-page .swatch-hex { font-size: 14px; } }
.kit-page .swatch-copy {
  font-family: var(--mono); font-size: 8px; font-weight: 500;
  letter-spacing: 0.08em; background: none; border: 1px solid currentColor;
  color: inherit; padding: 3px 6px; cursor: pointer;
  opacity: 0; transition: opacity 0.2s var(--ease);
}
.kit-page .swatch:hover .swatch-copy { opacity: 1; }
.kit-page .swatch-copy.copied { opacity: 1; background: currentColor; color: var(--bg); }
.kit-page .color-note {
  font-family: var(--display); font-weight: 300; font-style: italic;
  font-size: 14px; color: rgba(255,255,255,0.55); text-align: center;
}

/* ═══ TYPOGRAPHY ═══ */
.kit-page .type-cards { display: flex; flex-direction: column; gap: 24px; }
.kit-page .type-eyebrow {
  font-family: var(--mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.24em; color: var(--mint); margin-bottom: 12px;
}
.kit-page .type-specimen {
  font-family: var(--display); font-weight: 600; font-size: 40px;
  line-height: 1.05; margin-bottom: 20px;
}
@media (min-width: 768px) { .kit-page .type-specimen { font-size: 64px; } }
.kit-page .type-specimen--mono { font-family: var(--mono); font-weight: 700; font-size: 32px; }
@media (min-width: 768px) { .kit-page .type-specimen--mono { font-size: 48px; } }
.kit-page .weight-ladder { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 14px; }
@media (min-width: 768px) { .kit-page .weight-ladder { font-size: 18px; gap: 12px; } }
.kit-page .weight-ladder span { font-family: var(--display); }
.kit-page .weight-ladder .dot { width: 4px; height: 4px; background: var(--mint); border-radius: 50%; flex-shrink: 0; }
.kit-page .type-footer { font-weight: 300; font-size: 14px; color: rgba(255,255,255,0.55); margin-top: 16px; }
.kit-page .type-footer a { color: var(--mint); text-decoration: none; transition: opacity 0.2s var(--ease); }
.kit-page .type-footer a:hover { opacity: 0.7; }

/* ═══ SCREENSHOTS ═══ */
.kit-page .shots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
@media (min-width: 768px) { .kit-page .shots-grid { grid-template-columns: repeat(3, 1fr); } }
.kit-page .shot-tile {
  position: relative; border-radius: 16px; overflow: hidden;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
  padding: 24px 16px; display: flex; flex-direction: column;
  align-items: center; gap: 16px; transition: border-color 0.2s var(--ease);
}
.kit-page .shot-tile:hover { border-color: rgba(92,224,184,0.3); }
.kit-page .phone-frame {
  width: 100%; max-width: 140px; aspect-ratio: 9 / 19.5;
  border-radius: 24px; border: 2px solid rgba(255,255,255,0.08);
  overflow: hidden; display: flex; align-items: center;
  justify-content: center; position: relative;
}
.kit-page .phone-screen {
  position: absolute; inset: 4px; border-radius: 20px;
  background: linear-gradient(160deg, rgba(92,224,184,0.15) 0%, rgba(92,224,184,0.03) 100%);
}
.kit-page .phone-screen-img {
  position: absolute; inset: 4px;
  width: calc(100% - 8px); height: calc(100% - 8px);
  border-radius: 20px; object-fit: cover; object-position: top center;
}
.kit-page .shot-label { font-family: var(--mono); font-weight: 500; font-size: 10px; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); }
.kit-page .shot-dl { opacity: 0; transition: opacity 0.2s var(--ease); }
.kit-page .shot-tile:hover .shot-dl { opacity: 1; }

/* ═══ POST KIT ═══ */
.kit-page .accordion { display: flex; flex-direction: column; gap: 16px; }
.kit-page .acc-item {
  border-radius: 16px; overflow: hidden;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(92,224,184,0.3);
}
.kit-page .acc-trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; background: none; border: none; color: var(--white);
  font-family: var(--display); font-weight: 600; font-size: 18px;
  cursor: pointer; transition: color 0.2s var(--ease); text-align: left;
}
.kit-page .acc-trigger:hover { color: var(--mint); }
.kit-page .acc-trigger:focus-visible { outline: 2px solid var(--mint); outline-offset: -2px; }
.kit-page .acc-arrow {
  font-size: 18px; color: var(--mint);
  transition: transform 0.32s var(--ease); flex-shrink: 0;
}
.kit-page .acc-item.open .acc-arrow { transform: rotate(180deg); }
.kit-page .acc-body {
  max-height: 0; overflow: hidden;
  transition: max-height 0.32s var(--ease);
}
.kit-page .acc-item.open .acc-body { max-height: 3000px; }
.kit-page .acc-body-inner { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 16px; }
.kit-page .script-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 20px;
}
.kit-page .script-card h4 {
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  color: var(--mint); letter-spacing: 0.08em; margin-bottom: 12px;
}
.kit-page .code-block {
  position: relative;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; padding: 16px; padding-right: 72px;
  font-family: var(--mono); font-weight: 500; font-size: 12px;
  line-height: 1.7; color: rgba(255,255,255,0.75);
  white-space: pre-wrap; word-break: break-word;
}
.kit-page .code-block .btn-copy { position: absolute; top: 8px; right: 8px; }
.kit-page .caption-block {
  font-family: var(--display); font-weight: 300; font-size: 14px;
  color: rgba(255,255,255,0.6); padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.kit-page .caption-block strong { font-weight: 600; color: rgba(255,255,255,0.8); }
.kit-page .acc-sub { font-weight: 300; font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 4px; }

/* ═══ AFFILIATE ═══ */
.kit-page .aff-table { display: flex; flex-direction: column; font-family: var(--mono); }
.kit-page .aff-row {
  display: flex; flex-direction: column; gap: 4px;
  padding: 20px 0; border-bottom: 1px solid rgba(92,224,184,0.15);
}
@media (min-width: 768px) {
  .kit-page .aff-row { flex-direction: row; align-items: center; justify-content: space-between; }
}
.kit-page .aff-row:last-child { border-bottom: none; }
.kit-page .aff-label {
  font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,0.55); letter-spacing: 0.06em; flex-shrink: 0;
}
.kit-page .aff-label--camel { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--camel); }
.kit-page .aff-value { font-size: 13px; font-weight: 500; color: var(--white); }
.kit-page .aff-badge {
  font-size: 12px; font-weight: 700; color: var(--mint);
  display: flex; align-items: center; gap: 8px; white-space: nowrap;
}
.kit-page .pulse-dot {
  width: 6px; height: 6px; background: var(--mint);
  border-radius: 50%; animation: kit-pulse 2s var(--ease) infinite;
}
@keyframes kit-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(92,224,184,0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(92,224,184,0); }
}
.kit-page .cta-apply {
  display: inline-block; font-family: var(--mono); font-weight: 700;
  font-size: 14px; letter-spacing: 0.06em; color: var(--bg);
  background: var(--mint); padding: 16px 32px; border-radius: 100px;
  text-decoration: none; text-align: center; margin-top: 32px;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
@media (max-width: 767px) { .kit-page .cta-apply { display: block; } }
.kit-page .cta-apply:hover { transform: scale(1.02); box-shadow: 0 0 30px rgba(92,224,184,0.12); }

/* ═══ PRESS ═══ */
.kit-page .press-table { display: flex; flex-direction: column; font-family: var(--mono); font-size: 13px; }
.kit-page .press-row {
  display: flex; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.kit-page .press-key { font-weight: 500; color: rgba(255,255,255,0.45); letter-spacing: 0.06em; }
.kit-page .press-val { font-weight: 500; color: var(--white); text-align: right; }
.kit-page .press-val a { color: var(--mint); text-decoration: none; }
.kit-page .press-val a:hover { text-decoration: underline; }

/* ═══ DO / DON'T ═══ */
.kit-page .rules-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 768px) { .kit-page .rules-grid { grid-template-columns: 1fr 1fr; } }
.kit-page .rule-item {
  padding: 16px 20px; background: rgba(255,255,255,0.02);
  border-radius: 8px; font-weight: 500; font-size: 15px;
  display: flex; align-items: center; gap: 12px;
}
.kit-page .rule-item--do { border-left: 2px solid var(--mint); }
.kit-page .rule-item--dont { border-left: 2px solid var(--camel); }
.kit-page .rule-icon { font-family: var(--mono); font-weight: 700; font-size: 14px; flex-shrink: 0; }
.kit-page .rule-icon--do { color: var(--mint); }
.kit-page .rule-icon--dont { color: var(--camel); }

/* ═══ FOOTER ═══ */
.kit-page .kit-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 64px 0 40px; }
.kit-page .footer-top { display: grid; grid-template-columns: 1fr; gap: 40px; margin-bottom: 48px; }
@media (min-width: 768px) { .kit-page .footer-top { grid-template-columns: 1.5fr 1fr 1fr 1fr; } }
.kit-page .footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.kit-page .footer-brand .coinmark { width: 20px; height: 20px; color: var(--mint); }
.kit-page .footer-brand .wordmark { font-family: var(--display); font-weight: 600; font-size: 14px; letter-spacing: 0.08em; }
.kit-page .footer-col h4 {
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.16em; color: rgba(255,255,255,0.4); margin-bottom: 16px;
}
.kit-page .footer-col a {
  display: block; font-family: var(--display); font-weight: 300; font-size: 14px;
  color: rgba(255,255,255,0.6); text-decoration: none; padding: 4px 0;
  transition: color 0.2s var(--ease);
}
.kit-page .footer-col a:hover { color: var(--mint); }
.kit-page .footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.kit-page .footer-biz { font-family: var(--display); font-weight: 300; font-size: 13px; color: rgba(255,255,255,0.35); }
.kit-page .footer-tagline { font-family: var(--mono); font-weight: 500; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.04em; }
.kit-page .footer-copy { font-size: 12px; color: rgba(255,255,255,0.3); }
.kit-page .sec-sub { font-weight: 300; font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 32px; }
`;

type TabKey = "1s" | "tw" | "para";

const PITCH_1S =
  "Loot is a thrift-store sidekick: scan any item, see what it's worth, flip or skip in 2 seconds.";
const PITCH_TW =
  "🪐 loot.works — scan any thrift find, get the comp, ROI, and a verdict in 2 seconds. AI vision + barcode + flip coach. $14.99/mo. Built by flippers, for flippers.";
const PITCH_PARA =
  "Loot turns every thrift store, yard sale, and estate sale into a sourcing engine. Point your phone at any item — barcode, tag, or no tag — and Loot tells you the live resale comps, your ROI, the right platform to list on, and whether to flip or skip. Built on Claude AI vision, designed for serious resellers, priced for everyone. No app store. No download. Just loot.works.";

const SCRIPT_1 = `HOOK (0-2s): "I paid $X at Goodwill. Watch what it sold for."
BUILD (2-8s): [show item rotating on table, text overlay: "almost passed on this"]
PROOF (8-18s): [show eBay sold listings screenshot]
REVEAL (18-25s): [big number animation $X → $Y]
CTA (25-30s): "Scanner that called this is at loot.works"`;

const SCRIPT_2 = `HOOK (0-2s): "🚨 If you see this at the thrift store, RUN to checkout."
BUILD (2-8s): [show item on shelf, text overlay: "this brand sells for 10×"]
PROOF (8-18s): [show Loot scan with ROI + sold comps]
REVEAL (18-25s): [show profit number, text: "from a $3 thrift find"]
CTA (25-30s): "Loot told me to grab it. loot.works 🪐"`;

const SCRIPT_3 = `HOOK (0-2s): "One of these is real. One is a $300 mistake."
BUILD (2-8s): [two items side by side, zoom on stitching/labels]
PROOF (8-15s): [Loot scan comparison, highlight authentication signals]
REVEAL (15-25s): [dramatic reveal — which is real, show resale value]
CTA (25-30s): "Loot caught it in 2 seconds. loot.works"`;

const IG_REEL =
  "Loot called this flip in 2 seconds. The bin scan is undefeated. → loot.works 🪐 #thriftflip #resellercommunity #vintagefinds";

const IG_STORY =
  "i let an AI pick my flips for a week. results inside 👀";

const EMAIL_SUBJ = `1. "The $15/mo tool serious resellers won't shut up about"
2. "We built an AI that scans thrift finds in 2 seconds"
3. "Stop guessing. Start scanning. Meet Loot."`;

const EMAIL_BODY = `Hey [FIRST NAME],

Every thrift run is a gamble. You pick up an item, Google it for five minutes, check three different apps, and still aren't sure if it's worth the $4.

That's the problem Loot solves.

Point your phone at anything — barcode, label, or blank tag — and Loot returns live resale comps, your projected ROI, the best platform to list on, and a flip-or-skip verdict. All in about two seconds.

It's built on Claude AI vision, designed for full-time resellers and weekend pickers alike. No app download required — it runs at loot.works on any phone.

What makes it different:
• Works on items with NO barcode (AI vision handles it)
• Shows actual sold comps, not asking prices
• Gives you a clear verdict: flip it or skip it
• Includes a deal feed, yard sale map, and flip-or-skip game

$14.99/month or $99.99/year. No contracts, cancel anytime.

If you cover reselling, thrifting, or side hustles — your audience will thank you for this one.

→ TRY LOOT FREE AT LOOT.WORKS`;

const SHOTS = [
  { src: "/brand-kit/shots/scan.png", alt: "Scan screen", label: "SCAN" },
  { src: "/brand-kit/shots/verdict-flip.png", alt: "Verdict — Flip screen", label: "VERDICT — FLIP" },
  { src: "/brand-kit/shots/verdict-skip.png", alt: "Verdict — Skip screen", label: "VERDICT — SKIP" },
  { src: "/brand-kit/shots/deal-feed.png", alt: "Deal Feed screen", label: "DEAL FEED" },
  { src: "/brand-kit/shots/map.png", alt: "Yard Sale Map screen", label: "YARD SALE MAP" },
  { src: "/brand-kit/shots/flip-or-skip-game.png", alt: "Flip or Skip Game screen", label: "FLIP OR SKIP GAME" },
];

const SWATCHES: Array<{ hex: string; role: string; bg: string; text: string }> = [
  { hex: "#0A0A0A", role: "PAGE", bg: "#0A0A0A", text: "#fff" },
  { hex: "#5CE0B8", role: "ACCENT", bg: "#5CE0B8", text: "#0a0a0a" },
  { hex: "#D4A574", role: "WARM", bg: "#D4A574", text: "#0a0a0a" },
  { hex: "#7B8FFF", role: "COOL", bg: "#7B8FFF", text: "#0a0a0a" },
  { hex: "#FF6B6B", role: "SKIP", bg: "#FF6B6B", text: "#0a0a0a" },
];

const DOS = [
  "Use logos in videos, posts, articles",
  "Use the Flip mascot in commentary content",
  "Quote anything on this page verbatim",
  "Link to loot.works without asking",
  "Make jokes about Saturn",
  "Repost our content with credit",
];

const DONTS = [
  "Recolor the logos",
  "Stretch or distort the wordmark",
  "Use Flip in adult, violent, or hateful content",
  "Claim Loot endorses you (unless you're a signed affiliate)",
  "Crop the CoinMark out of the wordmark",
  "Reupload as your own",
];

export default function KitPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("1s");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openAccs, setOpenAccs] = useState<Set<string>>(
    () => new Set(["tiktok"])
  );
  const ariaLiveRef = useRef<HTMLDivElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* best-effort */
      }
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    if (ariaLiveRef.current) ariaLiveRef.current.textContent = "Copied to clipboard";
    window.setTimeout(() => {
      setCopiedKey((k) => (k === key ? null : k));
      if (ariaLiveRef.current) ariaLiveRef.current.textContent = "";
    }, 1600);
  }, []);

  const toggleAcc = useCallback((id: string) => {
    setOpenAccs((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Scroll-reveal via IntersectionObserver */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".kit-page .reveal").forEach((el) =>
        el.classList.add("visible")
      );
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document
      .querySelectorAll(".kit-page .reveal")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Cursor-follow dot (desktop, non-touch, non-reduced-motion only) */
  useEffect(() => {
    const dot = cursorDotRef.current;
    if (!dot) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    if (reduced || isTouch) return;

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let visible = false;
    let raf = 0;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        dot!.classList.add("visible");
      }
    }
    function onLeave() {
      visible = false;
      dot!.classList.remove("visible");
    }
    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInteractive =
        tag === "A" ||
        tag === "BUTTON" ||
        tag === "INPUT" ||
        target.closest(
          "a, button, input, .swatch, .tab-btn, .acc-trigger, .logo-tile"
        );
      if (isInteractive) dot!.classList.remove("visible");
      else if (visible) dot!.classList.add("visible");
    }
    function tick() {
      dotX += (mouseX - dotX) * 0.12;
      dotY += (mouseY - dotY) * 0.12;
      dot!.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
      raf = requestAnimationFrame(tick);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  function handleAnchorScroll(e: React.MouseEvent<HTMLAnchorElement>) {
    const href = e.currentTarget.getAttribute("href");
    if (!href || !href.startsWith("#sec-")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const copyLabel = (key: string) =>
    copiedKey === key ? "COPIED ✓" : "COPY";
  const copyClass = (key: string) =>
    `btn-copy${copiedKey === key ? " copied" : ""}`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@300;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div className="kit-page">
        <div id="cursor-dot" ref={cursorDotRef}></div>
        <div
          id="aria-live"
          className="sr-only"
          aria-live="polite"
          ref={ariaLiveRef}
        ></div>

        {/* ═══ SVG SYMBOLS ═══ */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "none" }}
          aria-hidden
        >
          <symbol id="sym-coinmark" viewBox="0 0 32 32" fill="none">
            <circle
              cx="16"
              cy="16"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="16"
              r="4"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <ellipse
              cx="16"
              cy="16"
              rx="15"
              ry="4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              transform="rotate(-30 16 16)"
            />
          </symbol>
          <symbol id="sym-saturn" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.12" />
            <circle
              cx="16"
              cy="16"
              r="6"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <ellipse
              cx="16"
              cy="16"
              rx="14"
              ry="3.5"
              stroke="currentColor"
              strokeWidth="0.8"
              transform="rotate(-20 16 16)"
              fill="none"
            />
          </symbol>
        </svg>

        {/* ═══ NAV ═══ */}
        <nav className="kit-nav" role="navigation" aria-label="Kit navigation">
          <div className="nav-left">
            <svg className="coinmark" width="22" height="22">
              <use href="#sym-coinmark" />
            </svg>
            <span className="wordmark">LOOT</span>
          </div>
          <span className="nav-center">/ KIT</span>
          <div className="nav-right">
            <a href="#">BACK TO LOOT.WORKS →</a>
          </div>
        </nav>

        {/* ═══ 01 / 13 — HERO ═══ */}
        <section className="hero" id="sec-hero">
          <div className="kit-wrap">
            <div className="hero-inner">
              <div className="hero-text reveal">
                <p className="hero-eyebrow">BRAND &amp; PARTNER KIT</p>
                <h1>Everything you need to post about Loot.</h1>
                <p className="hero-sub">
                  Logos, copy, screenshots, scripts. Free to use. Just
                  don&apos;t make us look bad.
                </p>
                <div className="hero-chips">
                  <a
                    href="#sec-affiliate"
                    className="chip chip--mint"
                    onClick={handleAnchorScroll}
                  >
                    FOR AFFILIATES
                  </a>
                  <a
                    href="#sec-press"
                    className="chip chip--camel"
                    onClick={handleAnchorScroll}
                  >
                    FOR PRESS
                  </a>
                </div>
              </div>
              <div className="hero-flip reveal">
                <div
                  className="flip-container flip-glow"
                  style={{ position: "relative" }}
                >
                  <img
                    src="/brand-kit/flip/flip-smirk.png"
                    alt="Flip mascot — smirk mood"
                    width={200}
                    height={200}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  <svg
                    viewBox="0 0 200 200"
                    fill="none"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  >
                    <g
                      className="saturn-ring"
                      style={{ transformOrigin: "100px 100px" }}
                    >
                      <ellipse
                        cx="100"
                        cy="100"
                        rx="96"
                        ry="22"
                        fill="none"
                        stroke="#5CE0B8"
                        strokeWidth="2"
                        opacity="0.45"
                        transform="rotate(-23 100 100)"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 02 / 13 — ELEVATOR PITCH ═══ */}
        <section id="sec-pitch">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>The Pitch</h2>
              <span className="sec-num">01 / 13</span>
            </div>
            <div className="tab-container">
              <div className="tab-row" role="tablist">
                <button
                  className={`tab-btn${activeTab === "1s" ? " active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === "1s"}
                  onClick={() => setActiveTab("1s")}
                >
                  1 SENTENCE
                </button>
                <button
                  className={`tab-btn${activeTab === "tw" ? " active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === "tw"}
                  onClick={() => setActiveTab("tw")}
                >
                  TWITTER
                </button>
                <button
                  className={`tab-btn${activeTab === "para" ? " active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === "para"}
                  onClick={() => setActiveTab("para")}
                >
                  PARAGRAPH
                </button>
              </div>
              <div className="dark-card dark-card--mint">
                <div
                  className={`tab-panel${
                    activeTab === "1s" ? " active" : ""
                  }`}
                >
                  <div className="tab-content">
                    <button
                      className={copyClass("pitch-1s")}
                      onClick={() => copy("pitch-1s", PITCH_1S)}
                    >
                      {copyLabel("pitch-1s")}
                    </button>
                    <p className="tab-text lg">{PITCH_1S}</p>
                  </div>
                </div>
                <div
                  className={`tab-panel${
                    activeTab === "tw" ? " active" : ""
                  }`}
                >
                  <div className="tab-content">
                    <button
                      className={copyClass("pitch-tw")}
                      onClick={() => copy("pitch-tw", PITCH_TW)}
                    >
                      {copyLabel("pitch-tw")}
                    </button>
                    <p className="tab-text">{PITCH_TW}</p>
                  </div>
                </div>
                <div
                  className={`tab-panel${
                    activeTab === "para" ? " active" : ""
                  }`}
                >
                  <div className="tab-content">
                    <button
                      className={copyClass("pitch-para")}
                      onClick={() => copy("pitch-para", PITCH_PARA)}
                    >
                      {copyLabel("pitch-para")}
                    </button>
                    <p className="tab-text">{PITCH_PARA}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 03 / 13 — LOGOS ═══ */}
        <section id="sec-logos">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Logos</h2>
              <span className="sec-num">02 / 13</span>
            </div>
            <p className="sec-sub">
              All assets are SVG + PNG @ 2x. Click any tile to preview,
              hover to reveal downloads.
            </p>
            <div className="logo-grid">
              <div className="logo-tile">
                <div className="tile-bg-grid"></div>
                <div className="tile-asset">
                  <span
                    style={{
                      fontFamily: "var(--display)",
                      fontWeight: 700,
                      fontSize: "38px",
                      letterSpacing: "0.1em",
                      color: "#5CE0B8",
                    }}
                  >
                    LOOT
                  </span>
                </div>
                <span className="tile-label">WORDMARK — MINT ON BLACK</span>
                <div className="tile-actions">
                  <a href="#">SVG</a>
                  <a href="#">PNG</a>
                </div>
              </div>
              <div className="logo-tile" style={{ background: "#5CE0B8" }}>
                <div className="tile-bg-grid" style={{ opacity: 0.3 }}></div>
                <div className="tile-asset">
                  <span
                    style={{
                      fontFamily: "var(--display)",
                      fontWeight: 700,
                      fontSize: "38px",
                      letterSpacing: "0.1em",
                      color: "#0a0a0a",
                    }}
                  >
                    LOOT
                  </span>
                </div>
                <span
                  className="tile-label"
                  style={{ color: "rgba(0,0,0,0.4)" }}
                >
                  WORDMARK — BLACK ON MINT
                </span>
                <div className="tile-actions">
                  <a href="#">SVG</a>
                  <a href="#">PNG</a>
                </div>
              </div>
              <div className="logo-tile logo-tile--checker">
                <div className="tile-bg-grid"></div>
                <div className="tile-asset">
                  <span
                    style={{
                      fontFamily: "var(--display)",
                      fontWeight: 700,
                      fontSize: "38px",
                      letterSpacing: "0.1em",
                      color: "#fff",
                    }}
                  >
                    LOOT
                  </span>
                </div>
                <span className="tile-label">
                  WORDMARK — WHITE ON TRANSPARENT
                </span>
                <div className="tile-actions">
                  <a href="#">SVG</a>
                  <a href="#">PNG</a>
                </div>
              </div>
              <div className="logo-tile">
                <div className="tile-bg-grid"></div>
                <div className="tile-asset">
                  <svg style={{ color: "#5CE0B8" }}>
                    <use href="#sym-coinmark" />
                  </svg>
                </div>
                <span className="tile-label">COINMARK — PRIMARY ICON</span>
                <span className="tile-subtitle">
                  App icon, social, favicons
                </span>
                <div className="tile-actions">
                  <a href="#">SVG</a>
                  <a href="#">PNG</a>
                </div>
              </div>
              <div className="logo-tile">
                <div className="tile-bg-grid"></div>
                <div className="tile-asset">
                  <svg style={{ color: "#fff" }}>
                    <use href="#sym-coinmark" />
                  </svg>
                </div>
                <span className="tile-label">COINMARK — INVERSE</span>
                <span className="tile-subtitle">
                  Light backgrounds, print
                </span>
                <div className="tile-actions">
                  <a href="#">SVG</a>
                  <a href="#">PNG</a>
                </div>
              </div>
              <div className="logo-tile">
                <div className="tile-bg-grid"></div>
                <div className="tile-asset">
                  <svg style={{ color: "#5CE0B8" }}>
                    <use href="#sym-saturn" />
                  </svg>
                </div>
                <span className="tile-label">SATURN GLYPH — INLINE USE</span>
                <span className="tile-subtitle">
                  Body text, captions, UI chrome
                </span>
                <div className="tile-actions">
                  <a href="#">SVG</a>
                  <a href="#">PNG</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 04 / 13 — FLIP MASCOT ═══ */}
        <section id="sec-flip">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Meet Flip</h2>
              <span className="sec-num">03 / 13</span>
            </div>
            <div
              className="dark-card dark-card--mint"
              style={{ padding: "48px 32px" }}
            >
              <div className="flip-section">
                <div
                  className="flip-visual flip-glow"
                  style={{ position: "relative" }}
                >
                  <img
                    src="/brand-kit/flip/flip-smirk.png"
                    alt="Flip mascot — smirk mood"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                  <svg
                    viewBox="0 0 240 240"
                    fill="none"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  >
                    <g
                      className="saturn-ring"
                      style={{ transformOrigin: "120px 120px" }}
                    >
                      <ellipse
                        cx="120"
                        cy="120"
                        rx="114"
                        ry="26"
                        fill="none"
                        stroke="#5CE0B8"
                        strokeWidth="2.5"
                        opacity="0.45"
                        transform="rotate(-23 120 120)"
                      />
                    </g>
                  </svg>
                </div>
                <div className="flip-info">
                  <p className="flip-eyebrow">THE COACH</p>
                  <h3>Flip</h3>
                  <p>
                    Loot&apos;s in-app AI coach. Saturn-themed. Street-smart.
                    Disciplined, not patient. He calls your shots in 4 moods
                    — smirk, hyped, side-eye, dead — depending on how badly
                    you cooked.
                  </p>
                  <div className="moods-row">
                    <div className="mood-item">
                      <img
                        src="/brand-kit/flip/flip-smirk.png"
                        alt="Flip — smirk mood"
                        width={80}
                        height={80}
                        style={{ borderRadius: 8, objectFit: "contain" }}
                      />
                      <span className="mood-label">SMIRK</span>
                    </div>
                    <div className="mood-item">
                      <img
                        src="/brand-kit/flip/flip-hyped.png"
                        alt="Flip — hyped mood"
                        width={80}
                        height={80}
                        style={{ borderRadius: 8, objectFit: "contain" }}
                      />
                      <span className="mood-label">HYPED</span>
                    </div>
                    <div className="mood-item">
                      <img
                        src="/brand-kit/flip/flip-sideeye.png"
                        alt="Flip — side-eye mood"
                        width={80}
                        height={80}
                        style={{ borderRadius: 8, objectFit: "contain" }}
                      />
                      <span className="mood-label">SIDE-EYE</span>
                    </div>
                    <div className="mood-item">
                      <img
                        src="/brand-kit/flip/flip-dead.png"
                        alt="Flip — dead mood"
                        width={80}
                        height={80}
                        style={{ borderRadius: 8, objectFit: "contain" }}
                      />
                      <span className="mood-label">DEAD</span>
                    </div>
                  </div>
                  <div className="flip-downloads">
                    <a href="#" className="btn-dl">
                      SPRITE SHEET (PNG)
                    </a>
                    <a href="#" className="btn-dl">
                      MOODS (ZIP)
                    </a>
                    <a href="#" className="btn-dl">
                      ANIMATED RING (SVG)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 05 / 13 — COLORS ═══ */}
        <section id="sec-colors">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Color System</h2>
              <span className="sec-num">04 / 13</span>
            </div>
            <div className="swatch-row">
              {SWATCHES.map((s) => {
                const key = `swatch-${s.hex}`;
                return (
                  <div
                    key={s.hex}
                    className="swatch"
                    style={{ background: s.bg, color: s.text }}
                    onClick={() => copy(key, s.hex)}
                  >
                    <div className="swatch-info">
                      <span className="swatch-role">{s.role}</span>
                      <span className="swatch-hex">
                        {s.hex}{" "}
                        <button
                          className={`swatch-copy${
                            copiedKey === key ? " copied" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(key, s.hex);
                          }}
                        >
                          {copiedKey === key ? "COPIED" : "COPY"}
                        </button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="color-note">
              Mint is the only accent that earns its place. Use sparingly.
            </p>
          </div>
        </section>

        {/* ═══ 06 / 13 — TYPOGRAPHY ═══ */}
        <section id="sec-type">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Type</h2>
              <span className="sec-num">05 / 13</span>
            </div>
            <div className="type-cards">
              <div className="dark-card">
                <p className="type-eyebrow">DISPLAY + BODY</p>
                <p className="type-specimen">scan. price. flip.</p>
                <div className="weight-ladder">
                  <span style={{ fontWeight: 300 }}>300 LIGHT</span>
                  <span className="dot"></span>
                  <span style={{ fontWeight: 500 }}>500 MEDIUM</span>
                  <span className="dot"></span>
                  <span style={{ fontWeight: 600 }}>600 SEMIBOLD</span>
                  <span className="dot"></span>
                  <span style={{ fontWeight: 700 }}>700 BOLD</span>
                </div>
              </div>
              <div className="dark-card">
                <p className="type-eyebrow">NUMBERS + UI</p>
                <p className="type-specimen type-specimen--mono">
                  $4 → $85 · 21× ROI
                </p>
                <div
                  className="weight-ladder"
                  style={{ fontFamily: "var(--mono)" }}
                >
                  <span style={{ fontWeight: 500 }}>500 MEDIUM</span>
                  <span className="dot"></span>
                  <span style={{ fontWeight: 700 }}>700 BOLD</span>
                </div>
              </div>
            </div>
            <p className="type-footer">
              Both fonts are Google Fonts. Free for any use.{" "}
              <a
                href="https://fonts.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                → fonts.google.com
              </a>
            </p>
          </div>
        </section>

        {/* ═══ 07 / 13 — SCREENSHOTS ═══ */}
        <section id="sec-shots">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Screenshots</h2>
              <span className="sec-num">06 / 13</span>
            </div>
            <p className="sec-sub">
              Phone mockups, ready for press. PNG @ 3x, transparent BG.
            </p>
            <div className="shots-grid">
              {SHOTS.map((s) => (
                <div key={s.label} className="shot-tile">
                  <div className="phone-frame">
                    <img
                      className="phone-screen-img"
                      src={s.src}
                      alt={s.alt}
                    />
                  </div>
                  <span className="shot-label">{s.label}</span>
                  <div className="shot-dl">
                    <a href="#" className="btn-dl">
                      DOWNLOAD PNG
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 08 / 13 — POST KIT ═══ */}
        <section id="sec-post">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Post Kit</h2>
              <span className="sec-num">07 / 13</span>
            </div>
            <div className="accordion">
              <AccordionItem
                id="tiktok"
                title="TikTok Scripts"
                open={openAccs.has("tiktok")}
                onToggle={() => toggleAcc("tiktok")}
              >
                <p className="acc-sub">
                  3 faceless scripts. 15-30s. Plug in your item, hit
                  record.
                </p>

                <div className="script-card">
                  <h4>SCRIPT 01 — $X → $Y REVEAL</h4>
                  <div className="code-block">
                    <button
                      className={copyClass("s1-beats")}
                      onClick={() => copy("s1-beats", SCRIPT_1)}
                    >
                      {copyLabel("s1-beats")}
                    </button>
                    <span>{SCRIPT_1}</span>
                  </div>
                  <div className="caption-block">
                    <strong>Caption:</strong> $X turned into $Y. Wild day
                    at the bins 🪐 #thriftflip #reseller #goodwillfinds
                  </div>
                  <div className="caption-block">
                    <strong>Hashtags:</strong> #reseller #thriftflip
                    #goodwillfinds #ebayreseller #vintagefinds #flipthrift
                    #resellercommunity #bolo
                  </div>
                </div>

                <div className="script-card">
                  <h4>SCRIPT 02 — BOLO ALERT</h4>
                  <div className="code-block">
                    <button
                      className={copyClass("s2-beats")}
                      onClick={() => copy("s2-beats", SCRIPT_2)}
                    >
                      {copyLabel("s2-beats")}
                    </button>
                    <span>{SCRIPT_2}</span>
                  </div>
                  <div className="caption-block">
                    <strong>Caption:</strong> BOLO alert 🚨 If you see
                    [BRAND] at the thrift, don&apos;t walk — RUN 🪐
                    #reseller #bolo #thriftflip
                  </div>
                  <div className="caption-block">
                    <strong>Hashtags:</strong> #reseller #bolo #thriftfinds
                    #ebayreseller #goodwillfinds #boloalert #flipping
                    #resellercommunity
                  </div>
                </div>

                <div className="script-card">
                  <h4>SCRIPT 03 — REAL VS FAKE</h4>
                  <div className="code-block">
                    <button
                      className={copyClass("s3-beats")}
                      onClick={() => copy("s3-beats", SCRIPT_3)}
                    >
                      {copyLabel("s3-beats")}
                    </button>
                    <span>{SCRIPT_3}</span>
                  </div>
                  <div className="caption-block">
                    <strong>Caption:</strong> Real vs fake. Can you tell?
                    Loot could 👀🪐 #reseller #authenticvsreplica
                    #thriftflip
                  </div>
                  <div className="caption-block">
                    <strong>Hashtags:</strong> #reseller #authenticvsreplica
                    #thriftflip #realvsfake #vintagefinds #designerresale
                    #resellertips
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                id="instagram"
                title="Instagram Captions"
                open={openAccs.has("instagram")}
                onToggle={() => toggleAcc("instagram")}
              >
                <div className="script-card">
                  <h4>REEL CAPTION</h4>
                  <div className="code-block">
                    <button
                      className={copyClass("ig-reel")}
                      onClick={() => copy("ig-reel", IG_REEL)}
                    >
                      {copyLabel("ig-reel")}
                    </button>
                    <span>{IG_REEL}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>STORY STICKER TEXT</h4>
                  <div className="code-block">
                    <button
                      className={copyClass("ig-story")}
                      onClick={() => copy("ig-story", IG_STORY)}
                    >
                      {copyLabel("ig-story")}
                    </button>
                    <span>{IG_STORY}</span>
                  </div>
                  <div className="caption-block">
                    <strong>Pair with:</strong> Poll (&quot;Would you
                    trust AI to pick your flips?&quot; YES / NO WAY) ·
                    Question box (&quot;Drop your best thrift find this
                    week&quot;) · Emoji slider (🪐 → 💰)
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem
                id="email"
                title="Email / Newsletter Swipe"
                open={openAccs.has("email")}
                onToggle={() => toggleAcc("email")}
              >
                <div className="script-card">
                  <h4>SUBJECT LINES (pick one)</h4>
                  <div className="code-block">
                    <button
                      className={copyClass("email-subj")}
                      onClick={() => copy("email-subj", EMAIL_SUBJ)}
                    >
                      {copyLabel("email-subj")}
                    </button>
                    <span>{EMAIL_SUBJ}</span>
                  </div>
                </div>
                <div className="script-card">
                  <h4>BODY (~200 WORDS)</h4>
                  <div
                    className="code-block"
                    style={{ fontSize: 11, lineHeight: 1.65 }}
                  >
                    <button
                      className={copyClass("email-body")}
                      onClick={() => copy("email-body", EMAIL_BODY)}
                    >
                      {copyLabel("email-body")}
                    </button>
                    <span>{EMAIL_BODY}</span>
                  </div>
                </div>
              </AccordionItem>
            </div>
          </div>
        </section>

        {/* ═══ 09 / 13 — AFFILIATE ═══ */}
        <section id="sec-affiliate">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Affiliate Program</h2>
              <span className="sec-num">08 / 13</span>
            </div>
            <div className="dark-card" style={{ padding: 32 }}>
              <div className="aff-table">
                <div className="aff-row">
                  <span className="aff-label aff-label--camel">
                    FOUNDING 20
                  </span>
                  <span className="aff-value">
                    60% setup + 40% recurring · lifetime
                  </span>
                  <span className="aff-badge">
                    <span className="pulse-dot"></span> 3 / 20 CLAIMED
                  </span>
                </div>
                <div className="aff-row">
                  <span className="aff-label">STANDARD TIERS</span>
                  <span className="aff-value">
                    30-50% setup / 20-35% recurring
                  </span>
                </div>
                <div className="aff-row">
                  <span className="aff-label">PAYOUT</span>
                  <span className="aff-value">
                    Digistore24 (bi-weekly) or Stripe + Rewardful (monthly
                    net-30)
                  </span>
                </div>
              </div>
            </div>
            <a href="#" className="cta-apply">
              APPLY AT LOOT.WORKS/PARTNERS →
            </a>
          </div>
        </section>

        {/* ═══ 10 / 13 — PRESS ═══ */}
        <section id="sec-press">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>Press</h2>
              <span className="sec-num">09 / 13</span>
            </div>
            <div className="dark-card" style={{ padding: 32 }}>
              <div className="press-table">
                <div className="press-row">
                  <span className="press-key">Founded</span>
                  <span className="press-val">2026</span>
                </div>
                <div className="press-row">
                  <span className="press-key">Headquarters</span>
                  <span className="press-val">McDonough, GA</span>
                </div>
                <div className="press-row">
                  <span className="press-key">Founder</span>
                  {/* TODO(deploy): swap with founder last name */}
                  <span className="press-val">David [LAST NAME]</span>
                </div>
                <div className="press-row">
                  <span className="press-key">Product</span>
                  <span className="press-val">
                    Mobile-first PWA for resellers
                  </span>
                </div>
                <div className="press-row">
                  <span className="press-key">Pricing</span>
                  <span className="press-val">$14.99/mo · $99.99/yr</span>
                </div>
                <div className="press-row">
                  <span className="press-key">Stack</span>
                  <span className="press-val">
                    Next.js · Supabase · Claude AI · Vercel
                  </span>
                </div>
                <div className="press-row">
                  <span className="press-key">Available</span>
                  <span className="press-val">
                    <a href="https://loot.works">loot.works</a> (no app
                    store)
                  </span>
                </div>
                <div className="press-row">
                  <span className="press-key">Press contact</span>
                  <span className="press-val">
                    <a href="mailto:press@loot.works">press@loot.works</a>
                  </span>
                </div>
                <div className="press-row">
                  <span className="press-key">Founder DMs</span>
                  <span className="press-val">
                    @loot.works on TikTok / IG / X
                  </span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <a
                href="#"
                className="btn-dl"
                style={{ padding: "14px 28px", fontSize: 12 }}
              >
                DOWNLOAD FULL PRESS KIT (PDF)
              </a>
            </div>
          </div>
        </section>

        {/* ═══ 11 / 13 — DO ═══ */}
        <section id="sec-do">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>You Can</h2>
              <span className="sec-num">10 / 13</span>
            </div>
            <div className="rules-grid">
              {DOS.map((line) => (
                <div key={line} className="rule-item rule-item--do">
                  <span className="rule-icon rule-icon--do">✓</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 12 / 13 — DON'T ═══ */}
        <section id="sec-dont">
          <div className="kit-wrap reveal">
            <div className="sec-header">
              <h2>You Can&apos;t</h2>
              <span className="sec-num">11 / 13</span>
            </div>
            <div className="rules-grid">
              {DONTS.map((line) => (
                <div key={line} className="rule-item rule-item--dont">
                  <span className="rule-icon rule-icon--dont">✗</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 13 / 13 — FOOTER ═══ */}
        <footer className="kit-footer">
          <div className="kit-wrap">
            <div className="footer-top">
              <div>
                <div className="footer-brand">
                  <svg className="coinmark" width="20" height="20">
                    <use href="#sym-coinmark" />
                  </svg>
                  <span className="wordmark">LOOT</span>
                </div>
              </div>
              <div className="footer-col">
                <h4>PRODUCT</h4>
                <a href="#">Pro</a>
                <a href="#">Flip or Skip</a>
                <a href="#">Partners</a>
                <a href="#">Kit</a>
              </div>
              <div className="footer-col">
                <h4>COMPANY</h4>
                <a href="#">About</a>
                <a href="#">Press</a>
                <a href="#">Contact</a>
              </div>
              <div className="footer-col">
                <h4>LEGAL</h4>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Refunds</a>
              </div>
            </div>
            <div className="footer-bottom">
              {/* TODO(deploy): swap [BUSINESS NAME] with legal business entity */}
              {/* TODO(deploy): swap [ADDRESS] with legal business address */}
              <p className="footer-biz">
                Loot — operated by [BUSINESS NAME], [ADDRESS]
              </p>
              <div id="digistore-trust-badge"></div>
              <p className="footer-tagline">
                // BUILT FOR THE 130 MILLION AMERICANS WHO RESELL
              </p>
              <p className="footer-copy">
                © 2026 Loot. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function AccordionItem({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`acc-item${open ? " open" : ""}`}>
      <button
        className="acc-trigger"
        aria-expanded={open}
        aria-controls={`acc-${id}-body`}
        onClick={onToggle}
      >
        {title} <span className="acc-arrow">▾</span>
      </button>
      <div className="acc-body" id={`acc-${id}-body`}>
        <div className="acc-body-inner">{children}</div>
      </div>
    </div>
  );
}

