/**
 * generate-logos.mjs — re-runnable logo asset generator for public/brand-kit/logos/.
 *
 * Outputs 6 logos × 2 formats = 12 files:
 *   wordmark-mint-on-black.{svg,png}
 *   wordmark-black-on-mint.{svg,png}
 *   wordmark-white-on-transparent.{svg,png}
 *   coinmark-mint.{svg,png}
 *   coinmark-white.{svg,png}
 *   saturn-glyph-mint.{svg,png}
 *
 * Wordmarks render via puppeteer (real Outfit font from Google Fonts).
 * Icons are hand-written SVG → rasterized via sharp.
 *
 * Run: node scripts/generate-logos.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "brand-kit", "logos");

const MINT = "#5CE0B8";
const BLACK = "#0a0a0a";
const WHITE = "#FFFFFF";

await mkdir(OUT, { recursive: true });

// ─── WORDMARK SVG (declarative — letter-spacing 0.04em, font 200px) ──────────
const wordmarkSvg = ({ fg, bg }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700&amp;display=swap');
      .wm { font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; font-weight: 700; font-size: 200px; letter-spacing: 8px; }
    </style>
  </defs>
  ${bg ? `<rect width="800" height="400" fill="${bg}"/>` : ""}
  <text x="400" y="200" text-anchor="middle" dominant-baseline="central" class="wm" fill="${fg}">LOOT</text>
</svg>
`;

// ─── COINMARK SVG (Saturn glyph, viewBox 512, 1.4px stroke at base scale) ───
// Strokes scaled proportionally: at 512 viewBox, a 1.4px nominal stroke ~= 1.4 * (512/16) = 44.8.
// Simpler: keep visual proportion similar to the in-app SaturnGlyph (rx=7,ry=2 at viewBox 16 → rx=224,ry=64 at 512).
const coinmarkSvg = (color) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round">
    <circle cx="256" cy="256" r="96"/>
    <ellipse cx="256" cy="256" rx="224" ry="64" transform="rotate(-23 256 256)"/>
  </g>
</svg>
`;

// ─── SATURN GLYPH SVG (lighter stroke for inline use, viewBox 256) ──────────
const saturnGlyphSvg = (color) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <g fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round">
    <circle cx="128" cy="128" r="48"/>
    <ellipse cx="128" cy="128" rx="112" ry="32" transform="rotate(-23 128 128)"/>
  </g>
</svg>
`;

// ─── PUPPETEER WORDMARK PNG renderer (real Outfit @700 from Google Fonts) ───
const wordmarkHtml = ({ fg, bg }) => `<!DOCTYPE html>
<html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; padding: 0; }
  body {
    width: 1200px; height: 600px;
    background: ${bg ?? "transparent"};
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif; font-weight: 700;
    font-size: 300px; letter-spacing: 12px; color: ${fg};
  }
</style>
</head><body>LOOT</body></html>`;

async function renderWordmarkPng({ fg, bg, file }) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 600, deviceScaleFactor: 1 });
    await page.setContent(wordmarkHtml({ fg, bg }), { waitUntil: "networkidle0" });
    // Wait for the Outfit font to actually load before screenshot.
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({
      path: resolve(OUT, file),
      type: "png",
      omitBackground: bg == null,
      clip: { x: 0, y: 0, width: 1200, height: 600 },
    });
  } finally {
    await browser.close();
  }
}

async function rasterize(svg, outFile, { width, height }) {
  const buf = await sharp(Buffer.from(svg), { density: 384 })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(outFile, buf);
}

// ─── GENERATE ───────────────────────────────────────────────────────────────

console.log("→ wordmark SVGs");
await writeFile(resolve(OUT, "wordmark-mint-on-black.svg"), wordmarkSvg({ fg: MINT, bg: BLACK }));
await writeFile(resolve(OUT, "wordmark-black-on-mint.svg"), wordmarkSvg({ fg: BLACK, bg: MINT }));
await writeFile(resolve(OUT, "wordmark-white-on-transparent.svg"), wordmarkSvg({ fg: WHITE, bg: null }));

console.log("→ coinmark + saturn glyph SVGs");
await writeFile(resolve(OUT, "coinmark-mint.svg"), coinmarkSvg(MINT));
await writeFile(resolve(OUT, "coinmark-white.svg"), coinmarkSvg(WHITE));
await writeFile(resolve(OUT, "saturn-glyph-mint.svg"), saturnGlyphSvg(MINT));

console.log("→ wordmark PNGs (puppeteer — loading Outfit font)");
await renderWordmarkPng({ fg: MINT, bg: BLACK, file: "wordmark-mint-on-black.png" });
await renderWordmarkPng({ fg: BLACK, bg: MINT, file: "wordmark-black-on-mint.png" });
await renderWordmarkPng({ fg: WHITE, bg: null, file: "wordmark-white-on-transparent.png" });

console.log("→ icon PNGs (sharp rasterization)");
await rasterize(coinmarkSvg(MINT), resolve(OUT, "coinmark-mint.png"), { width: 800, height: 800 });
await rasterize(coinmarkSvg(WHITE), resolve(OUT, "coinmark-white.png"), { width: 800, height: 800 });
await rasterize(saturnGlyphSvg(MINT), resolve(OUT, "saturn-glyph-mint.png"), { width: 256, height: 256 });

console.log("✓ done — 12 files in", OUT);
