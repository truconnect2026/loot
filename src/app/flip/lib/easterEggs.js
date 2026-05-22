"use client";

/**
 * Easter-egg discovery + smart-hint state, persisted in localStorage.
 *
 * Three eggs:
 *   - "konami"        ↑↑↓↓←→←→BA on intro
 *   - "wolf-typed"    type W-O-L-F on results screen
 *   - "mascot-poked"  tap mascot 15 times across a single session
 *
 * Hints only appear after the user has played multiple days without
 * discovering the relevant egg, and re-hint at most once per 24h.
 */

const DISCOVERED_KEY = "fos-eggs-discovered";
const HINT_SHOWN_KEY = "fos-eggs-hint-shown";
const ONE_DAY_MS = 86_400_000;

const HINT_MIN_DAYS = {
  konami: 3,
  "wolf-typed": 4,
  "mascot-poked": 5,
};

function safeJsonGet(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}

function safeJsonSet(key, value) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* */ }
}

export function isDiscovered(egg) {
  const all = safeJsonGet(DISCOVERED_KEY, {});
  return !!all[egg];
}

export function markDiscovered(egg) {
  const all = safeJsonGet(DISCOVERED_KEY, {});
  all[egg] = true;
  safeJsonSet(DISCOVERED_KEY, all);
}

function getDaysPlayed() {
  if (typeof window === "undefined") return 0;
  try { return parseInt(localStorage.getItem("fos-days-played") || "0", 10); } catch { return 0; }
}

export function shouldShowHint(egg) {
  if (isDiscovered(egg)) return false;
  const days = getDaysPlayed();
  if (days < (HINT_MIN_DAYS[egg] || 3)) return false;
  const shown = safeJsonGet(HINT_SHOWN_KEY, {});
  const last = shown[egg] || 0;
  if (Date.now() - last < ONE_DAY_MS) return false;
  return true;
}

export function markHintShown(egg) {
  const shown = safeJsonGet(HINT_SHOWN_KEY, {});
  shown[egg] = Date.now();
  safeJsonSet(HINT_SHOWN_KEY, shown);
}
