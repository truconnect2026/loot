import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * OAuth / magic-link callback.
 * Exchanges the auth code for a session, then redirects to /app.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectUrl = request.nextUrl.clone();

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirectUrl.pathname = "/app";
      redirectUrl.searchParams.delete("code");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Auth failed — send back to login
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.delete("code");
  return NextResponse.redirect(redirectUrl);
}
