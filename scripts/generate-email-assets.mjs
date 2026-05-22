/**
 * generate-email-assets.mjs — produce public/email-assets/{hero-youre-in,coinmark-40,coinmark-32}.png
 *
 * These ship with the post-purchase welcome email template that Digistore24
 * fires after a Pro checkout. Email clients (Gmail, Outlook, Apple Mail) need
 * the assets hosted at a real https URL — they don't render inline base64
 * reliably and they don't have access to next/font.
 *
 * Assets:
 *   hero-youre-in.png  — 960×192 transparent · "YOU'RE IN." Bebas Neue white
 *                        (480×96 display @2x retina)
 *   coinmark-40.png    — 40×40 transparent · Saturn glyph mint 1.5px stroke
 *                        (20×20 display @2x — email header)
 *   coinmark-32.png    — 32×32 transparent · Saturn glyph mint 1.5px stroke
 *                        (16×16 display @2x — email footer)
 *
 * Hero uses puppeteer because Bebas Neue must load from Google Fonts and
 * render at high fidelity. Coinmarks use sharp (pure SVG → PNG, no font deps).
 *
 * Run: node scripts/generate-email-assets.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import puppeteer from "puppeteer";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public", "email-assets");
await mkdir(OUT, { recursive: true });

const MINT = "#5CE0B8";

// ── 1. coinmark-40.png + coinmark-32.png ──
// Two SVG paths: outer ring ellipse + inner planet circle. Same glyph used
// elsewhere as <CoinMark> / <SaturnGlyph>. The ratio inside the 40-viewBox
// is: planet radius=8, ring rx=18 / ry=5, rotated -23deg.

function saturnSvg(size) {
  // The viewBox stays 40 — we just scale via the output PNG size.
  // strokeWidth is fixed at 1.5 to match the email design spec.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="8" fill="none" stroke="${MINT}" stroke-width="1.5"/>
    <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="${MINT}" stroke-width="1.5" transform="rotate(-23 20 20)"/>
  </svg>`;
}

async function renderCoinmark(size, filename) {
  const png = await sharp(Buffer.from(saturnSvg(size)))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const path = resolve(OUT, filename);
  await writeFile(path, png);
  return { path, bytes: png.length };
}

const c40 = await renderCoinmark(40, "coinmark-40.png");
console.log(`✓ coinmark-40.png  · ${c40.bytes.toLocaleString()} bytes`);

const c32 = await renderCoinmark(32, "coinmark-32.png");
console.log(`✓ coinmark-32.png  · ${c32.bytes.toLocaleString()} bytes`);

// ── 2. hero-youre-in.png ──
// 960×192, "YOU'RE IN." Bebas Neue 192px @2x, white on transparent.
// letter-spacing: -2% per spec.

const HERO_HTML = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=block" rel="stylesheet">
  <style>
    html, body { margin: 0; padding: 0; background: transparent; }
    body {
      width: 960px; height: 192px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Bebas Neue', sans-serif;
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
    .h {
      font-size: 192px;
      line-height: 1;
      letter-spacing: -0.02em;
      font-weight: 400;
    }
  </style>
</head><body><div class="h">YOU&rsquo;RE IN.</div></body></html>`;

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 192, deviceScaleFactor: 1 });
  await page.setContent(HERO_HTML, { waitUntil: "networkidle0" });
  // Block until the webfont is actually painted — networkidle0 alone doesn't
  // guarantee the font has loaded into the document.
  await page.evaluate(() => document.fonts.ready);

  const heroPath = resolve(OUT, "hero-youre-in.png");
  await page.screenshot({
    path: heroPath,
    type: "png",
    omitBackground: true,
    clip: { x: 0, y: 0, width: 960, height: 192 },
  });
  const { stat } = await import("node:fs/promises");
  const s = await stat(heroPath);
  console.log(`✓ hero-youre-in.png · ${s.size.toLocaleString()} bytes`);
} finally {
  await browser.close();
}

console.log("\nAll 3 email assets generated in public/email-assets/");
