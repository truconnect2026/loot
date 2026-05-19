// Crops flip1.png + flip2.png (1254x1254 sprite sheets) into 8 individual
// mood PNGs in public/flip/. One-shot build helper; re-run only when the
// source sheets change. Output dimensions are 320x320 (2x retina against
// the 160px default FlipCoyote size).
//
// Assignment confirmed by David — DO NOT swap without re-confirming:
//   flip1.png → CORE moods    (smirk / hyped / sideeye / dead)
//   flip2.png → EXTENSION moods (scanning / unicorn / shrug / callout)

import sharp from 'sharp';
import { mkdir } from 'fs/promises';

await mkdir('public/flip', { recursive: true });

const sheets = [
  { file: 'flip1.png', panels: ['smirk', 'hyped', 'sideeye', 'dead'] },
  { file: 'flip2.png', panels: ['scanning', 'unicorn', 'shrug', 'callout'] },
];

// 1254 / 2 = 627. Source is 1254x1254 in this batch (not 1248 as the spec
// drafted); panel size is the actual half-width so we cover the full image.
const crops = [
  { left: 0,   top: 0,   width: 627, height: 627 }, // TL
  { left: 627, top: 0,   width: 627, height: 627 }, // TR
  { left: 0,   top: 627, width: 627, height: 627 }, // BL
  { left: 627, top: 627, width: 627, height: 627 }, // BR
];

for (const { file, panels } of sheets) {
  for (let i = 0; i < 4; i++) {
    await sharp(file)
      .extract(crops[i])
      .resize(320, 320)
      .png({ compressionLevel: 9 })
      .toFile(`public/flip/flip-${panels[i]}.png`);
    console.log(`done flip-${panels[i]}.png`);
  }
}

console.log('Done. 8 panels written to public/flip/');
