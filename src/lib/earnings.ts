/**
 * Pure earnings projection for the /partners earnings calculator.
 *
 * Assumptions documented as constants so a creator inspecting the math
 * sees exactly what we modeled. Founding 20 rates are hardcoded — this
 * widget is specifically for the founding pitch.
 */

export const FOUNDING_SETUP_MONTHLY = 9.0; // 60% of $14.99
export const FOUNDING_RECURRING_MONTHLY = 5.99; // 40% of $14.99
export const FOUNDING_SETUP_ANNUAL = 40.0; // 40% of $99.99
export const FOUNDING_RECURRING_ANNUAL = 30.0; // 30% of $99.99 (annual renewal)

export const MONTHLY_CLICK_RATE = 0.08; // ~8% of audience clicks affiliate link per month
export const MONTHLY_CHURN_MONTHLY_PLAN = 0.08; // 8% monthly churn on month-to-month subs
export const ANNUAL_CHURN = 0.2; // 20% annualized churn for annual subs

export type CalcInputs = {
  audienceSize: number; // followers
  conversionRate: number; // 0-1 (i.e. 0.005 = 0.5%)
  monthlyMix: number; // 0-1 (fraction of subscribers on monthly plan)
};

export type CalcOutputs = {
  signupsPerMonth: number;
  month1Earnings: number;
  year1Earnings: number;
  threeYearEarnings: number;
};

export function calculateEarnings({
  audienceSize,
  conversionRate,
  monthlyMix,
}: CalcInputs): CalcOutputs {
  const monthlyClicks = audienceSize * MONTHLY_CLICK_RATE;
  const signupsPerMonth = Math.round(monthlyClicks * conversionRate);
  const annualMix = 1 - monthlyMix;

  const month1Earnings =
    signupsPerMonth * monthlyMix * FOUNDING_SETUP_MONTHLY +
    signupsPerMonth * annualMix * FOUNDING_SETUP_ANNUAL;

  const simulate = (months: number) => {
    let monthlySubs = 0;
    let annualSubs = 0;
    let total = 0;
    const newMonthly = signupsPerMonth * monthlyMix;
    const newAnnual = signupsPerMonth * annualMix;
    const annualChurnMonthly = ANNUAL_CHURN / 12;

    for (let m = 1; m <= months; m++) {
      monthlySubs = monthlySubs * (1 - MONTHLY_CHURN_MONTHLY_PLAN);
      annualSubs = annualSubs * (1 - annualChurnMonthly);
      monthlySubs += newMonthly;
      annualSubs += newAnnual;
      total += newMonthly * FOUNDING_SETUP_MONTHLY;
      total += newAnnual * FOUNDING_SETUP_ANNUAL;
      total += monthlySubs * FOUNDING_RECURRING_MONTHLY;
      if (m % 12 === 0) total += annualSubs * FOUNDING_RECURRING_ANNUAL;
    }
    return total;
  };

  return {
    signupsPerMonth,
    month1Earnings: Math.round(month1Earnings),
    year1Earnings: Math.round(simulate(12)),
    threeYearEarnings: Math.round(simulate(36)),
  };
}

/** Slider 0-100 → logarithmic audience size in [1000, 500000]. */
export function sliderToAudience(slider: number): number {
  const min = Math.log(1000);
  const max = Math.log(500000);
  const raw = Math.exp(min + (max - min) * (slider / 100));
  // Snap to clean buckets
  if (raw < 5000) return Math.round(raw / 500) * 500;
  if (raw < 25000) return Math.round(raw / 1000) * 1000;
  if (raw < 100000) return Math.round(raw / 5000) * 5000;
  return Math.round(raw / 10000) * 10000;
}

export function formatAudience(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}
