"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import DotGridBackground from "@/components/shared/DotGridBackground";
import { CoinMarkSpinner } from "@/components/shared/CoinMark";
import { createClient } from "@/lib/supabase";

interface ScanRow {
  id: string;
  method: "barcode" | "vision";
  item_name: string | null;
  cost: number | null;
  sell_price: number | null;
  profit: number | null;
  verdict: "BUY" | "PASS" | "MAYBE" | null;
  platform: string | null;
  sold: boolean | null;
  sold_price: number | null;
  created_at: string;
  /** comps_data carries category + conditionGrade fields written by
   * the verdict pipeline. Selected here so the mark-sold handler can
   * forward those into the sold_comps row without an extra round-trip. */
  comps_data: Record<string, unknown> | null;
}

const VERDICT_COLOR: Record<string, string> = {
  BUY: "var(--accent-mint)",
  PASS: "var(--accent-red)",
  MAYBE: "var(--accent-camel)",
};

function ChevronLeft() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function HaulLogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<ScanRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backPressed, setBackPressed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!cancelled) {
          setRows([]);
        }
        return;
      }
      const { data, error } = await supabase
        .from("scans")
        .select(
          "id, method, item_name, cost, sell_price, profit, verdict, platform, sold, sold_price, created_at, comps_data"
        )
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
        return;
      }
      setRows((data ?? []) as ScanRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Mark-sold UI state. `markingId` selects which row is in input
  // mode; `markDraft` holds the in-progress sell-price string. `saving`
  // gates double-taps while the update is in flight.
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markDraft, setMarkDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const markInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (markingId && markInputRef.current) {
      markInputRef.current.focus();
      markInputRef.current.select();
    }
  }, [markingId]);

  async function commitSold(row: ScanRow) {
    if (saving) return;
    const trimmed = markDraft.trim();
    if (!trimmed) {
      setMarkingId(null);
      return;
    }
    const price = Number(trimmed);
    if (!Number.isFinite(price) || price <= 0) {
      setMarkingId(null);
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      return;
    }
    const { error: updateErr } = await supabase
      .from("scans")
      .update({
        sold: true,
        sold_price: price,
        sold_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("user_id", userData.user.id);
    if (!updateErr) {
      setRows((prev) =>
        prev
          ? prev.map((r) =>
              r.id === row.id ? { ...r, sold: true, sold_price: price } : r,
            )
          : prev,
      );

      // Crowdsource the comp — every successful mark-sold writes a
      // row to sold_comps so future verdicts can ground on real sold
      // prices. Wrapped in try/catch so a comps insert failure never
      // blocks the user-facing mark-sold flow. user_id, sold_price,
      // and item_name are required; everything else is best-effort.
      try {
        const itemName = row.item_name?.trim();
        if (itemName) {
          // Pull the user's zip lazily — only on the first mark-sold
          // of the session. Skipping if the profile lookup fails is
          // fine; the comp row just won't carry a zip.
          let zip: string | null = null;
          try {
            const { data: profileRow } = await supabase
              .from("profiles")
              .select("zip_code")
              .eq("id", userData.user.id)
              .maybeSingle();
            zip = profileRow?.zip_code ?? null;
          } catch {
            /* profile read can fail silently — zip stays null */
          }

          const comps = (row.comps_data ?? {}) as Record<string, unknown>;
          const conditionGrade =
            typeof comps.conditionGrade === "string"
              ? comps.conditionGrade
              : null;
          const category =
            typeof comps.category === "string" ? comps.category : null;

          const createdMs = row.created_at
            ? new Date(row.created_at).getTime()
            : NaN;
          // Date.now() inside an async event handler is fine; the
          // react-hooks/purity rule fires on the literal call site
          // because `commitSold` is declared inside the component
          // body. Disabled rather than refactored — the function
          // is only ever called via user tap, never during render.
          // eslint-disable-next-line react-hooks/purity
          const nowMs = Date.now();
          const daysToSell = Number.isFinite(createdMs)
            ? Math.max(0, Math.round((nowMs - createdMs) / 86_400_000))
            : null;

          await supabase.from("sold_comps").insert({
            user_id: userData.user.id,
            item_name: itemName,
            item_category: category,
            platform: row.platform,
            sold_price: price,
            days_to_sell: daysToSell,
            condition_grade: conditionGrade,
            zip_code: zip,
          });
        }
      } catch (compsErr) {
        console.error("[haul] sold_comps insert failed:", compsErr);
      }
    }
    setMarkingId(null);
    setMarkDraft("");
    setSaving(false);
  }

  // Aggregate footer numbers. Realized = sold_price - cost on items
  // marked sold (the actual money made, not the projected number from
  // scan time). Projected = profit on un-sold BUY-verdict scans.
  const realized =
    rows
      ?.filter((r) => r.sold && r.sold_price != null)
      .reduce(
        (sum, r) => sum + Number(r.sold_price) - Number(r.cost ?? 0),
        0,
      ) ?? 0;
  const projected =
    rows
      ?.filter((r) => !r.sold && r.verdict === "BUY" && r.profit != null)
      .reduce((sum, r) => sum + Number(r.profit), 0) ?? 0;

  return (
    <>
      <DotGridBackground />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 18px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Crowdsource banner — sits above the page title so the
            "every sale helps" framing is the first thing users see
            when they land on their haul. Quietly muted; it's a
            value-prop note, not a CTA. */}
        <div
          style={{
            paddingTop: 8,
            marginBottom: 12,
            padding: 8,
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#5A4E70",
          }}
        >
          every sale you log improves pricing for all Loot users 🤝
        </div>

        {/* Back arrow + title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingTop: 16,
            marginBottom: 16,
          }}
        >
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
              color: backPressed
                ? "var(--text-primary)"
                : "var(--text-muted)",
              transition: "color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <ChevronLeft />
          </button>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--text-primary)",
            }}
          >
            Haul Log
          </span>
        </div>

        {/* Aggregate row */}
        {rows && rows.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-recessed)",
                borderRadius: 10,
                padding: 12,
                boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  color: "var(--text-muted)",
                  letterSpacing: "0.10em",
                  marginBottom: 4,
                }}
              >
                REALIZED
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: 22,
                  color: "var(--accent-mint)",
                  textShadow: "0 0 24px rgba(92,224,184,0.20)",
                }}
              >
                ${realized.toFixed(0)}
              </div>
            </div>
            <div
              style={{
                backgroundColor: "var(--bg-recessed)",
                borderRadius: 10,
                padding: 12,
                boxShadow: "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  color: "var(--text-muted)",
                  letterSpacing: "0.10em",
                  marginBottom: 4,
                }}
              >
                PROJECTED
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: 22,
                  color: "var(--text-primary)",
                }}
              >
                ${projected.toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {rows === null && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <CoinMarkSpinner />
          </div>
        )}

        {rows && rows.length === 0 && !error && (
          <div
            style={{
              textAlign: "center",
              paddingTop: 64,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--text-dim)",
              letterSpacing: "0.10em",
            }}
          >
            NO SCANS YET — TAP SCAN UPC TO START
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: "center",
              paddingTop: 32,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--accent-red)",
            }}
          >
            {error}
          </div>
        )}

        {/* Scan list */}
        {rows && rows.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((row) => {
              const verdictColor = row.verdict
                ? VERDICT_COLOR[row.verdict]
                : "var(--text-muted)";
              // Profit-tier accent ribbon — same color cadence as
              // deal cards and shelf scanner. Mint above $20, camel
              // $5-$20, red on negative, hairline 0-$5.
              const profitVal = Number(row.profit ?? 0);
              const accent =
                profitVal < 0
                  ? "#E8636B"
                  : profitVal > 20
                    ? "#5CE0B8"
                    : profitVal >= 5
                      ? "#D4A574"
                      : "rgba(255,255,255,0.06)";
              return (
                <div
                  key={row.id}
                  style={{
                    position: "relative",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    // Elevated card stack to match the rest of the
                    // app's primary-card depth.
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.03) inset, inset 0 1px 0 0 rgba(255,255,255,0.04)",
                    borderRadius: "4px 14px 14px 14px",
                    padding: 14,
                    paddingLeft: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderLeft: `2px solid ${accent}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.item_name ?? "Unknown item"}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 9,
                        color: "var(--text-muted)",
                        letterSpacing: "0.06em",
                        marginTop: 2,
                      }}
                    >
                      {formatDate(row.created_at)}
                      {" · "}
                      {row.method === "barcode" ? "UPC" : "AI"}
                      {row.cost != null && ` · $${Number(row.cost).toFixed(0)} cost`}
                      {row.sell_price != null &&
                        ` · $${Number(row.sell_price).toFixed(0)} sell`}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      flexShrink: 0,
                      gap: 4,
                    }}
                  >
                    {row.verdict && (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          fontSize: 10,
                          color: verdictColor,
                          letterSpacing: "0.10em",
                        }}
                      >
                        {row.verdict}
                      </span>
                    )}
                    {row.profit != null && !row.sold && (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          fontSize: 14,
                          color: verdictColor,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        ${Number(row.profit).toFixed(0)}
                      </span>
                    )}

                    {/* Sold pill — proper mono-uppercase badge with
                        a tinted surface + border so it reads as a
                        deliberate state badge instead of inline
                        prose. Sale price stays inline so the user
                        still sees what the item went for. */}
                    {row.sold && row.sold_price != null && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontWeight: 700,
                          fontSize: 8,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          color: "#5CE0B8",
                          backgroundColor: "rgba(92,224,184,0.10)",
                          border: "1px solid rgba(92,224,184,0.20)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        SOLD · ${Number(row.sold_price).toFixed(0)}
                      </span>
                    )}

                    {/* Mark-sold input — appears when this row's
                        "$" button is tapped. Numeric input with
                        Enter/blur to commit, Escape to cancel. */}
                    {!row.sold && markingId === row.id && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            color: "var(--text-muted)",
                          }}
                        >
                          $
                        </span>
                        <input
                          ref={markInputRef}
                          type="text"
                          inputMode="decimal"
                          value={markDraft}
                          onChange={(e) => setMarkDraft(e.target.value)}
                          onBlur={() => commitSold(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitSold(row);
                            if (e.key === "Escape") {
                              setMarkingId(null);
                              setMarkDraft("");
                            }
                          }}
                          placeholder="0"
                          style={{
                            width: 56,
                            background: "var(--bg-recessed)",
                            border: "1px solid var(--ui-border-focus)",
                            outline: "none",
                            borderRadius: 6,
                            fontFamily: "var(--font-body)",
                            fontWeight: 700,
                            fontSize: 16,
                            color: "var(--ui-primary)",
                            textAlign: "right",
                            padding: "2px 6px",
                            fontFeatureSettings: '"tnum"',
                          }}
                        />
                      </div>
                    )}

                    {/* Mark-sold trigger — small "$" button on
                        unsold rows. Tap → swap the right column to
                        the input above. */}
                    {!row.sold && markingId !== row.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setMarkingId(row.id);
                          setMarkDraft(
                            row.sell_price != null
                              ? String(Number(row.sell_price).toFixed(0))
                              : "",
                          );
                        }}
                        style={{
                          background: "rgba(92,224,184,0.06)",
                          border: "1px solid rgba(92,224,184,0.18)",
                          borderRadius: 6,
                          padding: "2px 8px",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 9,
                          color: "var(--accent-mint)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        MARK SOLD
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ paddingBottom: 40 }} />
      </div>
    </>
  );
}
