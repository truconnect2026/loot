"use client";

import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import { CHAIN_PATTERNS } from "@/lib/sourcingPatterns";
import BottomSheet from "@/components/shared/BottomSheet";
import { SourcingSkeleton } from "@/components/shared/PageSkeleton";
import FlipCoyote from "@/components/shared/FlipCoyote";
import { FlipBubble } from "@/components/shared/FlipBubble";
import { EmptyState } from "@/components/ui/EmptyState";
import { useReducedMotion } from "@/lib/useReducedMotion";

// ── Local types (mirror lib/sourcingPlan.ts shapes) ─────────────────────────
interface StoreRecord {
  id: string;
  name: string;
  chain: string;
  location_label: string | null;
}

interface DayEntry {
  store: StoreRecord;
  label: string;
  confidence: "pattern" | "confirmed" | "unknown";
}

interface DayPlan {
  date: string;    // "YYYY-MM-DD"
  weekday: number; // 0–6
  entries: DayEntry[];
}

interface PlanData {
  weekPlan: DayPlan[];
  bestStop: DayEntry | null;
}

// ── Brand + display constants ────────────────────────────────────────────────
const MINT = "#5CE0B8";
const BG   = "#070510";

const DAY_LETTER  = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const CHAIN_OPTIONS = ["Goodwill", "Savers", "Value Village", "other"] as const;
type Chain = (typeof CHAIN_OPTIONS)[number];

// Field label — mono, uppercase, at the readable contrast floor.
const AS_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-space-mono, monospace)",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  marginBottom: 8,
};

const CHAIN_COLOR: Record<string, { bg: string; text: string }> = {
  Goodwill:        { bg: "rgba(92,224,184,0.10)",  text: "#5CE0B8" },
  Savers:          { bg: "rgba(245,197,24,0.10)",  text: "#F5C518" },
  "Value Village": { bg: "rgba(107,70,193,0.15)",  text: "#9B7EE8" },
  other:           { bg: "rgba(255,255,255,0.06)", text: "#6b7280" },
};

// ── Small sub-components ─────────────────────────────────────────────────────
function ChainBadge({ chain }: { chain: string }) {
  const c = CHAIN_COLOR[chain] ?? CHAIN_COLOR.other!;
  return (
    <span style={{
      fontFamily: "var(--font-label, monospace)",
      fontSize: 9, letterSpacing: "0.10em",
      padding: "2px 8px", borderRadius: 999,
      background: c.bg, color: c.text,
      textTransform: "uppercase",
      flexShrink: 0,
    }}>
      {chain}
    </span>
  );
}

function ConfidencePill({ confidence }: { confidence: "pattern" | "confirmed" | "unknown" }) {
  if (confidence === "confirmed") {
    return (
      <span style={{
        fontFamily: "var(--font-label, monospace)",
        fontSize: 8, letterSpacing: "0.10em",
        padding: "2px 9px", borderRadius: 999,
        background: "rgba(92,224,184,0.12)",
        border: "1px solid rgba(92,224,184,0.25)",
        color: MINT, textTransform: "uppercase",
      }}>confirmed</span>
    );
  }
  return (
    <span style={{
      fontFamily: "var(--font-label, monospace)",
      fontSize: 8, letterSpacing: "0.07em",
      padding: "2px 9px", borderRadius: 999,
      background: "rgba(212,165,116,0.08)",
      border: "1px solid rgba(212,165,116,0.20)",
      color: "#D4A574", textTransform: "uppercase",
    }}>typical · verify in store</span>
  );
}

// Group same-store entries for a day into one card (multiple patterns → bullet list).
interface StoreCard {
  store: StoreRecord;
  labels: string[];
  confidence: "pattern" | "confirmed" | "unknown";
}

function groupEntries(entries: DayEntry[]): StoreCard[] {
  const map = new Map<string, StoreCard>();
  for (const e of entries) {
    if (e.confidence === "unknown") continue;
    const ex = map.get(e.store.id);
    if (ex) {
      ex.labels.push(e.label);
      if (e.confidence === "confirmed") ex.confidence = "confirmed";
    } else {
      map.set(e.store.id, { store: e.store, labels: [e.label], confidence: e.confidence });
    }
  }
  return [...map.values()];
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SourcingPage() {
  const [plan,       setPlan]       = useState<PlanData | null>(null);
  const [stores,     setStores]     = useState<StoreRecord[]>([]);
  const [selDay,     setSelDay]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [authErr,    setAuthErr]    = useState(false);
  const [managing,   setManaging]   = useState(false);
  const [addOpen,    setAddOpen]    = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newChain,   setNewChain]   = useState<Chain>("Goodwill");
  const [newLoc,     setNewLoc]     = useState("");
  const [addBusy,    setAddBusy]    = useState(false);
  // storeId → "yes"|"no" for today's session logging
  const [logged,     setLogged]     = useState<Record<string, "yes" | "no">>({});

  // First-run guided intro for the zero-store state. Plays the full
  // cinematic sequence once (localStorage lw-guide-sourcing-intro); on
  // later zero-store visits the settled static state renders. null while
  // reading localStorage so we don't flash the wrong branch.
  const reducedMotion = useReducedMotion();
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("lw-guide-sourcing-intro") === "1"; } catch { /* private mode */ }
    setIntroSeen(seen);
  }, []);

  const todayCircleRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  async function refresh() {
    const [pr, sr] = await Promise.all([
      fetch("/api/sourcing/plan"),
      fetch("/api/sourcing/stores"),
    ]);
    if (pr.status === 401 || sr.status === 401) {
      setAuthErr(true);
      setLoading(false);
      return;
    }
    const [pd, sd] = await Promise.all([pr.json(), sr.json()]);
    setPlan(pd as PlanData);
    setStores((sd as { stores: StoreRecord[] }).stores ?? []);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      todayCircleRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [loading]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  async function handleAddStore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddBusy(true);
    const res = await fetch("/api/sourcing/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        chain: newChain,
        location_label: newLoc.trim() || undefined,
      }),
    });
    if (res.ok) {
      setNewName(""); setNewChain("Goodwill"); setNewLoc("");
      setAddOpen(false);
      await refresh();
    }
    setAddBusy(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sourcing/stores?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await refresh();
  }

  async function handleLog(storeId: string, wasOnSale: boolean) {
    const res = await fetch("/api/sourcing/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId, was_on_sale: wasOnSale }),
    });
    if (res.ok) setLogged((p) => ({ ...p, [storeId]: wasOnSale ? "yes" : "no" }));
  }

  // ── Derived state (hooks must run unconditionally, before any early return) ─
  const weekPlan  = plan?.weekPlan ?? [];
  const bestStop  = plan?.bestStop ?? null;
  const hasStores = stores.length > 0;
  // Play the guided intro only on a fresh zero-store visit with motion
  // allowed. introSeen === null = still reading localStorage → hold off.
  const playIntro = !hasStores && introSeen === false && !reducedMotion;
  // Persist the "seen" flag the moment the sequence starts, WITHOUT
  // flipping introSeen (which would abort the running animation) — so it
  // never replays but the current play finishes.
  useEffect(() => {
    if (playIntro) {
      try { localStorage.setItem("lw-guide-sourcing-intro", "1"); } catch { /* private mode */ }
    }
  }, [playIntro]);

  // Preview plan — shown when the user has no stores yet so the week strip
  // is legible and the value of adding stores is immediately obvious.
  // Only Goodwill + Savers patterns; never presented as personalized.
  const previewPlan = useMemo(() => {
    if (hasStores || weekPlan.length === 0) return [];
    const PREVIEW_STORES: Record<string, DayEntry["store"]> = {
      Goodwill:  { id: "preview-goodwill", name: "Goodwill",  chain: "Goodwill",  location_label: null },
      Savers:    { id: "preview-savers",   name: "Savers",    chain: "Savers",    location_label: null },
    };
    return weekPlan.map((day) => ({
      ...day,
      entries: CHAIN_PATTERNS
        .filter((p) => (p.chain === "Goodwill" || p.chain === "Savers") && p.weekday === day.weekday)
        .map((p) => ({
          store: PREVIEW_STORES[p.chain] ?? PREVIEW_STORES.Goodwill!,
          label: p.label,
          confidence: "pattern" as const,
        })),
    }));
  }, [hasStores, weekPlan]);

  // ── Loading / auth guards ──────────────────────────────────────────────────
  if (loading) {
    // Held structure, not a lone "loading…" line — mirrors the sourcing
    // layout (best-stop headline · week strip · store cards) so the tab
    // arrives already shaped.
    return <SourcingSkeleton />;
  }
  if (authErr) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <span style={{ fontFamily: "var(--font-ui, sans-serif)", color: "#9ca3af", fontSize: 15 }}>
          Sign in to see your sourcing plan
        </span>
        <a href="/" style={{ padding: "10px 28px", background: MINT, color: "#000", borderRadius: 8, fontFamily: "var(--font-label, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none" }}>
          SIGN IN
        </a>
      </div>
    );
  }

  // ── More derived state (plain values — fine after the early returns) ───────
  const selPlan = weekPlan[selDay];

  // Next future day with any deal (for empty-today message)
  const nextDealDay = weekPlan.slice(1).find((d) =>
    d.entries.some((e) => e.confidence !== "unknown"),
  );

  // Cards for selected day (real store data)
  const dayCards = selPlan ? groupEntries(selPlan.entries) : [];

  // Use preview when no user stores; preview day cards for selected day
  const displayPlan      = hasStores ? weekPlan : previewPlan;
  const displaySelPlan   = displayPlan[selDay];
  const displayDayCards  = displaySelPlan ? groupEntries(displaySelPlan.entries) : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#e5e7eb", maxWidth: 480, margin: "0 auto" }}>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <div style={{ position: "relative", padding: "32px 20px 22px", overflow: "hidden" }}>
        {/* Saturn-ring motif — centered on the store name text area */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        >
          <ellipse cx="50%" cy="72" rx="210" ry="56" fill="none" stroke="rgba(92,224,184,0.07)" strokeWidth="1.5" />
          <ellipse cx="50%" cy="72" rx="270" ry="78" fill="none" stroke="rgba(92,224,184,0.04)" strokeWidth="1" />
          <circle cx="88%"  cy="22"  r="1.5" fill="rgba(92,224,184,0.45)" />
          <circle cx="10%"  cy="110" r="1"   fill="rgba(255,255,255,0.22)" />
          <circle cx="85%"  cy="120" r="0.8" fill="rgba(92,224,184,0.30)" />
          <circle cx="15%"  cy="30"  r="1.1" fill="rgba(255,255,255,0.18)" />
        </svg>

        {/* Label */}
        <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 9, letterSpacing: "0.16em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 8, position: "relative" }}>
          {"today's best stop"}
        </div>

        {/* — No stores: GUIDED CINEMATIC PITCH — Flip fronts a one-time
            reveal that teaches the loop, then settles into a labelled
            static guide. playIntro gates the entrance staircase; idle
            (breathe/bloom) always runs (reduced-motion collapses it). */}
        {!hasStores && introSeen !== null && (
          <div style={{ position: "relative" }}>
            {/* Flip — the guide's face; idle breathing + mint bloom */}
            <div
              style={{
                position: "relative",
                width: 64,
                height: 64,
                marginBottom: 8,
                animation: playIntro
                  ? "sgRise var(--motion-medium) var(--ease-out) 80ms backwards"
                  : undefined,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(92,224,184,0.28) 0%, transparent 66%)",
                  filter: "blur(7px)",
                  animation: "sgBloom 4.5s var(--ease-out) infinite",
                }}
              />
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  // lineHeight:0 collapses the inline-block baseline gap so
                  // the 64px sprite seats flush in its 64px box (no ~4px
                  // descender strip stealing from the 8px gap below).
                  lineHeight: 0,
                  animation: "sgBreathe 4.5s var(--ease-out) infinite",
                }}
              >
                <FlipCoyote mood="smirk" size={64} />
              </span>
            </div>

            {/* Hero — payoff in Flip's voice */}
            <div
              style={{
                fontFamily: "var(--font-bebas-neue, sans-serif)",
                fontSize: 40,
                letterSpacing: "0.02em",
                color: "#F2EDFA",
                lineHeight: 0.98,
                animation: playIntro
                  ? "sgRise var(--motion-medium) var(--ease-out) 0ms backwards"
                  : undefined,
              }}
            >
              YOUR HUNT, MAPPED
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "rgba(255,255,255,0.62)",
                marginTop: 8,
                lineHeight: 1.5,
                maxWidth: 320,
                animation: playIntro
                  ? "sgRise var(--motion-medium) var(--ease-out) 140ms backwards"
                  : undefined,
              }}
            >
              add your stores — i learn their sale days, then flag the right day
              to roll up.
            </div>

            {/* Flip bubble — points at the day strip below */}
            <div
              style={{
                marginTop: 16,
                animation: playIntro
                  ? "sgFade 300ms var(--ease-out) 350ms backwards"
                  : undefined,
              }}
            >
              <FlipBubble
                text="those dots below? sale-day intel. i track it — you cash it."
                play={playIntro}
                mood="smirk"
                glyphSize={30}
                startDelay={450}
                maxWidth={300}
              />
            </div>

            {/* CTA — the one dominant action, with an attention glow pulse */}
            <button
              onClick={() => setAddOpen(true)}
              style={{
                position: "relative",
                marginTop: 18,
                padding: "12px 30px",
                borderRadius: 12,
                background: MINT,
                color: "#05130E",
                border: "none",
                fontFamily: "var(--font-label, monospace)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.10em",
                cursor: "pointer",
                boxShadow: "0 0 22px rgba(92,224,184,0.4)",
                animation: playIntro
                  ? "sgRise var(--motion-medium) var(--ease-out) 220ms backwards"
                  : undefined,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: 16,
                  background:
                    "radial-gradient(ellipse at center, rgba(92,224,184,0.5) 0%, transparent 70%)",
                  filter: "blur(8px)",
                  opacity: 0,
                  zIndex: -1,
                  pointerEvents: "none",
                  animation: playIntro
                    ? "sgCtaGlow 2.4s var(--ease-out) 1900ms infinite"
                    : undefined,
                }}
              />
              + ADD STORE
            </button>

            {/* Static caption over the strip below — persists after intro */}
            <div
              style={{
                marginTop: 20,
                fontFamily: "var(--font-space-mono, monospace)",
                fontSize: 9,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
                animation: playIntro
                  ? "sgFade 300ms var(--ease-out) 700ms backwards"
                  : undefined,
              }}
            >
              sale-day intel · confirms once you add stores
            </div>
          </div>
        )}

        {/* — Best stop — */}
        {hasStores && bestStop && (
          <div
            role="button"
            tabIndex={0}
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => {
              setSelDay(0);
              todayCircleRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            onKeyDown={(e) => e.key === "Enter" && setSelDay(0)}
          >
            <div style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: 44, lineHeight: 1, letterSpacing: "0.01em",
              color: MINT,
              textShadow: "0 0 32px rgba(92,224,184,0.55), 0 0 80px rgba(92,224,184,0.18)",
            }}>
              {bestStop.store.name}
            </div>
            {bestStop.store.location_label && (
              <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 11, color: "#5A4E70", marginTop: 2, letterSpacing: "0.04em" }}>
                {bestStop.store.location_label}
              </div>
            )}
            <div style={{ fontFamily: "var(--font-ui, sans-serif)", fontSize: 14, color: "#C8C0D8", marginTop: 8, lineHeight: 1.45 }}>
              {bestStop.label}
            </div>
            <div style={{ marginTop: 10 }}>
              <ConfidencePill confidence={bestStop.confidence} />
            </div>
          </div>
        )}

        {/* — Stores but no deal today — */}
        {hasStores && !bestStop && (
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 30, color: "#EDE7F8", letterSpacing: "0.02em" }}>
              No tracked deals today
            </div>
            {nextDealDay && (
              <div style={{ fontFamily: "var(--font-ui, sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                next: {WEEKDAY_FULL[nextDealDay.weekday]} ({nextDealDay.date.slice(5).replace("-", "/")})
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ WEEK STRIP ═════════════════════════════════════════════════════ */}
      {/* Always rendered — preview shows Goodwill + Savers typical patterns
          so the feature is legible before any store is added. The
          zero-store caption is now the guide's "sale-day intel" line in
          the hero above; no separate amber label here. */}
      {displayPlan.length > 0 && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", gap: 6, padding: "0 20px 16px", width: "max-content" }}>
            {displayPlan.map((day, idx) => {
              const isToday    = idx === 0;
              const isSel      = idx === selDay;
              const hasDeals   = day.entries.some((e) => e.confidence !== "unknown");
              const hasConf    = day.entries.some((e) => e.confidence === "confirmed");
              const dotColor   = hasConf ? MINT : "rgba(212,165,116,0.65)";

              return (
                <div
                  key={day.date}
                  ref={isToday ? todayCircleRef : undefined}
                  onClick={() => setSelDay(idx)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", padding: "2px 0" }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    background: isSel ? (isToday ? "rgba(92,224,184,0.16)" : "rgba(255,255,255,0.05)") : "transparent",
                    border: `2px solid ${isSel ? (isToday ? MINT : "rgba(255,255,255,0.18)") : "transparent"}`,
                    boxShadow: isSel && isToday ? "0 0 16px rgba(92,224,184,0.28)" : "none",
                    transition: "all 180ms ease",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-label, monospace)",
                      fontSize: 8, letterSpacing: "0.12em",
                      color: isSel ? (isToday ? MINT : "#e5e7eb") : "rgba(255,255,255,0.55)",
                    }}>
                      {DAY_LETTER[day.weekday]}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-data, monospace)",
                      fontSize: 14, fontWeight: 700,
                      color: isSel ? (isToday ? MINT : "#e5e7eb") : "rgba(255,255,255,0.55)",
                      lineHeight: 1,
                    }}>
                      {day.date.slice(8)}
                    </span>
                  </div>
                  {/* Deal indicator dot — sale-day intel. Soft static
                      bloom; on the guided intro they pop in L→R staggered. */}
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: hasDeals ? dotColor : "transparent",
                    boxShadow: hasDeals ? `0 0 4px ${dotColor}` : "none",
                    transition: "background 200ms ease",
                    animation: playIntro && hasDeals
                      ? `sgDotPop 320ms var(--ease-out) ${950 + idx * 55}ms backwards`
                      : undefined,
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SELECTED DAY PLAN ══════════════════════════════════════════════ */}
      {displaySelPlan && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Day label */}
          <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 9, letterSpacing: "0.13em", color: "#5A4E70", marginBottom: 12, textTransform: "uppercase" }}>
            {selDay === 0 ? "today" : WEEKDAY_FULL[displaySelPlan.weekday]} · {displaySelPlan.date}
          </div>

          {displayDayCards.length === 0 ? (
            <EmptyState
              compact
              headline="clear day"
              body="nothing flagged here yet — check another day"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {displayDayCards.map((card) => {
                const isToday     = selDay === 0;
                // No logging for preview cards (store ids start with "preview-")
                const alreadyLogged = card.store.id.startsWith("preview-") ? undefined : logged[card.store.id];
                const isPreview = card.store.id.startsWith("preview-");
                return (
                  <div key={card.store.id} style={{
                    position: "relative",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.028)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, padding: "14px 16px",
                  }}>
                    {/* SAMPLE tag — reads as preview, not a bug */}
                    {isPreview && (
                      <span style={{
                        position: "absolute", top: 10, right: 12, zIndex: 2,
                        fontFamily: "var(--font-space-mono, monospace)",
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
                        color: "rgba(92,224,184,0.72)",
                        background: "rgba(92,224,184,0.08)",
                        border: "1px solid rgba(92,224,184,0.22)",
                        borderRadius: 6, padding: "2px 6px",
                      }}>
                        SAMPLE
                      </span>
                    )}
                    {/* One-time mint sheen sweep as the guide explains it */}
                    {playIntro && isPreview && (
                      <span aria-hidden="true" style={{
                        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
                        background: "linear-gradient(105deg, transparent 32%, rgba(92,224,184,0.16) 50%, transparent 68%)",
                        transform: "translateX(-130%)",
                        animation: "sgSheen 900ms var(--ease-out) 1400ms 1 backwards",
                      }} />
                    )}
                    {/* Store name + chain */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "var(--font-ui, sans-serif)", fontWeight: 600, fontSize: 15,
                        color: "#e5e7eb", flex: 1, minWidth: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {card.store.name}
                      </span>
                      {/* Preview cards carry the SAMPLE ribbon in this same
                          top-right corner AND their store name is literally
                          the chain ("Goodwill"/"Savers"), so the chain chip
                          both collides with SAMPLE and echoes the name. Drop
                          it on preview only; real cards keep their badge. */}
                      {!isPreview && <ChainBadge chain={card.store.chain} />}
                    </div>

                    {card.store.location_label && (
                      <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 10, color: "#5A4E70", marginBottom: 8, letterSpacing: "0.03em" }}>
                        {card.store.location_label}
                      </div>
                    )}

                    {/* Deal labels — bullet list when multiple */}
                    <div style={{ marginBottom: 10 }}>
                      {card.labels.map((lbl, i) => (
                        <div key={i} style={{
                          fontFamily: "var(--font-ui, sans-serif)", fontSize: 13, color: "#C8C0D8",
                          lineHeight: 1.5,
                          paddingLeft: card.labels.length > 1 ? 10 : 0,
                          position: "relative",
                        }}>
                          {card.labels.length > 1 && (
                            <span style={{ position: "absolute", left: 0, color: "#5A4E70" }}>·</span>
                          )}
                          {lbl}
                        </div>
                      ))}
                    </div>

                    {/* Confidence pill — always visible, always honest */}
                    <div style={{ marginBottom: isToday ? 12 : 0 }}>
                      <ConfidencePill confidence={card.confidence} />
                    </div>

                    {/* One-tap log — today only, real stores only */}
                    {isToday && !card.store.id.startsWith("preview-") && (
                      alreadyLogged ? (
                        <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 10, color: MINT, letterSpacing: "0.06em" }}>
                          ✓ logged {alreadyLogged === "yes" ? "(on sale)" : "(not on sale)"}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 9, letterSpacing: "0.10em", color: "#5A4E70", marginBottom: 7, textTransform: "uppercase" }}>
                            on sale today?
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => void handleLog(card.store.id, true)}
                              style={{
                                flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(92,224,184,0.28)",
                                background: "rgba(92,224,184,0.08)", color: MINT,
                                fontFamily: "var(--font-label, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                                cursor: "pointer",
                              }}
                            >
                              ✓ YES
                            </button>
                            <button
                              onClick={() => void handleLog(card.store.id, false)}
                              style={{
                                flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                                background: "rgba(255,255,255,0.03)", color: "#6b7280",
                                fontFamily: "var(--font-label, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                                cursor: "pointer",
                              }}
                            >
                              ✗ NO
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ STORE MANAGEMENT ═══════════════════════════════════════════════ */}
      <div style={{ padding: "0 16px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 6 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 12px" }}>
          <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 9, letterSpacing: "0.13em", color: "#5A4E70", textTransform: "uppercase" }}>
            my stores ({stores.length})
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {stores.length > 0 && (
              <button
                onClick={() => setManaging((m) => !m)}
                style={{
                  padding: "5px 12px", borderRadius: 8,
                  background: managing ? "rgba(232,99,107,0.10)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${managing ? "rgba(232,99,107,0.25)" : "rgba(255,255,255,0.08)"}`,
                  color: managing ? "#E8636B" : "#6b7280",
                  fontFamily: "var(--font-label, monospace)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                  cursor: "pointer", transition: "all 150ms ease",
                }}
              >
                {managing ? "DONE" : "MANAGE"}
              </button>
            )}
            <button
              onClick={() => setAddOpen(true)}
              style={{
                padding: "5px 14px", borderRadius: 8,
                background: "rgba(92,224,184,0.10)", border: "1px solid rgba(92,224,184,0.25)",
                color: MINT, fontFamily: "var(--font-label, monospace)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.08em", cursor: "pointer",
              }}
            >
              + ADD
            </button>
          </div>
        </div>

        {/* Store list — the empty case uses the house template. No CTA
            inside it: the + ADD button sits in this section's header row
            directly above, so a second button would just echo it. */}
        {stores.length === 0 ? (
          <EmptyState
            compact
            headline="no stores yet"
            body="hit + ADD up top — i'll learn each one's sale days"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stores.map((s) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-ui, sans-serif)", fontWeight: 600, fontSize: 14, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                  </div>
                  {s.location_label && (
                    <div style={{ fontFamily: "var(--font-data, monospace)", fontSize: 10, color: "#5A4E70", letterSpacing: "0.03em", marginTop: 1 }}>
                      {s.location_label}
                    </div>
                  )}
                </div>
                <ChainBadge chain={s.chain} />
                {managing && (
                  <button
                    onClick={() => void handleDelete(s.id)}
                    style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 7,
                      background: "rgba(232,99,107,0.10)", border: "1px solid rgba(232,99,107,0.20)",
                      color: "#E8636B", fontSize: 16, lineHeight: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Static clearance for the floating tab pill — logged-in store
            lists scroll and their check-in rows are tappable; they must
            never end under the glass. Same 96px+env constant as the
            other tabbed pages. */}
        <div style={{ paddingBottom: "var(--content-bottom-clearance)" }} />
      </div>

      {/* ═══ ADD STORE — branded bottom sheet ════════════════════════════════ */}
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        borderColor="rgba(92,224,184,0.30)"
      >
        <style>{`
          .as-field {
            width: 100%; box-sizing: border-box;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px; padding: 14px 15px;
            font-family: var(--font-manrope, sans-serif); font-size: 15px;
            color: #E8E5F0; outline: none;
            transition: border-color 160ms ease, box-shadow 160ms ease;
          }
          .as-field::placeholder { color: rgba(255,255,255,0.34); }
          /* focus-charge: the input well brightens to a mint rim, echoing
             the login inputs. */
          .as-field:focus {
            border-color: rgba(92,224,184,0.55);
            box-shadow: 0 0 0 1px rgba(92,224,184,0.22),
                        0 0 16px -6px rgba(92,224,184,0.45);
          }
          .as-chip {
            flex: 0 0 auto; height: 36px; padding: 0 15px; border-radius: 18px;
            font-family: var(--font-space-mono, monospace); font-size: 11px;
            font-weight: 700; letter-spacing: 0.05em; cursor: pointer;
            transition: background-color 140ms ease, border-color 140ms ease,
                        color 140ms ease;
          }
          .as-cta {
            transition: background-color 160ms ease, box-shadow 160ms ease;
          }
          @media (prefers-reduced-motion: reduce) {
            .as-field, .as-chip, .as-cta { transition: none; }
          }
        `}</style>
        <form onSubmit={(e) => void handleAddStore(e)}>
          <div style={{ padding: "2px 20px 8px" }}>
            {/* Header */}
            <div
              style={{
                fontFamily: "var(--font-bebas-neue, sans-serif)",
                fontSize: 26,
                letterSpacing: "0.05em",
                color: "#F2EDFA",
                lineHeight: 1,
                marginBottom: 18,
              }}
            >
              ADD STORE
            </div>

            {/* Field 1 — store name */}
            <div style={AS_LABEL}>STORE NAME</div>
            <input
              className="as-field"
              placeholder="Goodwill Broad St"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />

            {/* Field 2 — chain, branded chip row (was a raw select) */}
            <div style={{ ...AS_LABEL, marginTop: 16 }}>CHAIN</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CHAIN_OPTIONS.map((c) => {
                const active = newChain === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className="as-chip"
                    onClick={() => setNewChain(c)}
                    aria-pressed={active}
                    style={{
                      background: active
                        ? "rgba(92,224,184,0.16)"
                        : "rgba(255,255,255,0.04)",
                      border: active
                        ? "1px solid rgba(92,224,184,0.55)"
                        : "1px solid rgba(255,255,255,0.10)",
                      color: active ? "#5CE0B8" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {c === "other" ? "OTHER" : c}
                  </button>
                );
              })}
            </div>

            {/* Field 3 — optional location label */}
            <div style={{ ...AS_LABEL, marginTop: 16 }}>
              LOCATION{" "}
              <span style={{ color: "rgba(255,255,255,0.35)" }}>· optional</span>
            </div>
            <input
              className="as-field"
              placeholder="Broad St"
              value={newLoc}
              onChange={(e) => setNewLoc(e.target.value)}
            />
          </div>

          {/* Sticky action bar — pinned inside the sheet's safe area so the
              buttons never hide under the iOS keyboard / AutoFill bar. */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              display: "flex",
              gap: 10,
              padding: "14px 20px",
              paddingBottom: "max(14px, env(safe-area-inset-bottom, 0px))",
              backgroundColor: "rgba(18,14,24,0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "var(--font-space-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="as-cta"
              disabled={addBusy || !newName.trim()}
              style={{
                flex: 2,
                height: 46,
                borderRadius: 12,
                border: "none",
                background:
                  addBusy || !newName.trim() ? "rgba(92,224,184,0.15)" : MINT,
                color: addBusy || !newName.trim() ? MINT : "#05130E",
                fontFamily: "var(--font-space-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                cursor: addBusy || !newName.trim() ? "not-allowed" : "pointer",
                boxShadow:
                  addBusy || !newName.trim()
                    ? "none"
                    : "0 0 18px -2px rgba(92,224,184,0.45)",
              }}
            >
              {addBusy ? "SAVING…" : "SAVE STORE"}
            </button>
          </div>
        </form>
      </BottomSheet>
      {/* Bottom padding for tab bar */}
      <div style={{ height: 80 }} />
    </div>
  );
}
