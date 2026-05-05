// Renders the two PNG icons referenced by public/sw.js for web-push
// notifications. Run via `node scripts/generate-push-icons.mjs`.
//
// icon-192.png  → primary tray icon (Android shows it large)
// badge-72.png  → monochrome status-bar badge (Android only; iOS ignores)
//
// Both are derived from public/favicon.svg so the brand stays consistent.
// The 192 sits on the dark vault surface (#120e18) the rest of the app
// uses; the badge is rendered transparent because Android tints it.
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Tray icon — Saturn ring on the app's dark vault background, scaled
// up so the icon doesn't look lost in Android's circular crop.
const trayBg = "#120e18";
const trayMint = "#5CE0B8";
const traySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="${trayBg}"/>
  <g transform="translate(96 96) scale(5.6) translate(-12 -12)">
    <path d="M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74" stroke="${trayMint}" stroke-width="1.1" stroke-linecap="round" opacity="0.45" fill="none"/>
    <ellipse cx="12" cy="12" rx="6.5" ry="6" stroke="${trayMint}" stroke-width="1.5" fill="none"/>
    <path d="M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74" stroke="${trayMint}" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

// Status-bar badge — solid white-on-transparent so Android's silhouette
// renderer keeps the ring + planet legible at 72px.
const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <g transform="translate(36 36) scale(2.2) translate(-12 -12)">
    <path d="M 18.49 12.26 A 11 3.5 -25 0 0 5.51 11.74" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <ellipse cx="12" cy="12" rx="6.5" ry="6" stroke="#ffffff" stroke-width="1.8" fill="none"/>
    <path d="M 18.49 12.26 A 11 3.5 -25 0 1 5.51 11.74" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

async function build(svg, out, size) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
}

await build(traySvg, resolve(root, "public/icon-192.png"), 192);
await build(badgeSvg, resolve(root, "public/badge-72.png"), 72);
