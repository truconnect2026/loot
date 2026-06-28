import type { BatchValuation } from "./claude";

const SKIP_PARENS = new Set([
  "set",
  "box set",
  "manga",
  "hardcover",
  "paperback",
  "softcover",
  "omnibus",
  "collection",
  "illustrated",
  "anniversary",
  "deluxe",
  "complete series",
  "series",
  "graphic novel",
  "volume",
  "collector edition",
  "special edition",
]);

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the /, "");
}

function seriesKey(name: string): string | null {
  // Rule 1: Parenthetical series tag — "Title (Series Name)"
  const parenMatch = name.match(/^.+\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const inner = parenMatch[1].trim();
    const norm = normalizeKey(inner);
    if (norm.length > 0 && !SKIP_PARENS.has(norm)) return norm;
  }

  // Rule 2: "<Series> Vol/Volume/Book/# N"
  const volMatch = name.match(/^(.+?)\s+(?:vol(?:ume)?|book|#)\s*\.?\s*\d+/i);
  if (volMatch) {
    const k = normalizeKey(volMatch[1]);
    if (k.length >= 2) return k;
  }

  // Rule 3: name ends with "Manga Series" or "Series"
  const seriesEndMatch = name.match(/^(.+?)\s+(?:manga\s+)?series\s*$/i);
  if (seriesEndMatch) {
    const k = normalizeKey(seriesEndMatch[1]);
    if (k.length >= 2) return k;
  }

  // Rule 4: name ends with "(set)"
  const setEndMatch = name.match(/^(.+?)\s+\(set\)\s*$/i);
  if (setEndMatch) {
    const k = normalizeKey(setEndMatch[1]);
    if (k.length >= 2) return k;
  }

  return null;
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

    const buckets = new Map<string, number[]>();
    for (let i = 0; i < items.length; i++) {
      const k = keys[i];
      if (k === null) continue;
      const existing = buckets.get(k);
      if (existing) existing.push(i);
      else buckets.set(k, [i]);
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
        name: `${result[anchorIdx].name} (full set, ${n} vols)`,
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

    // Reorder: anchors/singles keep original positions; members follow their anchor
    const emitted = new Set<number>();
    const ordered: BatchValuation[] = [];

    for (let i = 0; i < result.length; i++) {
      if (emitted.has(i)) continue;
      const item = result[i];

      if (item.groupRole === "lot-member") continue; // emitted with anchor

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
