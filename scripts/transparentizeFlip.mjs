// Transparentize the Kronos (mascot) sprite backgrounds.
//
// The cropped mood PNGs in public/flip/ are authored on a SOLID BLACK
// canvas (rgb 0,0,0). On the app's near-black surfaces that reads as a
// hard square edge — worst in the small FlipTip / empty-state glyphs,
// where a visible black box frames the coyote.
//
// Two-pass border flood keys ONLY the exterior background to transparent:
//   pass 1 — pure-black (max channel <= 18) anywhere: the coyote's own
//     fill is a distinct dark grey (~rgb 26) and its interior blacks
//     (eyes, inner ears, mouth) are walled off by the mint linework, so
//     a corner-seeded flood never reaches them.
//   pass 2 — the sprite crop leaves a faint dark-grey panel matte at the
//     very edge (grey ~rgb 42, above the pass-1 threshold). Pass 2 also
//     floods GREY pixels (low saturation, max channel <= 55), but ONLY
//     within EDGE_BAND px of the canvas edge, so it strips that frame
//     without ever reaching — and hollowing out — the central grey body.
//     Mint linework is saturated green, so it walls off both passes.
// The boundary alpha is feathered by brightness so no dark fringe
// survives on lighter cards.
//
// Idempotent: a sprite that already carries a transparent border is
// skipped, so re-running after a fresh art drop is safe. Run whenever
// NEW opaque Kronos art lands in public/flip/:
//   node scripts/transparentizeFlip.mjs
//
// Prefer authoring the source art with a transparent background; this
// is the safety net for opaque exports.

import sharp from "sharp";
import { readdir } from "fs/promises";

const DIR = "public/flip";
// Pass-1 exterior-black flood threshold (max channel). The coyote fill
// sits at ~27, comfortably above this.
const TH = 18;
// Pass-2 edge-matte flood: grey pixels (saturation spread <= SAT, max
// channel <= GREY) within BAND px of an edge. Shallow enough it can
// never travel inward to the body.
const BAND = 8;
const SAT = 14;
const GREY = 55;
// Feather window: below LO → fully transparent, above HI → fully opaque.
const LO = 6;
const HI = 30;
// Edge-grey fade: the source art bleeds a faint grey vignette matte to
// the very edges (values 45–78) that outruns the flood thresholds and is
// entangled in value-range with the coyote's own grey fur. Within FEATHER
// px of the canvas edge, fade GREY pixels (saturation spread <= EDGE_SAT)
// to transparent by edge distance — saturated mint ring-tips keep full
// alpha, so only the grey frame dissolves.
const FEATHER = 12;
const EDGE_SAT = 22;

async function keyOne(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const N = w * h;

  // Already keyed? The mascot fills the canvas edge-to-edge (even the
  // corners carry art), so no fixed sample point is reliably background.
  // Instead read the transparent fraction: an opaque source sits at ~0%,
  // a keyed sprite clears ~70%. Anything past 20% is already done.
  let clear = 0;
  for (let o = 3; o < data.length; o += c) if (data[o] === 0) clear++;
  if (clear / N > 0.2) return { path, skipped: true };

  const maxch = new Uint8Array(N);
  const spread = new Uint8Array(N);
  for (let p = 0, i = 0; p < N; p++, i += c) {
    const mx = Math.max(data[i], data[i + 1], data[i + 2]);
    const mn = Math.min(data[i], data[i + 1], data[i + 2]);
    maxch[p] = mx;
    spread[p] = mx - mn;
  }

  const ext = new Uint8Array(N);
  const stack = [];
  const floodable = (x, y, p) => {
    if (maxch[p] <= TH) return true; // pass 1: pure-black anywhere
    // pass 2: grey matte only within the edge band
    const edgeDist = Math.min(x, y, w - 1 - x, h - 1 - y);
    return edgeDist <= BAND && spread[p] <= SAT && maxch[p] <= GREY;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!ext[p] && floodable(x, y, p)) {
      ext[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p - x) / w;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const out = Buffer.alloc(N * 4);
  let cleared = 0;
  for (let p = 0, i = 0, o = 0; p < N; p++, i += c, o += 4) {
    let a = 255;
    if (ext[p]) {
      a = 0;
      cleared++;
    } else {
      const m = maxch[p];
      if (m < 40) {
        a = Math.round(Math.min(1, Math.max(0, (m - LO) / (HI - LO))) * 255);
      }
    }
    if (a > 0 && spread[p] <= EDGE_SAT) {
      const x = p % w;
      const y = (p - x) / w;
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (d < FEATHER) a = Math.round((a * d) / FEATHER);
    }
    out[o] = data[i];
    out[o + 1] = data[i + 1];
    out[o + 2] = data[i + 2];
    out[o + 3] = a;
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path);
  return { path, cleared: ((cleared / N) * 100).toFixed(1) + "%" };
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".png"));
for (const f of files) {
  const r = await keyOne(`${DIR}/${f}`);
  console.log(r.skipped ? `skip  ${f} (already keyed)` : `keyed ${f} — bg ${r.cleared}`);
}
console.log(`\nDone. ${files.length} sprite(s) processed.`);
