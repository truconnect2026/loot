import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface ScanRow {
  created_at: string;
  item_name: string | null;
  method: string | null;
  cost: number | null;
  sell_price: number | null;
  profit: number | null;
  verdict: string | null;
  platform: string | null;
  sold: boolean | null;
  sold_price: number | null;
  sold_at: string | null;
}

const COLUMNS = [
  "Date",
  "Item Name",
  "Method",
  "Cost",
  "Sell Price",
  "Profit",
  "Verdict",
  "Platform",
  "Sold",
  "Sold Price",
  "Sold Date",
];

// RFC 4180 — quote any field that contains a comma, quote, or newline,
// and double internal quotes. Empty / null becomes an empty cell.
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toFixed(2);
}

function fmtMethod(m: string | null): string {
  if (m === "barcode") return "UPC";
  if (m === "vision") return "AI Vision";
  return m ?? "";
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("scans")
    .select(
      "created_at, item_name, method, cost, sell_price, profit, verdict, platform, sold, sold_price, sold_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as ScanRow[];
  const lines = [COLUMNS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        fmtDate(r.created_at),
        csvEscape(r.item_name),
        csvEscape(fmtMethod(r.method)),
        fmtNum(r.cost),
        fmtNum(r.sell_price),
        fmtNum(r.profit),
        csvEscape(r.verdict),
        csvEscape(r.platform),
        r.sold ? "yes" : "no",
        fmtNum(r.sold_price),
        fmtDate(r.sold_at),
      ].join(","),
    );
  }
  // Excel sniffs a leading BOM as a UTF-8 hint — without it, accented
  // characters in item names render as mojibake when opened directly.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="loot-haul-log.csv"',
      "Cache-Control": "no-store",
    },
  });
}
