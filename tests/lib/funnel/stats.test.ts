import { describe, it, expect } from "vitest";
import {
  calculateConversionRate,
  calculateABTestSignificance,
  shouldAutoSelectWinner,
} from "@/lib/funnel/stats";

describe("calculateConversionRate", () => {
  it("returns 0 when visitors is 0", () => {
    expect(calculateConversionRate(0, 0)).toBe(0);
  });

  it("returns 0 when conversions is 0", () => {
    expect(calculateConversionRate(0, 100)).toBe(0);
  });

  it("calculates correct conversion rate", () => {
    expect(calculateConversionRate(25, 100)).toBe(25);
  });

  it("returns fractional rates correctly", () => {
    expect(calculateConversionRate(1, 3)).toBeCloseTo(33.33, 1);
  });

  it("caps at 100% even when conversions exceed visitors", () => {
    expect(calculateConversionRate(150, 100)).toBe(100);
  });

  it("handles exact 100% conversion", () => {
    expect(calculateConversionRate(100, 100)).toBe(100);
  });
});

describe("calculateABTestSignificance", () => {
  it("returns not significant when both variants have no data", () => {
    const result = calculateABTestSignificance(0, 0, 0, 0);
    expect(result.significant).toBe(false);
    expect(result.winner).toBeNull();
  });

  it("returns not significant for small sample sizes", () => {
    const result = calculateABTestSignificance(2, 10, 3, 10);
    expect(result.significant).toBe(false);
  });

  it("detects significance with large enough difference and sample size", () => {
    // A: 50% conversion (500/1000), B: 30% conversion (300/1000) — large, clear difference
    const result = calculateABTestSignificance(500, 1000, 300, 1000);
    expect(result.significant).toBe(true);
    expect(result.winner).toBe("a");
  });

  it("declares B the winner when B has higher significant conversion", () => {
    const result = calculateABTestSignificance(300, 1000, 500, 1000);
    expect(result.significant).toBe(true);
    expect(result.winner).toBe("b");
  });

  it("returns confidence as a number between 0 and 100", () => {
    const result = calculateABTestSignificance(50, 100, 30, 100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("returns not significant when rates are equal", () => {
    const result = calculateABTestSignificance(50, 100, 50, 100);
    expect(result.significant).toBe(false);
    expect(result.winner).toBeNull();
  });

  it("returns not significant when visitors A is 0", () => {
    const result = calculateABTestSignificance(0, 0, 50, 100);
    expect(result.significant).toBe(false);
  });
});

describe("shouldAutoSelectWinner", () => {
  it("returns false when test is not active", () => {
    const result = shouldAutoSelectWinner(1000, 1000, 500, 300, false);
    expect(result).toBe(false);
  });

  it("returns false when visitors A is below 100", () => {
    const result = shouldAutoSelectWinner(50, 1000, 25, 300, true);
    expect(result).toBe(false);
  });

  it("returns false when visitors B is below 100", () => {
    const result = shouldAutoSelectWinner(1000, 50, 500, 25, true);
    expect(result).toBe(false);
  });

  it("returns false when both have 100+ visitors but no significance", () => {
    // Nearly equal conversion rates
    const result = shouldAutoSelectWinner(100, 100, 50, 50, true);
    expect(result).toBe(false);
  });

  it("returns true when test is active, 100+ visitors each, and result is significant", () => {
    // A: 50% (500/1000), B: 30% (300/1000) — significant difference
    const result = shouldAutoSelectWinner(1000, 1000, 500, 300, true);
    expect(result).toBe(true);
  });

  it("returns false when exactly 99 visitors on one side", () => {
    const result = shouldAutoSelectWinner(99, 1000, 50, 300, true);
    expect(result).toBe(false);
  });
});
