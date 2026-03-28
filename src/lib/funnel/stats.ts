import type { ABTestResult } from "./types";

export function calculateConversionRate(conversions: number, visitors: number): number {
  if (visitors === 0) return 0;
  const rate = (conversions / visitors) * 100;
  return Math.min(rate, 100);
}

/**
 * Two-proportion z-test for A/B significance.
 * Returns { significant, winner, confidence } where confidence is 0-100.
 */
export function calculateABTestSignificance(
  conversionsA: number,
  visitorsA: number,
  conversionsB: number,
  visitorsB: number
): ABTestResult {
  if (visitorsA === 0 || visitorsB === 0) {
    return { significant: false, winner: null, confidence: 0 };
  }

  const rateA = conversionsA / visitorsA;
  const rateB = conversionsB / visitorsB;

  if (rateA === rateB) {
    return { significant: false, winner: null, confidence: 0 };
  }

  const pooled = (conversionsA + conversionsB) / (visitorsA + visitorsB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / visitorsA + 1 / visitorsB));

  if (se === 0) {
    return { significant: false, winner: null, confidence: 0 };
  }

  const z = Math.abs(rateA - rateB) / se;

  // Approximate p-value from z-score using complementary error function
  const confidence = Math.min(100, normalCDF(z) * 100);
  const significant = confidence >= 95;
  const winner = significant ? (rateA > rateB ? "a" : "b") : null;

  return { significant, winner, confidence };
}

/**
 * Standard normal CDF approximation (one-sided, for z >= 0).
 * Returns the probability that the result is due to the treatment (1 - p-value for two-sided).
 */
function normalCDF(z: number): number {
  // Abramowitz and Stegun approximation (one-sided, P(Z <= z))
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  // This gives one-sided probability of being in tail; we want confidence = 1 - 2*p
  return 1 - 2 * p;
}

export function shouldAutoSelectWinner(
  visitorsA: number,
  visitorsB: number,
  conversionsA: number,
  conversionsB: number,
  testActive: boolean
): boolean {
  if (!testActive) return false;
  if (visitorsA < 100 || visitorsB < 100) return false;
  const result = calculateABTestSignificance(conversionsA, visitorsA, conversionsB, visitorsB);
  return result.significant;
}
