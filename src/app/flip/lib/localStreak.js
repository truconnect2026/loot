/**
 * READ-ONLY personal-streak reader for the flip-or-skip intro.
 *
 * The streak itself is MAINTAINED (written) by ResultReveal.jsx on game
 * completion — it keeps `fos-streak-count` and `fos-last-played-date` with the
 * standard daily-streak rule (played yesterday → +1, already today → same,
 * otherwise → reset to 1). This helper NEVER writes and NEVER touches the
 * one-round-a-day gating; it only READS those same records so the intro can
 * show the visitor's REAL, EARNED streak instead of the global epoch day.
 *
 * Honesty guarantees:
 *  - A visitor with no play record (or a count of 0) is FRESH → streak 0 → the
 *    intro shows the newcomer hook, never a number.
 *  - A stored streak is only "alive" if the last play was today or yesterday
 *    (the run can still be continued). If a full day was missed, the run is
 *    broken → streak 0 → newcomer hook, never a stale/unearned number.
 *
 * Client-only: returns { streak: 0, isFresh: true } during SSR (no localStorage).
 */

function ymdLocal(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/**
 * @returns {{ streak: number, isFresh: boolean }}
 *   streak  = the earned, still-alive consecutive-day streak (0 if none/broken)
 *   isFresh = true when there is no play record at all (a true first-timer)
 */
export function readLiveStreak() {
  if (typeof window === "undefined") return { streak: 0, isFresh: true };
  try {
    const last = localStorage.getItem("fos-last-played-date"); // last COMPLETED day (YYYY-MM-DD)
    const count = parseInt(localStorage.getItem("fos-streak-count") || "0", 10) || 0;
    if (!last || count <= 0) return { streak: 0, isFresh: true };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const t = ymdLocal(today);
    const y = ymdLocal(yesterday);

    // Alive only if the last play was today or yesterday; otherwise the run
    // was broken by a missed day and the stored count is not currently earned.
    if (last === t || last === y) return { streak: count, isFresh: false };
    return { streak: 0, isFresh: false };
  } catch {
    return { streak: 0, isFresh: true };
  }
}
