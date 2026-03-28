import { describe, it, expect } from "vitest";
import {
  calculateBudgetRollup,
  calculateChannelPerformance,
  calculateFunnelConversions,
  calculateDropOffRates,
  calculateTimeInStage,
  calculateCohortRetention,
  calculateCostPerAcquisition,
  calculateLTV,
  calculatePillarPerformance,
} from "@/lib/campaigns/analytics";

// ─── calculateBudgetRollup ────────────────────────────────────────────────────

describe("calculateBudgetRollup", () => {
  it("sums planned and actual entries separately", () => {
    const entries = [
      { entry_type: "planned" as const, amount: 500 },
      { entry_type: "planned" as const, amount: 300 },
      { entry_type: "actual" as const, amount: 400 },
    ];
    const result = calculateBudgetRollup(entries);
    expect(result.planned).toBe(800);
    expect(result.actual).toBe(400);
  });

  it("calculates variance and variancePct correctly", () => {
    const entries = [
      { entry_type: "planned" as const, amount: 1000 },
      { entry_type: "actual" as const, amount: 800 },
    ];
    const result = calculateBudgetRollup(entries);
    expect(result.variance).toBe(200);
    expect(result.variancePct).toBeCloseTo(20, 1);
  });

  it("handles zero planned budget (no division by zero)", () => {
    const entries = [{ entry_type: "actual" as const, amount: 500 }];
    const result = calculateBudgetRollup(entries);
    expect(result.planned).toBe(0);
    expect(result.variancePct).toBe(0);
  });

  it("returns all zeros for empty entries", () => {
    const result = calculateBudgetRollup([]);
    expect(result).toEqual({ planned: 0, actual: 0, variance: 0, variancePct: 0 });
  });
});

// ─── calculateChannelPerformance ─────────────────────────────────────────────

describe("calculateChannelPerformance", () => {
  it("groups events by channel and counts correctly", () => {
    const events = [
      { channel: "email", event_type: "impression" },
      { channel: "email", event_type: "click" },
      { channel: "email", event_type: "conversion" },
      { channel: "social", event_type: "impression" },
      { channel: "social", event_type: "impression" },
    ];
    const result = calculateChannelPerformance(events);
    expect(result["email"].impressions).toBe(1);
    expect(result["email"].clicks).toBe(1);
    expect(result["email"].conversions).toBe(1);
    expect(result["social"].impressions).toBe(2);
    expect(result["social"].clicks).toBe(0);
    expect(result["social"].conversions).toBe(0);
  });

  it("returns empty object for empty events", () => {
    expect(calculateChannelPerformance([])).toEqual({});
  });

  it("handles null channels by grouping under 'unknown'", () => {
    const events = [{ channel: null, event_type: "click" }];
    const result = calculateChannelPerformance(events);
    expect(result["unknown"]).toBeDefined();
    expect(result["unknown"].clicks).toBe(1);
  });
});

// ─── calculateFunnelConversions ───────────────────────────────────────────────

describe("calculateFunnelConversions", () => {
  it("counts contacts per stage", () => {
    const contacts = [
      { stage: "lead" },
      { stage: "lead" },
      { stage: "mql" },
      { stage: "customer" },
    ];
    const result = calculateFunnelConversions(contacts);
    const leadStage = result.find((r) => r.stage === "lead");
    const mqlStage = result.find((r) => r.stage === "mql");
    expect(leadStage?.count).toBe(2);
    expect(mqlStage?.count).toBe(1);
  });

  it("calculates rate relative to total contacts", () => {
    const contacts = [
      { stage: "lead" },
      { stage: "lead" },
      { stage: "mql" },
      { stage: "mql" },
      { stage: "customer" },
    ];
    const result = calculateFunnelConversions(contacts);
    const customerStage = result.find((r) => r.stage === "customer");
    expect(customerStage?.rate).toBeCloseTo(0.2, 5);
  });

  it("returns empty array for empty contacts", () => {
    expect(calculateFunnelConversions([])).toEqual([]);
  });
});

// ─── calculateDropOffRates ────────────────────────────────────────────────────

describe("calculateDropOffRates", () => {
  it("calculates percentage lost between stage pairs", () => {
    const stageData = [
      { stage: "lead", count: 100 },
      { stage: "mql", count: 60 },
      { stage: "sql", count: 30 },
      { stage: "customer", count: 10 },
    ];
    const result = calculateDropOffRates(stageData);
    expect(result[0].from).toBe("lead");
    expect(result[0].to).toBe("mql");
    expect(result[0].dropOffPct).toBeCloseTo(40, 1);
    expect(result[1].dropOffPct).toBeCloseTo(50, 1);
  });

  it("returns empty array for single or empty stage data", () => {
    expect(calculateDropOffRates([])).toEqual([]);
    expect(calculateDropOffRates([{ stage: "lead", count: 100 }])).toEqual([]);
  });

  it("handles 100% drop-off (next stage is 0)", () => {
    const stageData = [
      { stage: "lead", count: 50 },
      { stage: "customer", count: 0 },
    ];
    const result = calculateDropOffRates(stageData);
    expect(result[0].dropOffPct).toBe(100);
  });
});

// ─── calculateTimeInStage ─────────────────────────────────────────────────────

describe("calculateTimeInStage", () => {
  it("calculates average days per stage using created_at and updated_at", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const contacts = [
      { stage: "lead", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-11T00:00:00Z" },
      { stage: "lead", created_at: "2026-01-05T00:00:00Z", updated_at: "2026-01-15T00:00:00Z" },
      { stage: "mql", created_at: "2026-01-10T00:00:00Z", updated_at: "2026-01-13T00:00:00Z" },
    ];
    const result = calculateTimeInStage(contacts);
    expect(result["lead"]).toBeCloseTo(10, 0);
    expect(result["mql"]).toBeCloseTo(3, 0);
  });

  it("returns empty object for empty contacts", () => {
    expect(calculateTimeInStage([])).toEqual({});
  });

  it("handles single contact in a stage", () => {
    const contacts = [
      { stage: "sql", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-06T00:00:00Z" },
    ];
    const result = calculateTimeInStage(contacts);
    expect(result["sql"]).toBeCloseTo(5, 0);
  });
});

// ─── calculateCohortRetention ─────────────────────────────────────────────────

describe("calculateCohortRetention", () => {
  it("groups contacts by signup month", () => {
    const contacts = [
      { created_at: "2026-01-05T00:00:00Z", stage: "lead" },
      { created_at: "2026-01-20T00:00:00Z", stage: "mql" },
      { created_at: "2026-02-10T00:00:00Z", stage: "lead" },
    ];
    const result = calculateCohortRetention(contacts, 30);
    const jan = result.find((c) => c.cohort === "2026-01");
    const feb = result.find((c) => c.cohort === "2026-02");
    expect(jan?.total).toBe(2);
    expect(feb?.total).toBe(1);
  });

  it("returns empty array for empty contacts", () => {
    expect(calculateCohortRetention([], 30)).toEqual([]);
  });

  it("includes stage breakdown per cohort", () => {
    const contacts = [
      { created_at: "2026-03-01T00:00:00Z", stage: "lead" },
      { created_at: "2026-03-15T00:00:00Z", stage: "customer" },
    ];
    const result = calculateCohortRetention(contacts, 30);
    const march = result.find((c) => c.cohort === "2026-03");
    expect(march?.stages["lead"]).toBe(1);
    expect(march?.stages["customer"]).toBe(1);
  });
});

// ─── calculateCostPerAcquisition ──────────────────────────────────────────────

describe("calculateCostPerAcquisition", () => {
  it("divides spend by conversions", () => {
    expect(calculateCostPerAcquisition(1000, 10)).toBe(100);
  });

  it("returns 0 when conversions is zero (no division by zero)", () => {
    expect(calculateCostPerAcquisition(500, 0)).toBe(0);
  });

  it("returns 0 when spend is zero", () => {
    expect(calculateCostPerAcquisition(0, 10)).toBe(0);
  });

  it("handles fractional CPA", () => {
    expect(calculateCostPerAcquisition(100, 3)).toBeCloseTo(33.33, 1);
  });
});

// ─── calculateLTV ─────────────────────────────────────────────────────────────

describe("calculateLTV", () => {
  it("returns average revenue per customer", () => {
    expect(calculateLTV(10000, 100)).toBe(100);
  });

  it("returns 0 when customers is zero (no division by zero)", () => {
    expect(calculateLTV(5000, 0)).toBe(0);
  });

  it("returns 0 when revenue is zero", () => {
    expect(calculateLTV(0, 50)).toBe(0);
  });

  it("handles fractional LTV", () => {
    expect(calculateLTV(1000, 3)).toBeCloseTo(333.33, 1);
  });
});

// ─── calculatePillarPerformance ───────────────────────────────────────────────

describe("calculatePillarPerformance", () => {
  it("groups content items by pillar and counts published items", () => {
    const items = [
      { pillar: "education", status: "published" },
      { pillar: "education", status: "published" },
      { pillar: "education", status: "draft" },
      { pillar: "inspiration", status: "published" },
    ];
    const result = calculatePillarPerformance(items);
    expect(result["education"].published).toBe(2);
    expect(result["education"].total).toBe(3);
    expect(result["inspiration"].published).toBe(1);
    expect(result["inspiration"].total).toBe(1);
  });

  it("returns empty object for empty items", () => {
    expect(calculatePillarPerformance([])).toEqual({});
  });

  it("handles null pillar by grouping under 'uncategorized'", () => {
    const items = [{ pillar: null, status: "published" }];
    const result = calculatePillarPerformance(items);
    expect(result["uncategorized"]).toBeDefined();
    expect(result["uncategorized"].published).toBe(1);
  });

  it("only counts published items in published count", () => {
    const items = [
      { pillar: "trust", status: "draft" },
      { pillar: "trust", status: "archived" },
      { pillar: "trust", status: "published" },
    ];
    const result = calculatePillarPerformance(items);
    expect(result["trust"].published).toBe(1);
    expect(result["trust"].total).toBe(3);
  });
});
