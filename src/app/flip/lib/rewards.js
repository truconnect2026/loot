/**
 * Flip-or-skip reward economy — HONEST BY CONSTRUCTION.
 *
 * EVERY coin is contingent on real correct calls (the fenced correct/incorrect
 * determination in FlipGame). Nothing is granted for merely showing up or
 * merely finishing:
 *   - per-call coins come only from `a.correct`; a wrong call adds nothing and
 *     resets the combo;
 *   - the board-complete bonus is PROPORTIONAL to the share of correct calls,
 *     so an all-wrong board earns 0 and a perfect board earns the full bonus;
 *   - the daily-streak bonus is likewise scaled by that same accuracy, so a
 *     returning player who calls the board wrong banks 0 streak coins.
 * Therefore a board with zero correct calls pays zero from every source, and a
 * fresh player with no answers earns 0. The single WRITE to localStorage
 * happens once per real board completion in ResultReveal, gated to the first
 * (scored) play of the day so replays can never farm coins. No seed/scoring
 * value is touched — rewards are a layer on top of what is already true.
 */

export const COIN_BASE = 8; // coins per correct call, before the combo multiplier
export const COMPLETION_MAX = 40; // full board bonus — earned ONLY at 100% correct
export const STREAK_COIN = 12; // streak-bonus coins per consecutive day, pre-accuracy
export const STREAK_CAP = 120; // cap on the streak bonus before accuracy scaling

/**
 * Combo multiplier — escalates as consecutive correct calls build: 1x, then 2x
 * at a 3-combo, 3x at 6, 4x at 9. Only correct calls build the combo; a wrong
 * call resets it. Capped at 4x.
 * @param {number} combo current consecutive-correct count (after this call)
 */
export function comboMultiplier(combo) {
  return Math.min(4, 1 + Math.floor(Math.max(0, combo) / 3));
}

/** Count of genuinely correct calls on a board. The one source of truth every
 *  coin term is derived from. */
export function correctCount(answers) {
  let n = 0;
  for (const a of answers || []) if (a && a.correct) n += 1;
  return n;
}

/**
 * Walk a board's answers and sum the per-call coins. Coins come ONLY from
 * `correct` calls; a wrong call resets the combo to 0. Honest by construction:
 * a wrong call can never add coins. Recomputes cheaply as answers grow (used
 * live in the HUD) and deterministically at the payout.
 * @param {Array<{correct: boolean}>} answers
 * @returns {number}
 */
export function boardCallCoins(answers) {
  let combo = 0;
  let coins = 0;
  for (const a of answers || []) {
    if (a && a.correct) {
      combo += 1;
      coins += COIN_BASE * comboMultiplier(combo);
    } else {
      combo = 0;
    }
  }
  return coins;
}

/**
 * Board-complete bonus — PROPORTIONAL to the share of correct calls. Finishing
 * a board you called entirely wrong earns 0; a perfect board earns COMPLETION_MAX.
 * Honest: the "you finished the board" reward is still contingent on real
 * correct calls, never on merely answering all 10.
 * @param {Array<{correct: boolean}>} answers
 */
export function completionBonus(answers) {
  const total = (answers || []).length;
  if (total <= 0) return 0;
  return Math.round((COMPLETION_MAX * correctCount(answers)) / total);
}

/**
 * Daily-streak retention bonus — scaled by that same board accuracy, so it is
 * earned by coming back AND calling the board right, never by showing up and
 * swiping wrong. A returning player who gets 0 correct banks 0 streak coins.
 * @param {number} dailyStreak the earned consecutive-day streak
 * @param {Array<{correct: boolean}>} answers today's board
 */
export function streakBonus(dailyStreak, answers) {
  const total = (answers || []).length;
  if (total <= 0) return 0;
  const base = Math.min(STREAK_CAP, Math.max(0, dailyStreak) * STREAK_COIN);
  return Math.round((base * correctCount(answers)) / total);
}

/**
 * Full board payout = per-call coins + accuracy-scaled completion + accuracy-
 * scaled streak bonus. Every term is derived from the real answers, so a board
 * with zero correct calls returns { call: 0, completion: 0, streak: 0, total: 0 }.
 * @param {Array<{correct: boolean}>} answers
 * @param {number} dailyStreak
 * @returns {{ call: number, completion: number, streak: number, total: number }}
 */
export function boardPayout(answers, dailyStreak) {
  const call = boardCallCoins(answers);
  const completion = completionBonus(answers);
  const streak = streakBonus(dailyStreak, answers);
  return { call, completion, streak, total: call + completion + streak };
}

/** Current persisted coin balance (0 for a fresh player, or during SSR). */
export function readCoins() {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem("fos-coins") || "0", 10) || 0;
  } catch {
    return 0;
  }
}
