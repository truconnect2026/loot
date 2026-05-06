/**
 * Map raw API error strings to short, friendly user-facing copy.
 *
 * Every API surface in the app eventually hands a string back to the
 * UI layer (the `error` field on a 4xx/5xx response, an Anthropic
 * "overloaded" message, a fetch network failure). Showing those raw
 * strings — `503 Service Unavailable: Anthropic overloaded_error` —
 * leaks implementation details and reads as broken software. Run
 * everything through this helper before rendering.
 *
 * The categories are intentionally narrow:
 *   - 503/529/"overloaded": Anthropic capacity events; user just
 *     needs to retry in a minute.
 *   - timeout/ETIMEDOUT: network or upstream slowness.
 *   - 403/"limit": daily-quota hit; the dashboard surfaces a
 *     PaywallSheet for these so the copy here is just the label.
 *   - everything else: generic fallback. Don't try to be clever —
 *     guessing what an unrecognized error means is worse than a
 *     plain "try again" line.
 */
export function formatErrorMessage(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes("overloaded") || lower.includes("529") || lower.includes("503")) {
    return "AI is busy — try again in a moment";
  }
  if (lower.includes("timeout") || lower.includes("etimedout")) {
    return "request timed out — try again";
  }
  if (lower.includes("limit") || lower.includes("403")) {
    return "daily scan limit reached";
  }
  return "something went wrong — try again";
}
