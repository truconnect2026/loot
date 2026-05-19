/**
 * generate-og-images.mjs — produce public/og/{partners,kit}.png at 1200×630.
 *
 * Renders a single HTML template per page with the Loot brand DNA (dot grid,
 * radial gradient, Outfit/JetBrains Mono fonts, mint accents, flip mascot),
 * screenshots via puppeteer.
 *
 * Run: node scripts/generate-og-images.mjs
 */

import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public", "og");
await mkdir(OUT, { recursive: true });

const FLIP_PATH = "file:///" + resolve(ROOT, "public", "brand-kit", "flip", "flip-smirk.png").replace(/\\/g, "/");

const SHARED_HEAD = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@300;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px; height: 630px;
    background: #0a0a0a;
    background-image: radial-gradient(ellipse at 50% 0%, #0a1612 0%, #000 60%);
    color: #fff;
    font-family: 'Outfit', system-ui, sans-serif;
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 24px 24px; pointer-events: none;
  }
  .stage { position: absolute; inset: 0; padding: 56px; display: flex; }
  .left { width: 600px; display: flex; flex-direction: column; justify-content: center; padding-right: 24px; }
  .right { width: 600px; position: relative; display: flex; align-items: center; justify-content: center; }
  .flip-wrap { width: 420px; height: 420px; position: relative; }
  .flip-wrap::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(92,224,184,0.18) 0%, rgba(92,224,184,0) 60%);
    filter: blur(20px);
  }
  .flip-wrap img { width: 100%; height: 100%; object-fit: contain; position: relative; z-index: 1; }
  .ring { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
  .ring ellipse { fill: none; stroke: #5CE0B8; }
  /* corner chrome */
  .brand { position: absolute; top: 32px; left: 32px; display: flex; align-items: center; gap: 12px; z-index: 3; }
  .brand .glyph { width: 28px; height: 28px; }
  .brand-stack { display: flex; flex-direction: column; gap: 2px; }
  .brand-stack .wm {
    font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: 0.04em; color: #fff;
  }
  .brand-stack .route {
    font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 11px;
    letter-spacing: 0.28em; color: #5CE0B8;
  }
  .url {
    position: absolute; bottom: 32px; left: 32px;
    font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 12px;
    letter-spacing: 0.04em; color: rgba(255,255,255,0.4); z-index: 3;
  }
  /* headline + sub */
  .h1 { font-family: 'Outfit', sans-serif; font-weight: 700; line-height: 1.05; color: #fff; }
  .sub { font-family: 'Outfit', sans-serif; font-weight: 300; color: rgba(255,255,255,0.65); }
  .pill {
    display: inline-flex; align-items: center; font-family: 'JetBrains Mono', monospace;
    font-weight: 500; font-size: 14px; letter-spacing: 0.24em;
    padding: 9px 16px; border-radius: 999px; width: fit-content;
  }
  .pill-mint { background: rgba(92,224,184,0.1); border: 1px solid rgba(92,224,184,0.5); color: #5CE0B8; }
  .pill-camel { background: rgba(212,165,116,0.08); border: 1px solid rgba(212,165,116,0.45); color: #D4A574; }
  .pills-row { position: absolute; bottom: 32px; right: 32px; display: flex; gap: 12px; z-index: 3; }
</style>
`;

const brandCorner = (route) => `
  <div class="brand">
    <svg class="glyph" viewBox="0 0 32 32" fill="none">
      <g fill="none" stroke="#5CE0B8" stroke-width="2" stroke-linecap="round">
        <circle cx="16" cy="16" r="6"/>
        <ellipse cx="16" cy="16" rx="14" ry="4" transform="rotate(-23 16 16)"/>
      </g>
    </svg>
    <div class="brand-stack">
      <span class="wm">LOOT</span>
      <span class="route">/ ${route.toUpperCase()}</span>
    </div>
  </div>
`;

const flipWithRing = `
  <div class="flip-wrap">
    <img src="${FLIP_PATH}" alt=""/>
    <svg class="ring" viewBox="0 0 420 420">
      <ellipse cx="210" cy="210" rx="200" ry="60" stroke-width="2.5" opacity="0.55" transform="rotate(-23 210 210)"/>
      <ellipse cx="210" cy="210" rx="200" ry="60" stroke-width="3" stroke-dasharray="6 50 4 80" stroke="#000" transform="rotate(-23 210 210)"/>
    </svg>
  </div>
`;

const PARTNERS_HTML = `<!DOCTYPE html><html><head>${SHARED_HEAD}</head><body>
${brandCorner("partners")}
<div class="stage">
  <div class="left">
    <h1 class="h1" style="font-size: 64px; margin-bottom: 24px;">Flip pays better<br>than your last 3<br>affiliate programs.</h1>
    <div class="pill pill-mint" style="margin-bottom: 16px;">60% SETUP · 40% RECURRING · FOR LIFE</div>
    <p class="sub" style="font-size: 18px;">Founding 20 spots &mdash; loot.works/partners</p>
  </div>
  <div class="right">${flipWithRing}</div>
</div>
<div class="url">loot.works/partners</div>
</body></html>`;

const KIT_HTML = `<!DOCTYPE html><html><head>${SHARED_HEAD}</head><body>
${brandCorner("kit")}
<div class="stage">
  <div class="left">
    <h1 class="h1" style="font-size: 60px; margin-bottom: 24px;">Everything you<br>need to post<br>about Loot.</h1>
    <p class="sub" style="font-size: 18px; line-height: 1.5;">Logos, copy, screenshots, scripts.<br>Free to use. Just don&rsquo;t make us look bad.</p>
  </div>
  <div class="right">${flipWithRing}</div>
</div>
<div class="url">loot.works/kit</div>
<div class="pills-row">
  <div class="pill pill-mint">FOR AFFILIATES</div>
  <div class="pill pill-camel">FOR PRESS</div>
</div>
</body></html>`;

async function render(html, file) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: resolve(OUT, file),
      type: "png",
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
  } finally {
    await browser.close();
  }
}

console.log("→ partners.png");
await render(PARTNERS_HTML, "partners.png");
console.log("→ kit.png");
await render(KIT_HTML, "kit.png");
console.log("✓ done");
