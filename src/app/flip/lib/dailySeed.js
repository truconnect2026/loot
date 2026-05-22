import { ITEMS } from "../items.js";

/**
 * Standard mulberry32 PRNG — fast, sufficient for cosmetic seeded shuffles.
 * Same impl used elsewhere in this codebase. Deterministic per-seed.
 */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const EPOCH = new Date("2026-05-01").getTime();
const MS_PER_DAY = 86400000;

/** Days since epoch (1-based). Today's puzzle number. */
export function getPuzzleNumber() {
  return Math.floor((Date.now() - EPOCH) / MS_PER_DAY) + 1;
}

/** YYYYMMDD integer for today, used as the daily PRNG seed. */
function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function shuffleSeeded(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function takeFrom(pool, rnd, count) {
  const shuffled = shuffleSeeded(pool, rnd);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Returns 10 items for today's round, deterministically shuffled by today's
 * date. Mix tuned to ~6 flips, ~3 skips, ~1 trick — but always exactly 10.
 * The trick bucket is sampled first so it always lands; remaining slots are
 * topped up from flip/skip pools, then the final 10 are reshuffled.
 */
export function getDailyItems() {
  const rnd = mulberry32(todaySeed());

  const flips = ITEMS.filter((it) => it.isFlip && it.difficulty !== "trick");
  const skips = ITEMS.filter((it) => !it.isFlip && it.difficulty !== "trick");
  const tricks = ITEMS.filter((it) => it.difficulty === "trick");

  const target = { tricks: 1, flips: 6, skips: 3 };

  const picked = [
    ...takeFrom(tricks, rnd, target.tricks),
    ...takeFrom(flips, rnd, target.flips),
    ...takeFrom(skips, rnd, target.skips),
  ];

  // Top off to exactly 10 from a combined pool if any bucket was short.
  if (picked.length < 10) {
    const seenIds = new Set(picked.map((p) => p.id));
    const rest = ITEMS.filter((it) => !seenIds.has(it.id));
    picked.push(...takeFrom(rest, rnd, 10 - picked.length));
  }

  // Reshuffle final 10 so the order doesn't telegraph the buckets.
  return shuffleSeeded(picked, rnd).slice(0, 10);
}
