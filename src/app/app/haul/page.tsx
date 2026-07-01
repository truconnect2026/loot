"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DotGridBackground from "@/components/shared/DotGridBackground";
import { CoinMarkSpinner } from "@/components/shared/CoinMark";
import { createClient } from "@/lib/supabase";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { elevation } from "@/lib/design/tokens";

type HaulStatus  = "saved" | "bought" | "listed" | "sold";
type HaulVerdict = "buy" | "maybe" | "pass";
type FilterKind  = "all" | HaulStatus;

interface HaulRow {
  id:              string;
  created_at:      string;
  name:            string;
  image_url:       string | null;
  buy_price:       number | null;
  est_resale_low:  number | null;
  est_resale_high: number | null;
  verdict:         HaulVerdict | null;
  status:          HaulStatus;
  sold_price:      number | null;
  sold_at:         string | null;
  source:          string;
  notes:           string | null;
}

const STATUS_SEQ: HaulStatus[] = ["saved", "bought", "listed", "sold"];

const STATUS_LABEL: Record<HaulStatus, string> = {
  saved:  "SAVED",
  bought: "BOUGHT",
  listed: "LISTED",
  sold:   "SOLD",
};

const STATUS_COLORS: Record<HaulStatus, { bg: string; border: string; text: string }> = {
  saved:  { bg: "rgba(123,143,255,0.10)", border: "rgba(123,143,255,0.24)", text: "#7B8FFF" },
  bought: { bg: "rgba(212,165,116,0.10)", border: "rgba(212,165,116,0.24)", text: "#D4A574" },
  listed: { bg: "rgba(255,255,255,0.06)",  border: "rgba(255,255,255,0.12)", text: "#C8C0D8" },
  sold:   { bg: "rgba(92,224,184,0.10)",  border: "rgba(92,224,184,0.24)",  text: "#5CE0B8" },
};

const FILTER_TINT: Record<FilterKind, { text: string; rgba: string }> = {
  all:    { text: "#C8C0D8", rgba: "200,192,216" },
  saved:  { text: "#7B8FFF", rgba: "123,143,255" },
  bought: { text: "#D4A574", rgba: "212,165,116" },
  listed: { text: "#C8C0D8", rgba: "200,192,216" },
  sold:   { text: "#5CE0B8", rgba: "92,224,184"  },
};

function nextStatus(s: HaulStatus): HaulStatus | null {
  const i = STATUS_SEQ.indexOf(s);
  return i < STATUS_SEQ.length - 1 ? STATUS_SEQ[i + 1] : null;
}

function fmt(n: number): string {
  return `$${Math.round(Math.abs(n))}`;
}

// ── Icons ──────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x={1} y={3} width={22} height={5} />
      <line x1={10} y1={12} x2={14} y2={12} />
    </svg>
  );
}

// ── Stat cell ────────────────────────────────────────────────────────

interface StatCellProps {
  label: string;
  value: number | null;
  prefix?: string;
  subLabel?: string;
  isMint?: boolean;
}

function StatCell({ label, value, prefix = "", subLabel, isMint }: StatCellProps) {
  return (
    <div style={{
      background: "rgba(23,18,42,0.85)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      boxShadow: elevation[2],
      padding: "10px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 3,
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: "var(--font-label)",
        fontSize: 7,
        color: "rgba(200,192,216,0.40)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-data)",
        fontSize: 20,
        fontWeight: 700,
        color: value == null ? "var(--text-dim)" : isMint ? "#5CE0B8" : "var(--text-primary)",
        fontFeatureSettings: '"tnum"',
        lineHeight: 1,
        textShadow: isMint && value != null ? "0 0 20px rgba(92,224,184,0.20)" : "none",
      }}>
        {value == null ? "—" : `${prefix}${fmt(value).slice(1)}`}
      </div>
      {subLabel && (
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 9,
          color: "var(--text-dim)",
          lineHeight: 1,
        }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────

function FilterChip({
  kind, label, count, active, onTap,
}: { kind: FilterKind; label: string; count: number; active: boolean; onTap: () => void }) {
  const tint = FILTER_TINT[kind];
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        flexShrink: 0,
        height: 28,
        padding: "0 12px",
        borderRadius: 20,
        backgroundColor: active ? `rgba(${tint.rgba},0.15)` : "transparent",
        border: active ? `1px solid rgba(${tint.rgba},0.30)` : "1px solid rgba(255,255,255,0.08)",
        color: active ? tint.text : "var(--text-muted)",
        fontFamily: "var(--font-label)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "background-color 120ms ease-out, color 120ms ease-out",
        whiteSpace: "nowrap",
      }}
    >
      {label.toUpperCase()} ({count})
    </button>
  );
}

// ── Haul card ────────────────────────────────────────────────────────

interface HaulCardProps {
  row: HaulRow;
  onStatusAdvance: (id: string, next: HaulStatus, price?: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function HaulCard({ row, onStatusAdvance, onDelete }: HaulCardProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [delPending, setDelPending] = useState(false);
  const delTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (promptOpen && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [promptOpen]);

  // Clear del pending timer on unmount
  useEffect(() => () => { if (delTimer.current) clearTimeout(delTimer.current); }, []);

  const next = nextStatus(row.status);
  const verdictUp = row.verdict
    ? (row.verdict.toUpperCase() as "BUY" | "MAYBE" | "PASS")
    : null;

  const sColor = STATUS_COLORS[row.status];

  function handleStatusTap() {
    if (!next) return;
    const needsBuyPrice = next === "bought" && row.buy_price == null;
    const needsSoldPrice = next === "sold";
    if (needsBuyPrice || needsSoldPrice) {
      setPromptValue(
        needsSoldPrice && row.est_resale_high != null
          ? String(Math.round(row.est_resale_high))
          : "",
      );
      setPromptOpen(true);
      return;
    }
    void onStatusAdvance(row.id, next);
  }

  function handleCommitPrice() {
    const v = parseFloat(promptValue.trim().replace(/[$,]/g, ""));
    setPromptOpen(false);
    setPromptValue("");
    if (!next || !Number.isFinite(v) || v < 0) return;
    void onStatusAdvance(row.id, next, v);
  }

  function handleDeleteTap() {
    if (delPending) {
      if (delTimer.current) clearTimeout(delTimer.current);
      void onDelete(row.id);
      setDelPending(false);
      return;
    }
    setDelPending(true);
    delTimer.current = setTimeout(() => setDelPending(false), 2000);
  }

  // Profit display for sold items
  const realizedProfit =
    row.status === "sold" && row.sold_price != null && row.buy_price != null
      ? row.sold_price - row.buy_price
      : null;

  // Resale range string
  let resaleStr = "";
  if (row.est_resale_low != null && row.est_resale_high != null) {
    resaleStr = row.est_resale_low === row.est_resale_high
      ? `${fmt(row.est_resale_low)} est`
      : `${fmt(row.est_resale_low)}–${fmt(row.est_resale_high)} est`;
  } else if (row.est_resale_high != null) {
    resaleStr = `${fmt(row.est_resale_high)} est`;
  } else if (row.est_resale_low != null) {
    resaleStr = `${fmt(row.est_resale_low)} est`;
  }

  return (
    <div style={{
      backgroundColor: "rgba(255,255,255,0.038)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "4px 16px 16px 16px",
      boxShadow: elevation[1],
      padding: "12px 14px",
    }}>
      {/* Row 1: badge + name + delete */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {verdictUp && (
          <div style={{ flexShrink: 0, paddingTop: 1 }}>
            <VerdictBadge tier={verdictUp} size="sm" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {row.name}
          </div>
          {/* Price line */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 3,
            flexWrap: "wrap",
          }}>
            {row.buy_price != null ? (
              <span style={{
                fontFamily: "var(--font-data)",
                fontSize: 10,
                color: "var(--text-muted)",
                fontFeatureSettings: '"tnum"',
              }}>
                paid {fmt(row.buy_price)}
              </span>
            ) : (
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                color: "var(--text-dim)",
              }}>
                no buy price
              </span>
            )}
            {resaleStr && (
              <>
                <span style={{ color: "var(--text-dim)", fontSize: 9 }}>→</span>
                <span style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 10,
                  color: "var(--money)",
                  fontFeatureSettings: '"tnum"',
                }}>
                  {resaleStr}
                </span>
              </>
            )}
            {row.status === "sold" && row.sold_price != null && (
              <span style={{
                fontFamily: "var(--font-data)",
                fontSize: 10,
                color: "#5CE0B8",
                fontFeatureSettings: '"tnum"',
              }}>
                · sold {fmt(row.sold_price)}
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDeleteTap}
          aria-label={delPending ? "Confirm delete" : "Delete haul"}
          style={{
            width: 26,
            height: 26,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: delPending ? "rgba(232,99,107,0.12)" : "transparent",
            border: delPending ? "1px solid rgba(232,99,107,0.30)" : "1px solid transparent",
            borderRadius: "50%",
            cursor: "pointer",
            color: delPending ? "#E8636B" : "rgba(255,255,255,0.22)",
            fontSize: delPending ? 9 : 14,
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            letterSpacing: delPending ? "0.06em" : 0,
            transition: "color 150ms ease, background 150ms ease, border-color 150ms ease",
          }}
        >
          {delPending ? "DEL?" : "×"}
        </button>
      </div>

      {/* Status row / price prompt */}
      {promptOpen ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
          flexWrap: "wrap",
        }}>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--text-muted)",
          }}>
            {next === "sold" ? "sold for" : "paid"} $
          </span>
          <input
            ref={promptInputRef}
            type="text"
            inputMode="decimal"
            value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCommitPrice();
              if (e.key === "Escape") { setPromptOpen(false); setPromptValue(""); }
            }}
            onBlur={handleCommitPrice}
            placeholder="0"
            style={{
              width: 72,
              background: "var(--bg-recessed)",
              border: "1px solid rgba(255,255,255,0.18)",
              outline: "none",
              borderRadius: 6,
              fontFamily: "var(--font-data)",
              fontSize: 15,
              color: "var(--text-primary)",
              textAlign: "right",
              padding: "3px 8px",
              fontFeatureSettings: '"tnum"',
            }}
          />
          <button
            type="button"
            onClick={handleCommitPrice}
            style={{
              height: 26,
              padding: "0 12px",
              borderRadius: 8,
              background: "rgba(92,224,184,0.10)",
              border: "1px solid rgba(92,224,184,0.24)",
              color: "#5CE0B8",
              fontFamily: "var(--font-label)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            SAVE
          </button>
          <button
            type="button"
            onClick={() => { setPromptOpen(false); setPromptValue(""); }}
            style={{
              height: 26,
              padding: "0 10px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-label)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            SKIP
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
          flexWrap: "wrap",
        }}>
          {/* Status pill — tappable to advance */}
          <button
            type="button"
            onClick={handleStatusTap}
            disabled={!next}
            style={{
              height: 24,
              padding: "0 10px",
              borderRadius: 20,
              backgroundColor: sColor.bg,
              border: `1px solid ${sColor.border}`,
              color: sColor.text,
              fontFamily: "var(--font-label)",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.10em",
              cursor: next ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 150ms ease",
              flexShrink: 0,
            }}
          >
            {STATUS_LABEL[row.status]}
            {next && (
              <span style={{ opacity: 0.55, fontSize: 7 }}>
                ▸ {STATUS_LABEL[next]}
              </span>
            )}
          </button>

          {/* Realized profit for sold items */}
          {realizedProfit != null && (
            <span style={{
              fontFamily: "var(--font-data)",
              fontSize: 11,
              color: realizedProfit >= 0 ? "#5CE0B8" : "#E8636B",
              fontFeatureSettings: '"tnum"',
            }}>
              {realizedProfit >= 0 ? "+" : "−"}{fmt(realizedProfit)} profit
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function HaulLogPage() {
  const router = useRouter();
  const [hauls, setHauls] = useState<HaulRow[] | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [backPressed, setBackPressed] = useState(false);

  // Clear haul-pending badge from tab bar when page opens
  useEffect(() => {
    try { localStorage.removeItem("loot_haul_pending"); } catch { /* private mode */ }
  }, []);

  // Load hauls — newest first
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) setHauls([]);
        return;
      }
      const { data } = await supabase
        .from("hauls")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled) setHauls((data ?? []) as HaulRow[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStatusAdvance = useCallback(
    async (id: string, next: HaulStatus, price?: number) => {
      const update: Record<string, unknown> = { status: next };
      if (price != null) {
        if (next === "bought") update.buy_price = price;
        if (next === "sold") {
          update.sold_price = price;
          update.sold_at    = new Date().toISOString();
        }
      }
      // Optimistic
      setHauls(prev =>
        prev?.map(h => h.id === id ? { ...h, ...(update as Partial<HaulRow>) } : h) ?? null,
      );
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      await supabase.from("hauls").update(update).eq("id", id).eq("user_id", userData.user.id);
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    setHauls(prev => prev?.filter(h => h.id !== id) ?? null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("hauls").delete().eq("id", id).eq("user_id", userData.user.id);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────
  const totalItems = hauls?.length ?? 0;
  const moneyIn = hauls?.reduce((s, h) => s + (h.buy_price ?? 0), 0) ?? 0;

  let realizedProfit  = 0;
  let projectedProfit = 0;
  let hasRealized     = false;
  let hasProjected    = false;
  for (const h of hauls ?? []) {
    if (h.status === "sold" && h.sold_price != null && h.buy_price != null) {
      realizedProfit += h.sold_price - h.buy_price;
      hasRealized = true;
    } else if (h.status !== "sold" && h.est_resale_low != null && h.buy_price != null) {
      projectedProfit += h.est_resale_low - h.buy_price;
      hasProjected = true;
    }
  }
  const totalProfit  = realizedProfit + projectedProfit;
  const profitLabel  = hasRealized && !hasProjected ? "REALIZED" : "PROJECTED";
  const profitSubLabel = hasRealized && hasProjected ? "realized + proj" : undefined;
  const hasAnyProfit = hasRealized || hasProjected;

  // ── Filter ─────────────────────────────────────────────────────────
  const counts: Record<FilterKind, number> = {
    all:    hauls?.length ?? 0,
    saved:  hauls?.filter(h => h.status === "saved").length  ?? 0,
    bought: hauls?.filter(h => h.status === "bought").length ?? 0,
    listed: hauls?.filter(h => h.status === "listed").length ?? 0,
    sold:   hauls?.filter(h => h.status === "sold").length   ?? 0,
  };
  const filtered = hauls?.filter(h => filter === "all" || h.status === filter) ?? [];

  return (
    <>
      <DotGridBackground variant="grid" />

      {/* Ambient blue wash — matches Account page temperature */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle 350px at 50% 10%, rgba(123,143,255,0.025) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 18px",
          position: "relative",
          zIndex: 1,
          animation: "vaultReveal 280ms cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}>
          <button
            onClick={() => router.push("/app")}
            onPointerDown={() => setBackPressed(true)}
            onPointerUp={() => setBackPressed(false)}
            onPointerLeave={() => setBackPressed(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              color: backPressed ? "var(--text-primary)" : "var(--text-muted)",
              transition: "color 100ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <ChevronLeft />
          </button>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}>
            HAUL
          </span>
          {hauls !== null && (
            <span style={{
              fontFamily: "var(--font-label)",
              fontSize: 9,
              color: "rgba(200,192,216,0.35)",
              letterSpacing: "0.10em",
              paddingTop: 2,
            }}>
              {totalItems} ITEM{totalItems !== 1 ? "S" : ""}
            </span>
          )}
        </div>

        {/* ── Loading ── */}
        {hauls === null && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <CoinMarkSpinner />
          </div>
        )}

        {/* ── Empty state ── */}
        {hauls !== null && hauls.length === 0 && (
          <div style={{ animation: "fadeInUp 400ms cubic-bezier(0.16,1,0.3,1) both" }}>
            <EmptyState
              icon={<BoxIcon />}
              headline="No hauls yet"
              body="save your first find from a scan to start tracking it through the pipeline"
              action={
                <button
                  type="button"
                  onClick={() => router.push("/app")}
                  style={{
                    height: 36,
                    padding: "0 20px",
                    borderRadius: 10,
                    background: "rgba(92,224,184,0.10)",
                    border: "1px solid rgba(92,224,184,0.24)",
                    color: "#5CE0B8",
                    fontFamily: "var(--font-label)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    cursor: "pointer",
                  }}
                >
                  OPEN SCANNER
                </button>
              }
            />
          </div>
        )}

        {/* ── Stats strip ── */}
        {hauls !== null && hauls.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
            animation: "fadeInUp 400ms cubic-bezier(0.16,1,0.3,1) 80ms both",
          }}>
            <StatCell label="ITEMS" value={totalItems} />
            <StatCell label="MONEY IN" value={moneyIn > 0 ? moneyIn : null} prefix="$" />
            <StatCell
              label={profitLabel}
              value={hasAnyProfit ? totalProfit : null}
              prefix="$"
              subLabel={profitSubLabel}
              isMint={hasAnyProfit && totalProfit >= 0}
            />
          </div>
        )}

        {/* ── Filter chips ── */}
        {hauls !== null && hauls.length > 0 && (
          <div style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            animation: "fadeInUp 400ms cubic-bezier(0.16,1,0.3,1) 110ms both",
          }}>
            {(["all", "saved", "bought", "listed", "sold"] as FilterKind[]).map(f => (
              <FilterChip
                key={f}
                kind={f}
                label={f}
                count={counts[f]}
                active={filter === f}
                onTap={() => setFilter(f)}
              />
            ))}
          </div>
        )}

        {/* ── No items in this filter ── */}
        {hauls !== null && hauls.length > 0 && filtered.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "32px 0",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-muted)",
          }}>
            no {filter} items
          </div>
        )}

        {/* ── Haul list ── */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((h, i) => (
              <div
                key={h.id}
                style={{
                  animation: `fadeInUp 350ms cubic-bezier(0.16,1,0.3,1) ${140 + i * 35}ms both`,
                }}
              >
                <HaulCard
                  row={h}
                  onStatusAdvance={handleStatusAdvance}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Crowdsource note ── */}
        {hauls !== null && hauls.length > 0 && (
          <div style={{
            marginTop: 24,
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "var(--text-dim)",
          }}>
            every sale you log improves pricing for all loot users
          </div>
        )}

        <div style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }} />
      </div>
    </>
  );
}
