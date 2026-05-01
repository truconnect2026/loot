"use client";

import { useEffect, useState } from "react";
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
  created_at: string;
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
          "id, method, item_name, cost, sell_price, profit, verdict, platform, sold, created_at"
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

  // Aggregate footer numbers — total profit on items marked sold.
  const realized =
    rows
      ?.filter((r) => r.sold && r.profit != null)
      .reduce((sum, r) => sum + Number(r.profit), 0) ?? 0;
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
              return (
                <div
                  key={row.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
                    borderRadius: "4px 14px 14px 14px",
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
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
                    {row.profit != null && (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          fontSize: 14,
                          color: verdictColor,
                          marginTop: 2,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        ${Number(row.profit).toFixed(0)}
                      </span>
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
