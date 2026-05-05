"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import BottomSheet from "@/components/shared/BottomSheet";
import type {
  ShelfScanItem,
  ShelfScanResult,
  ShelfScanPlatform,
} from "@/lib/claude";
import type { ListingResponse } from "@/app/api/listing/route";

/**
 * Shelf Scanner sheet — one photo in, ranked items out.
 *
 * Flow: idle → tap "take photo" → camera → loading → loaded.
 * The captured image stays in state so it can render as the thumbnail
 * at the top of the results — there's no on-image highlighting because
 * Claude vision doesn't return pixel coordinates.
 *
 * Cards collapse to a 2-line description + [name • verdict] + [cost /
 * sell / profit] cells. Tapping expands to show all three platforms'
 * net prices + a per-item GENERATE LISTING button. The sticky bottom
 * bar surfaces aggregate "X items to grab · est. +$Y" + a BATCH
 * LISTINGS CTA that fans out /api/listing calls for every BUY item.
 */

interface ShelfScanSheetProps {
  open: boolean;
  onClose: () => void;
  onPaywall?: (info: { used: number; limit: number }) => void;
  /** Refresh hook — caller uses this to bump the dashboard scan
   * counter after a successful shelf scan persists a row. */
  onScanned?: () => void;
}

type Status = "idle" | "loading" | "loaded" | "error";

interface ApiError {
  error?: string;
  scans_used?: number;
  scans_limit?: number;
}

type FilterKind = "ALL" | "BUY" | "MAYBE" | "PASS";

const VERDICT_TINT: Record<
  "BUY" | "MAYBE" | "PASS",
  { bg: string; border: string; text: string }
> = {
  BUY: {
    bg: "rgba(92, 224, 184, 0.15)",
    border: "rgba(92, 224, 184, 0.3)",
    text: "#5CE0B8",
  },
  MAYBE: {
    bg: "rgba(212, 165, 116, 0.15)",
    border: "rgba(212, 165, 116, 0.3)",
    text: "#D4A574",
  },
  PASS: {
    bg: "rgba(232, 99, 107, 0.15)",
    border: "rgba(232, 99, 107, 0.3)",
    text: "#E8636B",
  },
};

const FILTER_TINT: Record<FilterKind, { color: string; rgba: string }> = {
  ALL: { color: "#C8C0D8", rgba: "200, 192, 216" },
  BUY: { color: "#5CE0B8", rgba: "92, 224, 184" },
  MAYBE: { color: "#D4A574", rgba: "212, 165, 116" },
  PASS: { color: "#E8636B", rgba: "232, 99, 107" },
};

// Net-after-fee for each platform — surfaced in the platform comparison
// row inside expanded cards. Matches the fee schedule the model uses
// when picking bestPlatform.
function netForPlatform(item: ShelfScanItem, platform: ShelfScanPlatform): number {
  switch (platform) {
    case "FB Local":
      return item.sellFBLocal;
    case "FB Shipped":
      return item.sellFBShipped * 0.9;
    case "eBay":
      return item.sellEbay * 0.8675 - 0.3;
  }
}

// Brand colors for the destination-platform label under the SELL
// cell. Using each platform's recognizable color (FB blue, eBay
// red) means the user can scan vertically and pattern-match without
// reading the label. The shipped variant is a lighter blue so the
// two FB rows are still distinguishable side-by-side.
function platformColor(p: ShelfScanPlatform): string {
  switch (p) {
    case "FB Local":
      return "#1877F2";
    case "FB Shipped":
      return "#4A90D9";
    case "eBay":
      return "#E53238";
  }
}

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 0) return `-$${Math.abs(n).toFixed(0)}`;
  return n % 1 === 0 ? `$${n.toFixed(0)}` : `$${n.toFixed(0)}`;
}

// ────────────────────────────────────────────────────────────────
// localStorage cache — survives accidental sheet-close. The whole
// payload (items + base64 image) goes in a single JSON blob so reads
// are atomic. Quota errors (large images can blow past localStorage's
// ~5MB ceiling) and private-mode setItem failures are swallowed; we
// just won't cache that scan.
// ────────────────────────────────────────────────────────────────

const CACHE_KEY = "lastShelfScan";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedShelfScan {
  items: ShelfScanItem[];
  image: string | null;
  timestamp: number;
}

function readShelfCache(): CachedShelfScan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedShelfScan>;
    if (
      !Array.isArray(parsed.items) ||
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp > CACHE_TTL_MS
    ) {
      // Stale or malformed — evict so next read short-circuits.
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return {
      items: parsed.items,
      image: typeof parsed.image === "string" ? parsed.image : null,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

function writeShelfCache(
  items: ShelfScanItem[],
  image: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedShelfScan = {
      items,
      image,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // QuotaExceededError on big images, or private mode — silent.
    // The user still sees their scan; they just won't get the
    // reopen-without-rescanning shortcut.
  }
}

function clearShelfCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* private mode — silent */
  }
}

export default function ShelfScanSheet({
  open,
  onClose,
  onPaywall,
  onScanned,
}: ShelfScanSheetProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ShelfScanResult | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>("ALL");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Per-item generated listings, keyed by item index. The BATCH
  // LISTINGS button fills this map sequentially; tapping a single
  // item's GENERATE LISTING button fills its slot in isolation.
  const [listings, setListings] = useState<Map<number, ListingResponse>>(
    new Map(),
  );
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Bumped each time results render so BottomSheet snaps its scroll
  // back to the top — without this, a long previous scan's scroll
  // position leaks into the next results view (or the cached-on-open
  // hydration), and the first card lands clipped under the drag
  // handle.
  const [scrollResetKey, setScrollResetKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open hydration — check the 30-min localStorage cache first. If
  // there's a recent scan, jump straight to the loaded results view
  // (skipping the camera). Otherwise reset to idle. queueMicrotask
  // satisfies react-hooks/set-state-in-effect by deferring the state
  // writes past the synchronous effect body.
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      const cached = readShelfCache();
      // Per-item / batch state is always reset on open regardless of
      // cache hit — listings + expansion state are session-local.
      setErrorMsg(null);
      setFilter("ALL");
      setExpanded(new Set());
      setListings(new Map());
      setBatchProgress(null);
      if (cached) {
        setStatus("loaded");
        setResult({ items: cached.items });
        setThumbnail(cached.image);
        setScrollResetKey((k) => k + 1);
      } else {
        setStatus("idle");
        setResult(null);
        setThumbnail(null);
      }
    });
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setThumbnail(dataUrl);
      void runShelfScan(dataUrl);
    };
    reader.onerror = () => {
      setErrorMsg("Could not read image file");
      setStatus("error");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function runShelfScan(dataUrl: string) {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/shelf-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = (await res.json()) as ShelfScanResult | ApiError;
      if (!res.ok) {
        const err = data as ApiError;
        // 403 paywall — bubble up to the dashboard so it can swap in
        // its PaywallSheet with the right "X/5 used" label.
        if (
          res.status === 403 &&
          typeof err.scans_used === "number" &&
          typeof err.scans_limit === "number" &&
          onPaywall
        ) {
          onPaywall({ used: err.scans_used, limit: err.scans_limit });
          onClose();
          return;
        }
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }
      const fresh = data as ShelfScanResult;
      setResult(fresh);
      setStatus("loaded");
      setScrollResetKey((k) => k + 1);
      // Persist so an accidental sheet-close doesn't burn the user's
      // scan quota — they can reopen the sheet within 30 min and
      // pick up where they left off.
      writeShelfCache(fresh.items, dataUrl);
      onScanned?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function toggleExpanded(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  // Discards the cached scan and bounces the sheet back to idle so
  // the user can take a new photo. Doesn't auto-trigger the file
  // picker — that would feel surprising; the next tap on "tap to
  // take photo" stays explicit.
  function handleNewScan() {
    clearShelfCache();
    setStatus("idle");
    setErrorMsg(null);
    setResult(null);
    setThumbnail(null);
    setFilter("ALL");
    setExpanded(new Set());
    setListings(new Map());
    setBatchProgress(null);
  }

  async function generateListingFor(idx: number, item: ShelfScanItem) {
    if (listings.has(idx)) return;
    try {
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: item.name,
          sellPrice: Math.max(item.sellFBLocal, item.sellFBShipped, item.sellEbay),
          reasoning: item.description,
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as ListingResponse;
      setListings((prev) => {
        const next = new Map(prev);
        next.set(idx, json);
        return next;
      });
    } catch {
      /* swallow — single-item failures don't surface a banner */
    }
  }

  async function batchGenerate() {
    if (!result) return;
    const buyIndices = result.items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.verdict === "BUY")
      .map(({ i }) => i);
    if (buyIndices.length === 0) return;

    setBatchProgress({ current: 0, total: buyIndices.length });
    for (let n = 0; n < buyIndices.length; n++) {
      const idx = buyIndices[n];
      const item = result.items[idx];
      // Skip ones the user already generated individually so the bar
      // doesn't pay for a duplicate Claude call.
      if (!listings.has(idx)) {
        // Sequential, not parallel — Claude rate limits more
        // aggressively when a burst of identical-shaped requests
        // arrives, and the per-item progress UI requires sequencing
        // anyway.
        await generateListingFor(idx, item);
      }
      setBatchProgress({ current: n + 1, total: buyIndices.length });
      // Auto-expand each item as it completes so the user can scroll
      // through the listings without tapping each card.
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    }
    // Hold the "X/X done" state for a beat then clear so the bar
    // returns to the aggregate label.
    window.setTimeout(() => setBatchProgress(null), 1200);
  }

  // ── Rendering ──────────────────────────────────────────────────

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      borderColor="#5CE0B8"
      scrollResetKey={scrollResetKey}
    >
      {/* Min-height shim — keeps the sheet from collapsing to a thin
          strip when the content is short. Idle/loading/error states
          have ~120px of intrinsic content, which left the "tap to
          take photo" button hugging the bottom edge of a barely-
          visible sheet on tall viewports. 40vh gives the camera
          prompt room to breathe; 85vh on loaded fills the screen so
          the cards have proper scroll territory (BottomSheet caps at
          85vh anyway, so this just guarantees we hit the cap). */}
      <div
        style={{
          minHeight:
            status === "loaded" ? "85vh" : "40vh",
        }}
      >
      <div
        style={{
          padding: "12px 18px 0",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 9,
            color: "#5CE0B8",
            letterSpacing: "0.14em",
            marginBottom: 4,
          }}
        >
          SHELF SCANNER
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "rgba(255,255,255,0.62)",
            lineHeight: 1.4,
            marginBottom: 14,
          }}
        >
          snap a shelf — Claude ranks every visible item by profit
        </div>

        {status === "idle" && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              height: 96,
              borderRadius: 14,
              backgroundColor: "#120e18",
              backgroundImage:
                "linear-gradient(rgba(92,224,184,0.10), rgba(92,224,184,0.04))",
              border: "1px dashed rgba(92,224,184,0.40)",
              color: "var(--ui-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <CameraGlyph />
            <span>tap to take photo</span>
            {/* Expectation-setting hint — sets the user up for a
                successful first scan. Loose clothing or messy piles
                give the model nothing to hook on; spines, tools, and
                housewares all have crisp identifying features. */}
            <span
              style={{
                marginTop: 8,
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 400,
                color: "#3D2E55",
                textAlign: "center",
              }}
            >
              works best with book spines, tools, or housewares
            </span>
          </button>
        )}

        {status === "loading" && (
          <LoadingView thumbnail={thumbnail} />
        )}

        {status === "error" && errorMsg && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(232,99,107,0.85)",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      {status === "loaded" && result && (
        <ResultsView
          result={result}
          thumbnail={thumbnail}
          filter={filter}
          onFilter={setFilter}
          expanded={expanded}
          onToggleExpanded={toggleExpanded}
          listings={listings}
          onGenerate={generateListingFor}
          onBatch={batchGenerate}
          batchProgress={batchProgress}
          onNewScan={handleNewScan}
        />
      )}
      </div>
    </BottomSheet>
  );
}

// ────────────────────────────────────────────────────────────────
// Loading state — keeps the thumbnail visible (already captured
// before the API call) so the user has something to look at while
// Claude works.
// ────────────────────────────────────────────────────────────────

function LoadingView({ thumbnail }: { thumbnail: string | null }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      {thumbnail && (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxHeight: 130,
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt="captured shelf"
            style={{
              width: "100%",
              maxHeight: 130,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 60%, rgba(18,14,24,0.8) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "rgba(255,255,255,0.62)",
          letterSpacing: "0.02em",
        }}
      >
        Analyzing shelf…
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Loaded state — thumbnail + filter pills + summary + cards +
// sticky action bar. Wrapped in a positioned container because the
// sticky bar relies on the BottomSheet's internal scroll context.
// ────────────────────────────────────────────────────────────────

interface ResultsViewProps {
  result: ShelfScanResult;
  thumbnail: string | null;
  filter: FilterKind;
  onFilter: (f: FilterKind) => void;
  expanded: Set<number>;
  onToggleExpanded: (i: number) => void;
  listings: Map<number, ListingResponse>;
  onGenerate: (i: number, item: ShelfScanItem) => void;
  onBatch: () => void;
  batchProgress: { current: number; total: number } | null;
  /** Discards the cached scan and bounces back to the camera prompt. */
  onNewScan: () => void;
}

function ResultsView({
  result,
  thumbnail,
  filter,
  onFilter,
  expanded,
  onToggleExpanded,
  listings,
  onGenerate,
  onBatch,
  batchProgress,
  onNewScan,
}: ResultsViewProps) {
  const counts = {
    ALL: result.items.length,
    BUY: result.items.filter((i) => i.verdict === "BUY").length,
    MAYBE: result.items.filter((i) => i.verdict === "MAYBE").length,
    PASS: result.items.filter((i) => i.verdict === "PASS").length,
  };

  const visible =
    filter === "ALL"
      ? result.items
      : result.items.filter((i) => i.verdict === filter);

  const buyTotal = result.items
    .filter((i) => i.verdict === "BUY")
    .reduce((s, i) => s + i.profit, 0);

  return (
    <>
      <div
        style={{
          padding: "0 18px",
          // Bottom padding accounts for the sticky bar so the last
          // card isn't hidden behind it when scrolled to the end.
          paddingBottom: counts.BUY > 0 ? 80 : 24,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* New-scan affordance — pinned above the thumbnail so it's
            visible the moment the sheet opens (cached or fresh). Tap
            evicts the localStorage cache and returns to the camera
            prompt. The button stays even on a just-completed fresh
            scan because the cache write happens immediately on
            success — without this row, the next open would replay
            the same scan instead of starting clean. */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 10,
          }}
        >
          <button
            type="button"
            onClick={onNewScan}
            style={{
              height: 28,
              padding: "0 12px",
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#C8C0D8",
              fontFamily: "var(--font-label)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.10em",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshGlyph />
            NEW SCAN
          </button>
        </div>

        {/* Thumbnail — readonly reference photo. No bounding boxes
            because Claude vision doesn't return pixel coords. */}
        {thumbnail && (
          <div
            style={{
              position: "relative",
              width: "100%",
              maxHeight: 130,
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt="scanned shelf"
              style={{
                width: "100%",
                maxHeight: 130,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 60%, rgba(18,14,24,0.8) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
          className="loot-carousel"
        >
          {(["ALL", "BUY", "MAYBE", "PASS"] as FilterKind[]).map((f) => (
            <FilterPill
              key={f}
              kind={f}
              count={counts[f]}
              active={filter === f}
              onTap={() => onFilter(f)}
            />
          ))}
        </div>

        {/* Summary line — counts plus the headline profit number in
            mint. Putting the dollar amount inline (vs. burying it in
            the sticky bar only) lets the user clock the upside the
            instant the results render, before the eye drops to the
            cards. */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "#C8C0D8",
            marginBottom: 12,
          }}
        >
          {counts.ALL} item{counts.ALL === 1 ? "" : "s"}
          {" · "}
          <span style={{ color: counts.BUY > 0 ? "#5CE0B8" : "#5A4E70" }}>
            {counts.BUY} grab{counts.BUY === 1 ? "" : "s"}
          </span>
          {counts.BUY > 0 && (
            <>
              {" · "}
              <span style={{ color: "#5CE0B8" }}>
                est. +{fmtMoney(buyTotal)} profit
              </span>
            </>
          )}
        </div>

        {/* Item cards */}
        {visible.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            no items in this filter
          </div>
        ) : (
          visible.map((item) => {
            const realIdx = result.items.indexOf(item);
            return (
              <ItemCard
                key={realIdx}
                item={item}
                expanded={expanded.has(realIdx)}
                onToggle={() => onToggleExpanded(realIdx)}
                listing={listings.get(realIdx) ?? null}
                onGenerate={() => onGenerate(realIdx, item)}
              />
            );
          })
        )}
      </div>

      {/* Sticky action bar — only when there are BUY items to act on */}
      {counts.BUY > 0 && (
        <StickyActionBar
          buyCount={counts.BUY}
          buyTotal={buyTotal}
          onBatch={onBatch}
          batchProgress={batchProgress}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Filter pill — single-select. Active uses the verdict's accent
// color at 15% bg / 30% border / full text; inactive is a muted
// hairline chip in the page muted-text color.
// ────────────────────────────────────────────────────────────────

function FilterPill({
  kind,
  count,
  active,
  onTap,
}: {
  kind: FilterKind;
  count: number;
  active: boolean;
  onTap: () => void;
}) {
  const tint = FILTER_TINT[kind];
  const label =
    kind === "ALL"
      ? `All (${count})`
      : `${kind} (${count})`;

  // The unselected BUY pill gets a subtle mint tint to draw the
  // user's finger to the "show me what to grab" filter without
  // demanding attention the way the active state does. Other
  // unselected pills stay transparent / muted-text. Active state is
  // identical across kinds (15% bg / 30% border / full text color).
  const isUnselectedBuy = !active && kind === "BUY";

  const bg = active
    ? `rgba(${tint.rgba}, 0.15)`
    : isUnselectedBuy
      ? "rgba(92, 224, 184, 0.06)"
      : "transparent";
  const border = active
    ? `1px solid rgba(${tint.rgba}, 0.30)`
    : isUnselectedBuy
      ? "1px solid rgba(92, 224, 184, 0.15)"
      : "1px solid rgba(255,255,255,0.08)";
  const color = active
    ? tint.color
    : isUnselectedBuy
      ? "rgba(92, 224, 184, 0.60)"
      : "#5A4E70";

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        flexShrink: 0,
        height: 28,
        padding: "0 14px",
        borderRadius: 20,
        backgroundColor: bg,
        border,
        color,
        fontFamily: "var(--font-label)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "background-color 120ms ease-out, color 120ms ease-out",
      }}
    >
      {label.toUpperCase()}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────
// Item card — collapsed by default, expands on tap. The expand
// reveals the platform comparison row + confidence + per-item
// listing CTA. Animation is max-height transition; we cap it at
// 800px which is well above any realistic content height.
// ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: ShelfScanItem;
  expanded: boolean;
  onToggle: () => void;
  listing: ListingResponse | null;
  onGenerate: () => void;
}

function ItemCard({
  item,
  expanded,
  onToggle,
  listing,
  onGenerate,
}: ItemCardProps) {
  const tint = VERDICT_TINT[item.verdict];
  const isBuy = item.verdict === "BUY";
  const isMaybe = item.verdict === "MAYBE";
  const isPass = item.verdict === "PASS";

  // Verdict-driven colors. PASS profit is no longer "red if negative"
  // — it's red regardless, because the verdict itself already conveys
  // "skip this." Decoupling color from sign keeps the visual language
  // crisp: mint = grab, camel = consider, red = skip.
  const profitColor = isBuy ? "#5CE0B8" : isMaybe ? "#D4A574" : "#E8636B";
  const accentColor = isBuy ? "#5CE0B8" : isMaybe ? "#D4A574" : "#E8636B";

  // PASS cards collapse to a single name+pill row by default — they
  // recede so the user's eye lands on BUY/MAYBE first. The body
  // border drops to a near-invisible hairline on PASS as part of
  // the same recede.
  const passCollapsed = isPass && !expanded;

  // Per-side border styling: 3px accent stripe on the left (except
  // PASS, which stays subtle), hairline on the other three sides.
  // BUY bumps the body border from 0.15 → 0.2 for a touch more tint;
  // PASS drops to 0.08 to fade.
  const sideBorderColor = isPass
    ? "rgba(232, 99, 107, 0.08)"
    : isBuy
      ? "rgba(92, 224, 184, 0.20)"
      : tint.bg;

  const sellPrice =
    item.bestPlatform === "FB Local"
      ? item.sellFBLocal
      : item.bestPlatform === "FB Shipped"
        ? item.sellFBShipped
        : item.sellEbay;

  return (
    <div
      onClick={onToggle}
      style={{
        backgroundColor: "rgba(23, 18, 42, 0.8)",
        borderTop: `1px solid ${sideBorderColor}`,
        borderRight: `1px solid ${sideBorderColor}`,
        borderBottom: `1px solid ${sideBorderColor}`,
        // Left accent stripe — 3px solid for BUY/MAYBE so the verdict
        // is readable peripherally; PASS keeps the same hairline as
        // its other sides so it visually recedes.
        borderLeft: isPass
          ? `1px solid ${sideBorderColor}`
          : `3px solid ${accentColor}`,
        // Subtle mint glow on BUY only — at 0.06 it's barely
        // perceptible against the dark surface, just enough to draw
        // peripheral attention. Stronger on MAYBE/PASS would compete.
        boxShadow: isBuy
          ? "0 0 12px rgba(92, 224, 184, 0.06)"
          : "none",
        borderRadius: 14,
        // Tighter vertical padding when PASS is collapsed (~48px row);
        // standard padding 14 once expanded so the inner stats grid
        // doesn't crowd.
        padding: passCollapsed ? "12px 14px" : 14,
        marginBottom: 10,
        cursor: "pointer",
        transition: "border-color 150ms ease-out",
      }}
    >
      {/* TOP ROW — name + verdict */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "var(--font-body)",
            // PASS collapsed: smaller (13) and dimmed text so the
            // whole row reads as receded. Expanded matches BUY/MAYBE.
            fontSize: passCollapsed ? 13 : 15,
            fontWeight: 600,
            color: passCollapsed ? "#5A4E70" : "#C8C0D8",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: "4px 12px",
            borderRadius: 20,
            backgroundColor: tint.bg,
            border: `1px solid ${tint.border}`,
            color: tint.text,
            fontFamily: "var(--font-label)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {item.verdict}
        </div>
      </div>

      {/* MIDDLE ROW — cost / sell / profit cells. Skipped on PASS
          when collapsed so the row reads as a single 48px line. */}
      {!passCollapsed && (
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
        }}
      >
        <StatCell
          label="COST"
          value={fmtMoney(item.cost)}
          color="#C8C0D8"
        />
        <StatCell
          label="SELL"
          value={fmtMoney(sellPrice)}
          color="#C8C0D8"
          subLabel={<PlatformLabel platform={item.bestPlatform} />}
        />
        <StatCell
          label="PROFIT"
          value={fmtMoney(item.profit)}
          color={profitColor}
          emphasized={isBuy}
        />
      </div>
      )}

      {/* BOTTOM ROW — description (collapsed). PASS hides this in
          collapsed mode (no description on the 48px row); the full
          description shows up inside the expansion below. */}
      {!passCollapsed && !expanded && item.description && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#5A4E70",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.description}
        </div>
      )}

      {/* EXPANSION — full description + platform comparison + cta */}
      <div
        style={{
          maxHeight: expanded ? 800 : 0,
          overflow: "hidden",
          transition: "max-height 300ms ease",
        }}
      >
        {expanded && (
          <div style={{ marginTop: 8 }}>
            {item.description && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#5A4E70",
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                {item.description}
              </div>
            )}

            {/* Platform comparison */}
            <div
              style={{
                fontFamily: "var(--font-label)",
                fontSize: 8,
                color: "#5A4E70",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Platform comparison (net)
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <PlatformCell
                label="FB LOCAL"
                value={netForPlatform(item, "FB Local")}
                highlight={item.bestPlatform === "FB Local"}
              />
              <PlatformCell
                label="FB SHIP"
                value={netForPlatform(item, "FB Shipped")}
                highlight={item.bestPlatform === "FB Shipped"}
              />
              <PlatformCell
                label="EBAY"
                value={netForPlatform(item, "eBay")}
                highlight={item.bestPlatform === "eBay"}
              />
            </div>

            {/* Confidence + listing CTA row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <ConfidenceBadge level={item.confidence} />
              {!listing && item.verdict !== "PASS" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerate();
                  }}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 8,
                    backgroundColor: "transparent",
                    border: "1px solid rgba(92, 224, 184, 0.2)",
                    color: "#5CE0B8",
                    fontFamily: "var(--font-label)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  GENERATE LISTING
                </button>
              )}
            </div>

            {/* Per-item listing panel — copy-clipboard, no fancy
                accordion. Mirrors the VerdictSheet listing panel. */}
            {listing && (
              <ListingPanel listing={listing} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
  subLabel,
  emphasized,
}: {
  label: string;
  value: string;
  color: string;
  /** Accepts a ReactNode so callers can pass styled platform labels
   * (colored dot + brand-color text) and not just gray strings. */
  subLabel?: ReactNode;
  /** Bumps the value to 20px / 800 — used on the PROFIT cell of BUY
   * cards so the profit number screams visually heavier than COST
   * and SELL beside it. */
  emphasized?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "rgba(18, 14, 24, 0.6)",
        borderRadius: 8,
        padding: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 8,
          color: "#5A4E70",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: emphasized ? 20 : 16,
          fontWeight: emphasized ? 800 : 700,
          color,
          fontFeatureSettings: '"tnum"',
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {subLabel && (
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 8,
            color: "#5A4E70",
            marginTop: 2,
          }}
        >
          {subLabel}
        </div>
      )}
    </div>
  );
}

// Colored platform pip + brand-color label. Renders inside the SELL
// cell's subLabel slot so users can scan the bestPlatform column
// vertically and pattern-match the destination platform without
// reading text.
function PlatformLabel({ platform }: { platform: ShelfScanPlatform }) {
  const color = platformColor(platform);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color, // overrides the inherited #5A4E70 on the wrapper
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      {platform}
    </span>
  );
}

function PlatformCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "rgba(18, 14, 24, 0.6)",
        borderRadius: 8,
        padding: 8,
        textAlign: "center",
        border: highlight
          ? "1px solid rgba(92, 224, 184, 0.30)"
          : "1px solid transparent",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 7,
          color: "#5A4E70",
          letterSpacing: "0.10em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 13,
          fontWeight: 700,
          color: highlight ? "#5CE0B8" : "#C8C0D8",
          fontFeatureSettings: '"tnum"',
          marginTop: 2,
        }}
      >
        {fmtMoney(value)}
      </div>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: "HIGH" | "MEDIUM" | "LOW" }) {
  const color =
    level === "HIGH" ? "#5CE0B8" : level === "MEDIUM" ? "#D4A574" : "#E8636B";
  return (
    <span
      style={{
        fontFamily: "var(--font-label)",
        fontSize: 9,
        fontWeight: 700,
        color,
        letterSpacing: "0.08em",
      }}
    >
      {level} CONFIDENCE
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// Listing panel — drops in below an item card after generation.
// Compact variant of VerdictSheet's listing block; the COPY button
// flips to "COPIED" for 2s on success.
// ────────────────────────────────────────────────────────────────

function ListingPanel({ listing }: { listing: ListingResponse }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        `${listing.title}\n\n${listing.description}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unsupported in non-secure contexts */
    }
  }
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: 12,
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 8,
          letterSpacing: "0.10em",
          color: "#5A4E70",
          marginBottom: 6,
        }}
      >
        FB MARKETPLACE LISTING
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 13,
          color: "#C8C0D8",
          marginBottom: 6,
        }}
      >
        {listing.title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "#5A4E70",
          whiteSpace: "pre-wrap",
          lineHeight: 1.45,
          marginBottom: 10,
        }}
      >
        {listing.description}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 11,
            color: "#5CE0B8",
            fontFeatureSettings: '"tnum"',
          }}
        >
          {fmtMoney(listing.suggestedPrice)}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            height: 28,
            padding: "0 12px",
            borderRadius: 6,
            backgroundColor: copied
              ? "rgba(92,224,184,0.10)"
              : "rgba(255,255,255,0.04)",
            border: copied
              ? "1px solid rgba(92,224,184,0.25)"
              : "1px solid rgba(255,255,255,0.08)",
            color: copied ? "#5CE0B8" : "#C8C0D8",
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: "0.10em",
            cursor: "pointer",
          }}
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Sticky action bar — sits at the foot of the BottomSheet's scroll
// area. Backdrop-blur surfacing matches the dashboard header on
// scroll. Hidden when there are no BUY items to act on.
// ────────────────────────────────────────────────────────────────

function StickyActionBar({
  buyCount,
  buyTotal,
  onBatch,
  batchProgress,
}: {
  buyCount: number;
  buyTotal: number;
  onBatch: () => void;
  batchProgress: { current: number; total: number } | null;
}) {
  const inProgress = batchProgress !== null;
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        backgroundColor: "rgba(18, 14, 24, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(92, 224, 184, 0.1)",
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "#5CE0B8",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {buyCount} item{buyCount === 1 ? "" : "s"} to grab · est. +
        {fmtMoney(buyTotal)}
      </div>
      <button
        type="button"
        onClick={onBatch}
        disabled={inProgress}
        style={{
          flexShrink: 0,
          height: 36,
          padding: "0 14px",
          borderRadius: 10,
          background: inProgress
            ? "rgba(92,224,184,0.06)"
            : "linear-gradient(180deg, rgba(92,224,184,0.18) 0%, rgba(92,224,184,0.08) 100%)",
          border: "1px solid rgba(92,224,184,0.25)",
          boxShadow: inProgress
            ? "none"
            : "inset 0 1px 0 0 rgba(92,224,184,0.20), 0 0 16px -4px rgba(92,224,184,0.30)",
          color: "#5CE0B8",
          fontFamily: "var(--font-label)",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.10em",
          cursor: inProgress ? "default" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <LightningBolt />
        {inProgress
          ? `GENERATING ${batchProgress.current}/${batchProgress.total}…`
          : "BATCH LISTINGS"}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Glyphs
// ────────────────────────────────────────────────────────────────

function CameraGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

function LightningBolt() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function RefreshGlyph() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
