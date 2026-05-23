/**
 * generate-og-pro.mjs — produces public/og-pro.png at 1200×630.
 *
 * Cosmic editorial OG card for /pro:
 *   • Deep black backdrop (#070510)
 *   • 40+ pinpoint stars (varied size, mostly white, some gold/blue)
 *   • Saturn ring particle stroke in lower-right at -23deg, mint #5CE0B8 / 30%
 *   • Top-left: "LOOT.WORKS / PRO" mono mint 24px
 *   • Center-left: "STOP LEAVING MONEY" Bebas Neue white ~120px tight
 *   • Below: "ON THE SHELF." Bebas Neue italic gold #F5C518 ~80px
 *   • Below that: "AI THRIFT ARBITRAGE · $14.99/MO" mono mint 24px caps
 *   • Bottom-left: "loot.works/pro" mono mint 50% opacity 14px
 *
 * Generation: puppeteer + Google Fonts → screenshot at 1200×630.
 * Then sharp palette-quantize to 128 colours (matches og-kit.png pipeline)
 * to stay under the 500KB social-share threshold.
 *
 * Run: node scripts/generate-og-pro.mjs
 */

import { writeFile, mkdir, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import puppeteer from "puppeteer";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public");
await mkdir(OUT, { recursive: true });

// Deterministic starfield — 50 stars, mixed mint/gold/white/blue tints.
// Mulberry32 PRNG seeded with the same seed every run so the card is stable.
function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStarsSvg() {
  const rng = mulberry32(0xC051E711);
  const stars = [];
  const colors = [
    { c: "#ffffff", w: 0.55 },
    { c: "#F5C518", w: 0.15 }, // gold
    { c: "#5CE0B8", w: 0.12 }, // mint
    { c: "#7B8FFF", w: 0.10 }, // periwinkle
    { c: "#ffffff", w: 0.08 }, // extra-bright pop
  ];
  for (let i = 0; i < 60; i++) {
    const x = Math.round(rng() * 1200);
    const y = Math.round(rng() * 630);
    const sizeRoll = rng();
    const r = sizeRoll > 0.92 ? 2.2 : sizeRoll > 0.65 ? 1.4 : 0.9;
    const opacity = 0.4 + rng() * 0.5;
    const wRoll = rng();
    let acc = 0;
    let pick = colors[0];
    for (const c of colors) { acc += c.w; if (wRoll <= acc) { pick = c; break; } }
    stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${pick.c}" opacity="${opacity.toFixed(2)}" />`);
  }
  return stars.join("\n    ");
}

const STARS_SVG = buildStarsSvg();

const HERO_HTML = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bebas+Neue:ital@1&family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
  <style>
    html, body { margin: 0; padding: 0; }
    body {
      width: 1200px; height: 630px;
      background: #070510;
      position: relative;
      overflow: hidden;
      font-family: 'JetBrains Mono', monospace;
      color: #fff;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }

    /* layered cosmic gradient — subtle nebula bloom in upper-left */
    .bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 700px 500px at 18% 12%, rgba(123,143,255,0.08), transparent 65%),
        radial-gradient(ellipse 900px 700px at 78% 88%, rgba(92,224,184,0.06), transparent 60%);
    }

    /* dot grid overlay (very subtle) */
    .grid {
      position: absolute; inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    /* starfield SVG (positioned absolute to fill viewport) */
    .stars { position: absolute; inset: 0; }

    /* Saturn ring in lower-right */
    .saturn {
      position: absolute;
      right: -120px; bottom: -100px;
      width: 700px; height: 700px;
      transform: rotate(-23deg);
    }
    .saturn ellipse.ring {
      fill: none;
      stroke: #5CE0B8;
      stroke-width: 1.2;
      opacity: 0.32;
      stroke-dasharray: 1.5 4;
    }
    .saturn ellipse.ring-inner {
      stroke: #5CE0B8;
      stroke-width: 1;
      opacity: 0.22;
      stroke-dasharray: 1 3;
    }
    .saturn circle.planet {
      fill: rgba(40,30,60,0.4);
      stroke: rgba(123,143,255,0.45);
      stroke-width: 1.2;
    }

    /* content */
    .wrap {
      position: relative; z-index: 10;
      padding: 56px 64px;
      height: 100%;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .eyebrow {
      font: 500 24px/1 'JetBrains Mono', monospace;
      letter-spacing: 0.28em;
      color: #5CE0B8;
      text-transform: uppercase;
    }
    .headline {
      font: 400 120px/0.92 'Bebas Neue', sans-serif;
      letter-spacing: -0.01em;
      color: #ffffff;
      margin: 0;
      text-transform: uppercase;
    }
    .headline-italic {
      font: italic 400 80px/1 'Bebas Neue', sans-serif;
      letter-spacing: -0.01em;
      color: #F5C518;
      margin: 8px 0 0 0;
      text-transform: uppercase;
    }
    .subline {
      font: 500 24px/1 'JetBrains Mono', monospace;
      letter-spacing: 0.18em;
      color: #5CE0B8;
      text-transform: uppercase;
      margin-top: 36px;
    }
    .footer {
      font: 500 14px/1 'JetBrains Mono', monospace;
      letter-spacing: 0.18em;
      color: #5CE0B8;
      opacity: 0.55;
      text-transform: lowercase;
    }

    .content-stack {
      display: flex; flex-direction: column;
    }
  </style>
</head><body>
  <div class="bg"></div>
  <div class="grid"></div>
  <svg class="stars" viewBox="0 0 1200 630" preserveAspectRatio="none">
    ${STARS_SVG}
  </svg>
  <svg class="saturn" viewBox="0 0 700 700">
    <ellipse class="ring"       cx="350" cy="350" rx="320" ry="92" />
    <ellipse class="ring-inner" cx="350" cy="350" rx="270" ry="76" />
    <ellipse class="ring-inner" cx="350" cy="350" rx="380" ry="110" />
    <circle  class="planet"     cx="350" cy="350" r="150" />
  </svg>

  <div class="wrap">
    <div class="eyebrow">LOOT.WORKS&nbsp;&nbsp;/&nbsp;&nbsp;PRO</div>

    <div class="content-stack">
      <h1 class="headline">STOP LEAVING MONEY</h1>
      <h2 class="headline-italic">ON THE SHELF.</h2>
      <div class="subline">AI THRIFT ARBITRAGE&nbsp;&nbsp;·&nbsp;&nbsp;$14.99/MO</div>
    </div>

    <div class="footer">loot.works/pro</div>
  </div>
</body></html>`;

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const tempPath = resolve(OUT, "og-pro-raw.png");
const finalPath = resolve(OUT, "og-pro.png");

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(HERO_HTML, { waitUntil: "networkidle0" });
  // Block until the webfont is actually painted.
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({
    path: tempPath,
    type: "png",
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  const rawSize = (await stat(tempPath)).size;
  console.log(`  raw screenshot: ${rawSize.toLocaleString()} bytes`);
} finally {
  await browser.close();
}

// Palette-quantize the result the same way we did for og-kit.png.
// 128 colours + dither 1.0 + max compression — keeps cosmic gradients intact
// at OG-display sizes while hitting <500KB on the wire.
const info = await sharp(tempPath)
  .png({ palette: true, colours: 128, dither: 1.0, compressionLevel: 9 })
  .toFile(finalPath);
await unlink(tempPath);

console.log(`✓ og-pro.png       : ${info.size.toLocaleString()} bytes  →  ${(info.size / 1024).toFixed(0)} KB`);
console.log(`  dimensions       : ${info.width}×${info.height}`);
console.log(`  saved to         : ${finalPath}`);
