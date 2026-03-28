import { describe, it, expect } from "vitest";
import { validateCampaign, validateBudgetEntry } from "@/lib/campaigns/validation";

describe("validateCampaign", () => {
  it("returns error when title is missing", () => {
    const errors = validateCampaign({
      title: "",
      campaign_type: "product_launch",
      start_date: "2026-01-01",
      end_date: "2026-02-01",
    });
    expect(errors).toContain("Title is required");
  });

  it("returns error for whitespace-only title", () => {
    const errors = validateCampaign({
      title: "   ",
      campaign_type: "evergreen",
      start_date: null,
      end_date: null,
    });
    expect(errors).toContain("Title is required");
  });

  it("returns error for invalid campaign_type", () => {
    const errors = validateCampaign({
      title: "My Campaign",
      campaign_type: "invalid_type" as never,
      start_date: null,
      end_date: null,
    });
    expect(errors).toContain("Invalid campaign type");
  });

  it("accepts all valid campaign types", () => {
    for (const t of ["product_launch", "seasonal", "evergreen", "event"] as const) {
      const errors = validateCampaign({ title: "Test", campaign_type: t, start_date: null, end_date: null });
      expect(errors).not.toContain("Invalid campaign type");
    }
  });

  it("returns error when end_date is before start_date", () => {
    const errors = validateCampaign({
      title: "My Campaign",
      campaign_type: "seasonal",
      start_date: "2026-03-01",
      end_date: "2026-02-01",
    });
    expect(errors).toContain("End date must be after start date");
  });

  it("returns error when end_date equals start_date", () => {
    const errors = validateCampaign({
      title: "My Campaign",
      campaign_type: "seasonal",
      start_date: "2026-03-01",
      end_date: "2026-03-01",
    });
    expect(errors).toContain("End date must be after start date");
  });

  it("accepts valid campaign with all fields", () => {
    const errors = validateCampaign({
      title: "Spring Launch",
      campaign_type: "product_launch",
      start_date: "2026-03-01",
      end_date: "2026-04-01",
    });
    expect(errors).toHaveLength(0);
  });

  it("accepts valid campaign with no dates", () => {
    const errors = validateCampaign({
      title: "Evergreen Campaign",
      campaign_type: "evergreen",
      start_date: null,
      end_date: null,
    });
    expect(errors).toHaveLength(0);
  });

  it("returns no date error when only start_date is set", () => {
    const errors = validateCampaign({
      title: "My Campaign",
      campaign_type: "event",
      start_date: "2026-05-01",
      end_date: null,
    });
    expect(errors).not.toContain("End date must be after start date");
  });
});

describe("validateBudgetEntry", () => {
  it("returns error when description is missing", () => {
    const errors = validateBudgetEntry({
      description: "",
      amount: 100,
      entry_type: "planned",
    });
    expect(errors).toContain("Description is required");
  });

  it("returns error for whitespace-only description", () => {
    const errors = validateBudgetEntry({
      description: "   ",
      amount: 100,
      entry_type: "actual",
    });
    expect(errors).toContain("Description is required");
  });

  it("returns error when amount is zero", () => {
    const errors = validateBudgetEntry({
      description: "Ad spend",
      amount: 0,
      entry_type: "planned",
    });
    expect(errors).toContain("Amount must be greater than zero");
  });

  it("returns error when amount is negative", () => {
    const errors = validateBudgetEntry({
      description: "Ad spend",
      amount: -50,
      entry_type: "planned",
    });
    expect(errors).toContain("Amount must be greater than zero");
  });

  it("returns error for invalid entry_type", () => {
    const errors = validateBudgetEntry({
      description: "Ad spend",
      amount: 100,
      entry_type: "refund" as never,
    });
    expect(errors).toContain("Invalid entry type");
  });

  it("accepts valid planned entry", () => {
    const errors = validateBudgetEntry({
      description: "Facebook Ads",
      amount: 500,
      entry_type: "planned",
    });
    expect(errors).toHaveLength(0);
  });

  it("accepts valid actual entry", () => {
    const errors = validateBudgetEntry({
      description: "Google Ads",
      amount: 250.50,
      entry_type: "actual",
    });
    expect(errors).toHaveLength(0);
  });

  it("returns multiple errors for fully invalid entry", () => {
    const errors = validateBudgetEntry({
      description: "",
      amount: -10,
      entry_type: "bad" as never,
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
