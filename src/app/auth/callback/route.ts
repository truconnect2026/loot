import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * OAuth / magic-link callback.
 * Supabase redirects here with ?code=... after successful auth.
 * We exchange the code for a session and redirect onward.
 *
 * Optional ?next= query param chooses the post-auth destination.
 * Locked to a small allowlist of in-app paths so a malicious
 * referrer can't turn the callback into an open redirect. Any
 * additional query params on the callback URL (e.g. order_id from
 * the Digistore webhook's magic link) are preserved and forwarded
 * to the destination — `code`, `next`, `error`, and
 * `error_description` are stripped because they belong to the
 * callback hop, not the landing page.
 *
 * Default destination remains /app when ?next is missing or
 * rejected, matching the prior behaviour of this route.
 */

// Allowlist of acceptable ?next= destinations. Paths only — no
// origins, no query strings, no fragments. If the value isn't in
// this Set exactly, we fall back to /app.
const ALLOWED_NEXT = new Set(["/app", "/thanks", "/welcome"]);

// Returns a validated path. Rejects: missing values, anything that
// doesn't start with '/', protocol-relative URLs ('//evil.com'), and
// anything outside the allowlist. All four rejection paths fall back
// to /app so a tampered link still lands the user somewhere safe and
// authenticated rather than 404 or external.
function safeNext(raw: string | null): string {
  if (!raw) return "/app";
  if (!raw.startsWith("/")) return "/app";
  if (raw.startsWith("//")) return "/app";
  if (!ALLOWED_NEXT.has(raw)) return "/app";
  return raw;
}

// Keys consumed by the callback itself — strip these before
// forwarding the remaining query string to the destination so the
// landing page doesn't see leftover Supabase plumbing.
const CALLBACK_KEYS = new Set(["code", "next", "error", "error_description"]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const origin = url.origin;

  // Supabase returned an error (e.g. "requested path is invalid")
  if (error) {
    const loginUrl = new URL("/", origin);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    // No code and no error — just go to login
    return NextResponse.redirect(new URL("/", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const loginUrl = new URL("/", origin);
    loginUrl.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(loginUrl);
  }

  // Session is set. Pick the destination from the validated ?next=
  // (allowlist + path-shape checks) and forward any caller query
  // params (e.g. order_id from the Digistore magic-link flow). The
  // callback-internal keys are stripped via CALLBACK_KEYS.
  const next = safeNext(url.searchParams.get("next"));
  const destination = new URL(next, origin);
  for (const [k, v] of url.searchParams) {
    if (CALLBACK_KEYS.has(k)) continue;
    destination.searchParams.set(k, v);
  }
  return NextResponse.redirect(destination);
}
