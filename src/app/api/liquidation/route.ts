import { NextResponse, type NextRequest } from "next/server";
import { liquidationAnalyze, type LiquidationResult } from "@/lib/claude";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FREE_SCAN_LIMIT } from "@/lib/limits";

interface LiquidationBody {
  manifestText?: string;
  manifestUrl?: string;
}

const MAX_FETCH_BYTES = 200_000;

// Light-touch HTML→text — pulls visible text out of common page
// structures (drops <script>, <style>, comments). Keeps the body
// short enough that Claude can chew through the manifest without
// blowing the context budget.
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchManifest(url: string): Promise<string> {
  // Same-origin attempts here would 404 in the dev server; this is a
  // server-side fetch so it can hit any public URL. 8s timeout via
  // AbortSignal — manifests are usually small static pages.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/html,*/*" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Manifest fetch failed (${res.status})`);
    }
    const text = await res.text();
    return text.slice(0, MAX_FETCH_BYTES);
  } finally {
    clearTimeout(timer);
  }
}

// Spend gate — mirrors the /api/shelf-scan auth pattern (same client
// construction, same profiles.is_pro + PRO_TEST_EMAILS check, same
// 401/403 body shapes). Pro-only: FREE_SCAN_LIMIT is 0, so a non-Pro
// or anonymous caller can never reach the manifest fetch or Claude call
// below. Returns a response to send immediately, or null to proceed.
async function checkSpendGate(): Promise<NextResponse<{
  error: string;
  message?: string;
  scans_used?: number;
  scans_limit?: number;
}> | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return NextResponse.json(
        { error: "signup_required", message: "sign in to use this tool" },
        { status: 401 },
      );
    }
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .maybeSingle();
    const testProEmails = (process.env.PRO_TEST_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isTestPro = user.email
      ? testProEmails.includes(user.email.toLowerCase())
      : false;
    if (profileRow?.is_pro === true || isTestPro) return null;
    return NextResponse.json(
      {
        error: "Upgrade to Pro for unlimited scans.",
        scans_used: 0,
        scans_limit: FREE_SCAN_LIMIT,
      },
      { status: 403 },
    );
  } catch (gateErr) {
    // Fail-open on gate error, matching /api/scan + /api/shelf-scan:
    // don't 500 a paying user mid-flow during a Supabase blip.
    console.error("Spend gate check failed:", gateErr);
    return null;
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<LiquidationResult | { error: string }>> {
  let body: LiquidationBody;
  try {
    body = (await req.json()) as LiquidationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Gate BEFORE the manifest URL fetch — that server-side fetch is
  // itself an abusable resource for anonymous callers, not just the
  // Claude call downstream.
  const gate = await checkSpendGate();
  if (gate) return gate;

  let manifest = (body.manifestText ?? "").trim();

  if (!manifest && body.manifestUrl) {
    try {
      const html = await fetchManifest(body.manifestUrl.trim());
      manifest = stripHtml(html);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not fetch manifest URL";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!manifest) {
    return NextResponse.json(
      { error: "Provide manifestText or manifestUrl" },
      { status: 400 },
    );
  }

  try {
    const result = await liquidationAnalyze(manifest);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Liquidation error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
