import type { BatchValuation } from "./claude";

// Parenthetical content that is NOT a series name.
// When blocked, we fall through and derive the key from the text before the paren.
const GENERIC_PAREN_PHRASES = new Set([
  // generic quantity / format
  "set", "box set", "complete", "complete set", "collection", "omnibus",
  "multiple", "multiple volumes",
  // format/edition
  "manga", "hardcover", "paperback", "softcover", "graphic novel",
  "illustrated", "anniversary", "deluxe", "series", "complete series",
  "collector edition", "special edition", "volume", "vol",
  // subject descriptors
  "anime", "anime character",
  // bare color words
  "red", "black", "blue", "white", "green", "pink", "purple", "gold", "silver",
]);

function isGenericParenContent(norm: string): boolean {
  if (GENERIC_PAREN_PHRASES.has(norm)) return true;
  // "vol N", "volume N", "book N" with trailing number
  if (/^(?:vol(?:ume)?|book)\s*\d+$/.test(norm)) return true;
  return false;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the /, "");
}

// Strip "..." or "…" and any content between it and the next ")" or end of string.
// e.g. "(Mortal Instrum...)" → "(Mortal Instrum)" so the paren closes cleanly.
function stripTruncation(name: string): string {
  return name.replace(/(?:\.{3}|…)[^)]*(\)|$)/g, "$1").trim();
}

// Derive key from a plain text string (no parens) using Vol/Series/Set rules.
function keyFromBase(text: string): string | null {
  // "Series Vol N" / "Book N" / "# N"
  const volMatch = text.match(/^(.+?)\s+(?:vol(?:ume)?|book|#)\s*\.?\s*\d+/i);
  if (volMatch) {
    const k = normalizeKey(volMatch[1]);
    if (k.length >= 2) return k;
  }
  // Ends with "Manga Series" or "Series"
  const seriesMatch = text.match(/^(.+?)\s+(?:manga\s+)?series\s*$/i);
  if (seriesMatch) {
    const k = normalizeKey(seriesMatch[1]);
    if (k.length >= 2) return k;
  }
  // Ends with "(set)"
  const setMatch = text.match(/^(.+?)\s+\(set\)\s*$/i);
  if (setMatch) {
    const k = normalizeKey(setMatch[1]);
    if (k.length >= 2) return k;
  }
  return null;
}

function seriesKey(rawName: string): string | null {
  const name = stripTruncation(rawName);

  // Rule 1: Parenthetical — "Title (Series Name)"
  const parenMatch = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const beforeParen = parenMatch[1].trim();
    const inner = parenMatch[2].trim();
    const norm = normalizeKey(inner);

    if (norm.length > 0 && !isGenericParenContent(norm)) {
      return norm; // paren is a real series tag
    }
    // Paren is generic — derive from text before the paren
    const fromBase = keyFromBase(beforeParen);
    if (fromBase !== null) return fromBase;
    // Fall through to rules on the full name
  }

  // Rules 2-4 on the full truncation-stripped name
  return keyFromBase(name);
}

// Merge shorter keys that are pure prefixes of longer keys into the longer key.
// Minimum prefix length: 4 chars. Prevents short stop-words from over-merging.
function foldPrefixKeys(buckets: Map<string, number[]>): void {
  // Sort longest-first so longer keys are always at lower indices
  const keys = [...buckets.keys()].sort((a, b) => b.length - a.length);

  // Iterate from shortest (end) toward longest (start)
  for (let i = keys.length - 1; i >= 0; i--) {
    const shorter = keys[i];
    if (shorter.length < 4) continue;
    if (!buckets.has(shorter)) continue; // already merged in a prior step

    for (let j = 0; j < i; j++) {
      const longer = keys[j];
      if (!buckets.has(longer)) continue;
      if (longer.startsWith(shorter)) {
        // shorter is a character-level prefix of longer — merge
        const shortItems = buckets.get(shorter)!;
        const longItems = buckets.get(longer)!;
        for (const idx of shortItems) longItems.push(idx);
        buckets.delete(shorter);
        break;
      }
    }
  }
}

// Known series → proper display name. Falls back to title-case of the key.
const SERIES_PROPER_CASE: Record<string, string> = {
  "mortal instruments": "The Mortal Instruments",
  "infernal devices": "The Infernal Devices",
  "dark artifices": "The Dark Artifices",
  "last hours": "The Last Hours",
  "shadowhunter chronicles": "Shadowhunter Chronicles",
  "bridgerton": "Bridgerton",
  "one piece": "One Piece",
  "sailor moon": "Sailor Moon",
  "soul eater": "Soul Eater",
  "naruto": "Naruto",
  "dragon ball": "Dragon Ball",
  "fullmetal alchemist": "Fullmetal Alchemist",
  "attack on titan": "Attack on Titan",
  "harry potter": "Harry Potter",
  "hunger games": "The Hunger Games",
  "divergent": "Divergent",
  "maze runner": "The Maze Runner",
  "percy jackson": "Percy Jackson",
  "wheel of time": "The Wheel of Time",
  "witcher": "The Witcher",
  "discworld": "Discworld",
};

function anchorDisplayName(groupId: string, n: number): string {
  const proper =
    SERIES_PROPER_CASE[groupId] ??
    groupId.replace(/\b\w/g, (c) => c.toUpperCase());
  return `${proper} — ${n} vols`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function groupSeries(items: BatchValuation[]): BatchValuation[] {
  if (items.length === 0) return items;

  try {
    const keys = items.map((it) => seriesKey(it.name ?? ""));

    // Log derived key per item
    for (let i = 0; i < items.length; i++) {
      console.log(
        `[GROUP] "${items[i].name}" -> key=${keys[i] === null ? "null" : `"${keys[i]}"`}`,
      );
    }

    const buckets = new Map<string, number[]>();
    for (let i = 0; i < items.length; i++) {
      const k = keys[i];
      if (k === null) continue;
      const existing = buckets.get(k);
      if (existing) existing.push(i);
      else buckets.set(k, [i]);
    }

    // Fold prefix keys (e.g. "mortal in" → "mortal instruments")
    foldPrefixKeys(buckets);

    // Log each bucket after folding
    for (const [k, indices] of buckets) {
      console.log(`[GROUP] bucket "${k}": ${indices.length} items`);
    }

    // Only groups of 3+ become lots
    const lots = new Map<string, number[]>();
    for (const [k, indices] of buckets) {
      if (indices.length >= 3) lots.set(k, indices);
    }

    if (lots.size === 0) return items;

    const result: BatchValuation[] = items.map((it) => ({ ...it }));

    for (const [groupId, indices] of lots) {
      // Anchor = member with highest individual estResale
      let anchorIdx = indices[0];
      for (const i of indices) {
        if (result[i].estResale > result[anchorIdx].estResale) anchorIdx = i;
      }

      const allResales = indices.map((i) => result[i].estResale);
      const med = median(allResales);
      const sumAll = allResales.reduce((s, v) => s + v, 0);
      const anchorResale = result[anchorIdx].estResale;

      // Use anchor price if it already looks like a lot price; otherwise sum
      const lotPrice =
        anchorResale > 0 && anchorResale >= 1.8 * med
          ? Math.max(anchorResale, sumAll)
          : sumAll;

      const scale = anchorResale > 0 ? lotPrice / anchorResale : 1;
      const n = indices.length;

      result[anchorIdx] = {
        ...result[anchorIdx],
        name: anchorDisplayName(groupId, n),
        groupId,
        groupRole: "lot-anchor",
        estResale: Math.round(lotPrice * 100) / 100,
        sellPrice: Math.round(lotPrice * 100) / 100,
        resaleLow: Math.round(result[anchorIdx].resaleLow * scale),
        resaleHigh: Math.round(result[anchorIdx].resaleHigh * scale),
        verdict: lotPrice >= 30 ? "BUY" : "MAYBE",
      };

      for (const i of indices) {
        if (i === anchorIdx) continue;
        result[i] = { ...result[i], groupId, groupRole: "lot-member" };
      }
    }

    const anchorCount = [...lots.values()].length;
    const memberCount = [...lots.values()].reduce((s, idx) => s + idx.length - 1, 0);
    console.log(`[GROUP] anchors=${anchorCount} members=${memberCount}`);

    // Reorder: anchors/singles keep original positions; members follow their anchor
    const emitted = new Set<number>();
    const ordered: BatchValuation[] = [];

    for (let i = 0; i < result.length; i++) {
      if (emitted.has(i)) continue;
      const item = result[i];

      if (item.groupRole === "lot-member") continue; // will be emitted with anchor

      emitted.add(i);
      ordered.push(item);

      if (item.groupRole === "lot-anchor" && item.groupId) {
        const gid = item.groupId;
        for (let j = 0; j < result.length; j++) {
          if (
            !emitted.has(j) &&
            result[j].groupId === gid &&
            result[j].groupRole === "lot-member"
          ) {
            emitted.add(j);
            ordered.push(result[j]);
          }
        }
      }
    }

    // Safety net: emit any orphaned items
    for (let i = 0; i < result.length; i++) {
      if (!emitted.has(i)) ordered.push(result[i]);
    }

    return ordered;
  } catch {
    return items;
  }
}
