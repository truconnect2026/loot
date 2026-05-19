/**
 * generate-flip-assets.mjs — re-runnable Flip asset packager.
 *
 * Outputs into public/brand-kit/flip/:
 *   flip-sprite-sheet.png    — flip1.png re-exported at 1024×1024 transparent
 *   flip-moods.zip           — the 4 cropped mood PNGs in a single archive
 *   flip-animated-ring.svg   — standalone rotating Saturn ring (SMIL fallback so
 *                              the animation works when the SVG is opened
 *                              directly as a file:// asset; CSS keyframes inside
 *                              standalone SVGs get stripped by some viewers).
 *
 * Run: node scripts/generate-flip-assets.mjs
 */

import { createWriteStream } from "node:fs";
import { writeFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { createRequire } from "node:module";
const archiver = createRequire(import.meta.url)("archiver");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "public", "brand-kit", "flip");
await mkdir(OUT, { recursive: true });

// ─── A. Sprite sheet (re-export flip1.png @ 1024×1024 transparent) ──────────
console.log("→ sprite sheet");
await sharp(resolve(ROOT, "flip1.png"))
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(resolve(OUT, "flip-sprite-sheet.png"));

// ─── B. Moods ZIP (4 individual mood PNGs) ──────────────────────────────────
console.log("→ moods.zip");
await new Promise((res, rej) => {
  const out = createWriteStream(resolve(OUT, "flip-moods.zip"));
  const zip = archiver("zip", { zlib: { level: 9 } });
  out.on("close", res);
  zip.on("error", rej);
  zip.pipe(out);
  for (const f of ["flip-smirk.png", "flip-hyped.png", "flip-sideeye.png", "flip-dead.png"]) {
    zip.file(resolve(OUT, f), { name: f });
  }
  zip.finalize();
});

// ─── C. Animated ring SVG (SMIL — works when opened standalone in browser) ──
console.log("→ animated ring SVG");
const ringSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <g transform-origin="80 80">
    <animateTransform attributeName="transform" attributeType="XML" type="rotate"
                      from="0 80 80" to="360 80 80" dur="4s" repeatCount="indefinite"/>
    <ellipse cx="80" cy="80" rx="70" ry="20" fill="none" stroke="#5CE0B8"
             stroke-width="1.5" opacity="0.85" transform="rotate(-23 80 80)"/>
    <ellipse cx="80" cy="80" rx="70" ry="20" fill="none" stroke="#000"
             stroke-width="2.5" stroke-dasharray="6 50 4 80" transform="rotate(-23 80 80)"/>
  </g>
</svg>
`;
await writeFile(resolve(OUT, "flip-animated-ring.svg"), ringSvg);

const s = async (p) => (await stat(p)).size;
console.log("✓ done");
console.log("  sprite sheet:", await s(resolve(OUT, "flip-sprite-sheet.png")), "bytes");
console.log("  moods.zip   :", await s(resolve(OUT, "flip-moods.zip")), "bytes");
console.log("  ring svg    :", await s(resolve(OUT, "flip-animated-ring.svg")), "bytes");
