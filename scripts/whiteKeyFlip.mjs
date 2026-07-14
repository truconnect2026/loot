// De-matte the Kronos (mascot) sprites off their SOLID WHITE export
// background and normalise them to the app's 320px sprite size.
//
// The locked Kronos art (near-black coyote, mint #5CE0B8 neon outline,
// gold #F5C518 halo + Saturn-chain, hoodie) ships from the source tool
// on a solid WHITE canvas (~rgb 254) with no alpha, at 1254x1254. On the
// app's near-black surfaces that white bg reads as a glaring box.
//
// This keys ONLY the exterior white via a border flood-fill: white
// (min channel high) is far from every art colour — mint's min channel
// is 92, gold's is 24, the body is near-black — so the flood never
// bleeds into the figure, and interior whites (teeth, eye glints,
// money sparkles) are walled off by the mint linework and preserved.
// Exterior RGB is set dark before the downscale so no white fringe can
// bleed onto the anti-aliased edge; the 1254->320 resize then averages
// the binary alpha into a clean silhouette.
//
// This is the WHITE-background counterpart to transparentizeFlip.mjs
// (which keys BLACK exteriors, for the legacy mint-ring sprites — do
// NOT run that one on this white-bg art, it would key the near-black
// coyote itself). Run whenever new white-bg Kronos art lands:
//   node scripts/whiteKeyFlip.mjs
//
// Idempotent: a sprite that already carries transparency is skipped.

import sharp from "sharp";
import { readdir } from "fs/promises";

const DIR = "public/flip";
const SIZE = 320;
// Exterior-white flood threshold (min channel). Mint's min channel is
// ~92, comfortably below this, so the flood can never enter the figure.
const TH = 228;
// Feather: light transition pixels (min channel between FADE_LO and 255)
// fade to transparent by whiteness, killing the white halo.
const FADE_LO = 200;

async function keyOne(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const N = w * h;

  // Already de-matted? A meaningful transparent fraction means done.
  let clear = 0;
  for (let o = 3; o < data.length; o += c) if (data[o] === 0) clear++;
  if (clear / N > 0.2) return { path, skipped: true };

  const minc = new Uint8Array(N);
  for (let p = 0, i = 0; p < N; p++, i += c) {
    minc[p] = Math.min(data[i], data[i + 1], data[i + 2]);
  }

  const ext = new Uint8Array(N);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!ext[p] && minc[p] >= TH) {
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
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (ext[p]) {
      a = 0;
      r = g = b = 8; // dark, so downscale bleed is invisible on dark UI
      cleared++;
    } else {
      const m = minc[p];
      if (m > FADE_LO) {
        a = Math.round((Math.max(0, (255 - m) / (255 - FADE_LO))) * 255);
      }
    }
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    out[o + 3] = a;
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .resize(SIZE, SIZE, { fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(path);
  return { path, cleared: ((cleared / N) * 100).toFixed(1) + "%" };
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".png"));
for (const f of files) {
  const r = await keyOne(`${DIR}/${f}`);
  console.log(
    r.skipped ? `skip  ${f} (already de-matted)` : `keyed ${f} — bg ${r.cleared} -> ${SIZE}px`,
  );
}
console.log(`\nDone. ${files.length} sprite(s) processed.`);
