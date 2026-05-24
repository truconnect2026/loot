import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth + affiliate middleware:
 * - Authed users hitting / → redirect to /app (the dashboard then
 *   bounces them to /onboarding if they haven't set a zip yet).
 * - Unauthed users hitting /app, /account, or /onboarding → /
 * - Always refreshes the session so cookies stay valid.
 * - If the URL carries ?aff=... or ?ref=..., stamp the loot_aff_*
 *   cookies so the upgrade UI knows to route checkout through the
 *   Digistore affiliate funnel instead of Stripe (higher payout for
 *   the affiliate, slightly higher fee for us — only used when an
 *   affiliate sent the traffic).
 *
 * The onboarding gate (zip-required-before-dashboard) lives in the
 * dashboard component itself, not here, because that check needs a
 * profiles-table query which we don't want to run on every request.
 *
 * Public routes — intentionally kept outside the `matcher` below so
 * Supabase + redirect logic never runs on them. Affiliate buyers and
 * press hitting these pages must not be bounced through auth. Keep
 * this list in sync with the matcher when adding marketing pages.
 *   - /pro       — Digistore-driven Pro landing page
 *   - /kit       — public brand + partner kit + affiliate hub (absorbs
 *                  /affiliates and /partners — see next.config redirects)
 *   - /flip      — daily Flip-or-Skip game
 *   - /welcome, /thanks, /privacy, /terms — static marketing
 */

// /onboarding is intentionally NOT in PROTECTED — unauthed visitors get
// an in-page "sign in to continue setup" view rather than a silent
// redirect to /. The page's own Supabase check still handles authed
// users (route them to /app if they already have a zip saved, else
// render the capture form).
const PROTECTED = ["/app", "/account"];

// Exact paths that LOOK protected but render a public marketing preview when
// unauthed. /app shows AppMarketingPreview to unauth visitors; /app/haul,
// /app/scan, /app/settings, /app/* sub-routes still redirect normally.
const PUBLIC_PREVIEW_EXACT = new Set(["/app"]);

const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function setAffCookies(
  response: NextResponse,
  affId: string,
): void {
  const opts = {
    maxAge: AFF_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    // httpOnly: false — the upgrade UI reads these client-side to
    // build the Digistore checkout URL with the right aff/campaign
    // params. They aren't auth-bearing, so client read is fine.
    httpOnly: false,
    path: "/",
  };
  response.cookies.set("loot_aff_source", "digistore", opts);
  response.cookies.set("loot_aff_id", affId, opts);
  response.cookies.set("loot_aff_campaign", affId, opts);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Stamp affiliate cookies before any redirect: if we redirect, we
  // copy the cookies onto the redirect response below so they survive.
  const affId =
    request.nextUrl.searchParams.get("aff") ||
    request.nextUrl.searchParams.get("ref") ||
    null;
  if (affId) {
    setAffCookies(response, affId);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Refresh session — must call getUser() not getSession() per Supabase docs.
  // Wrapped in try/catch so a transient network blip doesn't 500 the page;
  // the worst case is the user gets the unauthed branch and redirects to
  // login, which is recoverable.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    /* network failure — treat as unauthed */
  }

  const { pathname } = request.nextUrl;

  // Authed user on login page → go to dashboard
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    const redirect = NextResponse.redirect(url);
    if (affId) setAffCookies(redirect, affId);
    return redirect;
  }

  // Unauthed user on protected page → go to login, EXCEPT the public-preview
  // exact paths (e.g. /app exact renders AppMarketingPreview).
  if (
    !user &&
    PROTECTED.some((p) => pathname.startsWith(p)) &&
    !PUBLIC_PREVIEW_EXACT.has(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirect = NextResponse.redirect(url);
    if (affId) setAffCookies(redirect, affId);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/", "/app/:path*", "/account/:path*"],
};
