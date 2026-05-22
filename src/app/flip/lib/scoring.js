/**
 * Phase 2 scoring — price-guess accuracy + final round score.
 *
 * Phase 1 correctness (swipe right on a flip, swipe left on a skip) is
 * computed inline in FlipGame as `answer.choice === "flip" === item.isFlip`.
 * This module handles the price-guess scoring and the final tally.
 */

/**
 * @typedef {"grail"|"sharp"|"fair"|"off"} PriceTier
 */

/**
 * Compare a user's price guess against the actual resell estimate.
 * Returns the tier bucket + a score multiplier used by calcTotalScore.
 *
 * @param {number} guess
 * @param {number} actual
 * @returns {{ tier: PriceTier, percentOff: number, scoreMultiplier: number }}
 */
export function calcPriceAccuracy(guess, actual) {
  if (!actual || actual <= 0) {
    return { tier: "off", percentOff: 1, scoreMultiplier: 0 };
  }
  const percentOff = Math.abs(guess - actual) / actual;
  if (percentOff < 0.10) return { tier: "grail", percentOff, scoreMultiplier: 1.5 };
  if (percentOff < 0.25) return { tier: "sharp", percentOff, scoreMultiplier: 1.0 };
  if (percentOff < 0.50) return { tier: "fair", percentOff, scoreMultiplier: 0.5 };
  return { tier: "off", percentOff, scoreMultiplier: 0.0 };
}

/**
 * Roll up the round.
 *
 * @param {Array<{item: any, choice: "flip"|"skip", correct: boolean}>} answers
 * @param {Object<string, { guess: number, tier: PriceTier, scoreMultiplier: number }>} priceGuesses
 */
export function calcTotalScore(answers, priceGuesses = {}) {
  const total = answers.length || 10;
  const swipeScore = answers.filter((a) => a.correct).length;
  const swipeAccuracy = total > 0 ? swipeScore / total : 0;

  const correctFlips = answers.filter((a) => a.correct && a.choice === "flip");
  const totalDollarsSpotted = correctFlips.reduce(
    (sum, a) => sum + (a.item?.resellEst || 0),
    0,
  );

  let priceScore = 0;
  let grailCount = 0;
  let sharpCount = 0;
  for (const a of correctFlips) {
    const g = priceGuesses[a.item.id];
    if (!g) continue;
    priceScore += (a.item.resellEst || 0) * g.scoreMultiplier;
    if (g.tier === "grail") grailCount += 1;
    if (g.tier === "sharp") sharpCount += 1;
  }

  // Final score 0–100. Swipe is up to 50 pts (5 each). Price portion is up to
  // 50 pts, scaled by the fraction of spottable dollars they captured (with
  // grail multipliers boosting them past 1.0 ⇒ clamp).
  const swipePortion = swipeScore * 5;
  const priceCeiling = totalDollarsSpotted * 1.5; // grails everything = 1.5×
  const pricePortion =
    priceCeiling > 0 ? Math.min(50, (priceScore / priceCeiling) * 50) : 0;
  const finalScore = Math.round(Math.min(100, swipePortion + pricePortion));

  // Missed flips: items they should have called but didn't.
  const missedFlipItems = answers.filter(
    (a) => !a.correct && a.choice === "skip" && a.item?.isFlip,
  );
  const missedFlips = missedFlipItems.length;
  const missedDollars = missedFlipItems.reduce(
    (sum, a) => sum + (a.item?.resellEst || 0),
    0,
  );

  return {
    swipeScore,
    swipeAccuracy,
    priceScore: Math.round(priceScore),
    grailCount,
    sharpCount,
    totalDollarsSpotted: Math.round(totalDollarsSpotted),
    missedFlips,
    missedDollars: Math.round(missedDollars),
    finalScore,
  };
}

/**
 * @param {number} finalScore 0–100
 * @returns {"wolf"|"solid"|"mid"|"rip"}
 */
export function getScoreTier(finalScore) {
  if (finalScore >= 90) return "wolf";
  if (finalScore >= 70) return "solid";
  if (finalScore >= 50) return "mid";
  return "rip";
}
