import { KNOWN_PRESSINGS } from "./knownPressings";

// Canonical title dictionary — curated for thrift/niche books + manga.
const KNOWN_TITLES: readonly string[] = [
  "Children of Blood and Bone",
  "Children of Virtue and Vengeance",
  "Soul Eater",
  "Black Butler",
  "Black Clover",
  "City of Bones",
  "City of Ashes",
  "City of Glass",
  "City of Fallen Angels",
  "City of Lost Souls",
  "City of Heavenly Fire",
  "Clockwork Angel",
  "Clockwork Prince",
  "Clockwork Princess",
  "Lady Midnight",
  "Lord of Shadows",
  "Queen of Air and Darkness",
  "Chain of Gold",
  "The Bane Chronicles",
  "Tales from the Shadowhunter Academy",
  "Ghosts of the Shadow Market",
  "Bridgerton",
  "Throne of Glass",
  "Legendborn",
  "An Ember in the Ashes",
  "Crescent City",
  "Fablehaven",
  "One Piece",
  "Sailor Moon",
  "Demon Slayer",
  "Jujutsu Kaisen",
  "Hunter x Hunter",
  "Spy x Family",
  "Attack on Titan",
];

// Standard space-optimised Levenshtein (O(n) space).
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, temp, row[j - 1]);
      prev = temp;
    }
  }
  return row[n];
}

// Jaccard token overlap — shared_tokens / union_tokens.
function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(/\s+/).filter(Boolean));
  const tb = new Set(b.split(/\s+/).filter(Boolean));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  const union = ta.size + tb.size - shared;
  return union === 0 ? 0 : shared / union;
}

// Normalise: lowercase, strip hedge phrases + parentheticals, collapse to plain tokens.
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+or similar.*$/i, "")
    .replace(/\(likely\s[^)]*\)/gi, "")
    .replace(/-\s*likely\s+.*/gi, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip generic trailing suffixes so "soullater manga vol 1-5" → "soullater"
// for clean title-distance comparison. Operates on an already-normalised string.
function stripSuffixes(s: string): string {
  return s
    .replace(
      /\s+(manga(\s+vol(?:ume)?\.?\s*[\d][\d\s,\-]*)?|vol(?:ume)?\.?\s*[\d][\d\s,\-]*.*|series|set|complete|omnibus|hardcover|paperback)\s*$/i,
      "",
    )
    .trim();
}

// Pull meaningful volume/format info from the ORIGINAL raw to re-append after correction.
function extractSuffix(raw: string): string {
  const vol = raw.match(/\b(manga\s+)?vol(?:ume)?\.?\s*[\d][\d\s,\-]*/i);
  if (vol) return vol[0].trim();
  const set = raw.match(/\s*\(set\)\s*$/i);
  if (set) return set[0].trim();
  return "";
}

// Fuzzy match against KNOWN_PRESSINGS for vinyl category items.
function findVinylMatch(rawName: string): string | null {
  if (rawName.length < 3) return null;
  const normRaw = normalise(rawName);
  for (const pressing of KNOWN_PRESSINGS) {
    const normCanon = normalise(pressing.canonical);
    const dist = levenshtein(normRaw, normCanon);
    const threshold = Math.max(3, Math.ceil(normCanon.length * 0.22));
    const overlap = tokenOverlap(normRaw, normCanon);
    if (dist <= threshold || overlap >= 0.55) return pressing.canonical;
    for (const alias of pressing.aliases) {
      if (tokenOverlap(normRaw, normalise(alias)) >= 0.65) return pressing.canonical;
    }
  }
  return null;
}

/**
 * Attempt to snap a garbled/misspelled item name to the nearest canonical title.
 * Pass category="vinyl" to check against KNOWN_PRESSINGS instead of KNOWN_TITLES.
 * Returns the corrected name plus a flag. Never throws.
 */
export function correctName(rawName: string, category?: string): { name: string; corrected: boolean } {
  // Vinyl path: check against known pressings dictionary
  if (category === "vinyl") {
    const match = findVinylMatch(rawName);
    if (match && match !== rawName) return { name: match, corrected: true };
    return { name: rawName, corrected: false };
  }

  // Defensive: too short to be meaningful
  if (!rawName || rawName.length < 4) return { name: rawName, corrected: false };

  // Skip figure/collectible names — too risky to match against book/manga titles.
  if (/\b(funko|pop\s*!|nendoroid|figur|statue|plush|keychain)\b/i.test(rawName)) {
    return { name: rawName, corrected: false };
  }

  const norm = normalise(rawName);

  // Fast-path: raw already contains a known title → no correction needed.
  for (const title of KNOWN_TITLES) {
    if (norm.includes(normalise(title))) {
      return { name: rawName, corrected: false };
    }
  }

  // Strip generic suffixes before distance comparison.
  const core = stripSuffixes(norm);
  if (core.length < 3) return { name: rawName, corrected: false };

  let bestTitle = "";
  let bestScore = Infinity;

  for (const title of KNOWN_TITLES) {
    const normTitle = normalise(title);
    const dist = levenshtein(core, normTitle);
    const threshold = Math.max(2, Math.ceil(normTitle.length * 0.25));
    const overlap = tokenOverlap(core, normTitle);

    // Match criteria: close edit distance OR substantial token overlap.
    if (dist > threshold && overlap < 0.5) continue;

    // Combined score — lower is better. Normalise dist so both signals are 0-1.
    const score = (dist / Math.max(normTitle.length, 1)) * 0.6 + (1 - overlap) * 0.4;
    if (score < bestScore) {
      bestScore = score;
      bestTitle = title;
    }
  }

  if (!bestTitle) return { name: rawName, corrected: false };

  const suffix = extractSuffix(rawName);
  const corrected = suffix ? `${bestTitle} ${suffix}` : bestTitle;
  return { name: corrected, corrected: true };
}
