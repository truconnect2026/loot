import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * OAuth / magic-link callback.
 * Supabase redirects here with ?code=... after successful auth.
 * We exchange the code for a session and redirect to /app.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const origin = request.nextUrl.origin;

  // Supabase returned an error (e.g. "requested path is invalid")
  if (error) {
    const loginUrl = new URL("/", origin);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
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
    if (!exchangeError) {
      return NextResponse.redirect(new URL("/app", origin));
    }

    // Exchange failed — redirect to login with error
    const loginUrl = new URL("/", origin);
    loginUrl.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(loginUrl);
  }

  // No code and no error — just go to login
  return NextResponse.redirect(new URL("/", origin));
}
