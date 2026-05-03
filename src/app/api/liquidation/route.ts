import { NextResponse, type NextRequest } from "next/server";
import { liquidationAnalyze, type LiquidationResult } from "@/lib/claude";

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

export async function POST(
  req: NextRequest,
): Promise<NextResponse<LiquidationResult | { error: string }>> {
  let body: LiquidationBody;
  try {
    body = (await req.json()) as LiquidationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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
    const message = err instanceof Error ? err.message : "Liquidation analysis failed";
    console.error("Liquidation error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
