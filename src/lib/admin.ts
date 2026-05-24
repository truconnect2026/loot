/**
 * Admin email allowlist. Reads from the ADMIN_EMAILS env var
 * (comma-separated, case-insensitive) and falls back to nothing if
 * unset — which means every admin route returns 403 until the env
 * var is configured. Safe default.
 *
 * Used by /admin pages and admin-only API routes for a one-line
 * "is this user allowed" check.
 */

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

let cached: Set<string> | null = null;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!cached) cached = parseAdminEmails();
  return cached.has(email.toLowerCase());
}
