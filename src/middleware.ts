import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth middleware:
 * - Authed users hitting / → redirect to /app (the dashboard then
 *   bounces them to /onboarding if they haven't set a zip yet).
 * - Unauthed users hitting /app, /account, or /onboarding → /
 * - Always refreshes the session so cookies stay valid.
 *
 * The onboarding gate (zip-required-before-dashboard) lives in the
 * dashboard component itself, not here, because that check needs a
 * profiles-table query which we don't want to run on every request.
 */

const PROTECTED = ["/app", "/account", "/onboarding"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
    return NextResponse.redirect(url);
  }

  // Unauthed user on protected page → go to login
  if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/", "/app/:path*", "/account/:path*", "/onboarding/:path*"],
};
