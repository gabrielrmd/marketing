import { describe, it, expect } from "vitest";
import {
  calculateLeadScore,
  getScoreLevel,
  applyInactivityPenalty,
} from "@/lib/crm/scoring";
import type { LeadScoreRule, ContactActivity } from "@/lib/crm/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEFAULT_RULES: LeadScoreRule[] = [
  { id: "1", action: "download_lead_magnet", points: 5, description: null, created_at: "2024-01-01T00:00:00Z" },
  { id: "2", action: "join_challenge", points: 10, description: null, created_at: "2024-01-01T00:00:00Z" },
  { id: "3", action: "attend_event", points: 15, description: null, created_at: "2024-01-01T00:00:00Z" },
  { id: "4", action: "subscribe_circle", points: 20, description: null, created_at: "2024-01-01T00:00:00Z" },
  { id: "5", action: "purchase_strategy", points: 50, description: null, created_at: "2024-01-01T00:00:00Z" },
  { id: "6", action: "inactive_30_days", points: -5, description: null, created_at: "2024-01-01T00:00:00Z" },
];

function makeActivity(activity_type: string): ContactActivity {
  return {
    id: Math.random().toString(),
    contact_id: "contact-1",
    activity_type,
    metadata: {},
    content_item_id: null,
    email_send_id: null,
    campaign_id: null,
    created_by: null,
    created_at: new Date().toISOString(),
  };
}

// ─── calculateLeadScore ───────────────────────────────────────────────────────

describe("calculateLeadScore", () => {
  it("returns 0 when there are no activities", () => {
    expect(calculateLeadScore([], DEFAULT_RULES)).toBe(0);
  });

  it("returns 0 when activities don't match any rules", () => {
    const activities = [makeActivity("unknown_action"), makeActivity("random_event")];
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(0);
  });

  it("sums points for a single matching activity", () => {
    const activities = [makeActivity("download_lead_magnet")];
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(5);
  });

  it("sums points across multiple matching activities", () => {
    const activities = [
      makeActivity("download_lead_magnet"), // 5
      makeActivity("join_challenge"),        // 10
      makeActivity("attend_event"),          // 15
    ];
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(30);
  });

  it("counts repeated activities cumulatively", () => {
    const activities = [
      makeActivity("download_lead_magnet"), // 5
      makeActivity("download_lead_magnet"), // 5
    ];
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(10);
  });

  it("applies negative points for inactivity rule", () => {
    const activities = [
      makeActivity("download_lead_magnet"), // 5
      makeActivity("inactive_30_days"),     // -5
    ];
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(0);
  });

  it("works with an empty rules list", () => {
    const activities = [makeActivity("download_lead_magnet")];
    expect(calculateLeadScore(activities, [])).toBe(0);
  });

  it("uses provided rules instead of defaults", () => {
    const customRules: LeadScoreRule[] = [
      { id: "x", action: "custom_action", points: 42, description: null, created_at: "2024-01-01T00:00:00Z" },
    ];
    const activities = [makeActivity("custom_action")];
    expect(calculateLeadScore(activities, customRules)).toBe(42);
  });

  it("ignores rules not matching any activity", () => {
    const activities = [makeActivity("download_lead_magnet")]; // 5
    // All other rules exist but no matching activities
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(5);
  });

  it("handles purchase_strategy activity (50 points)", () => {
    const activities = [makeActivity("purchase_strategy")];
    expect(calculateLeadScore(activities, DEFAULT_RULES)).toBe(50);
  });
});

// ─── getScoreLevel ────────────────────────────────────────────────────────────

describe("getScoreLevel", () => {
  it("returns 'cold' for score below 20", () => {
    expect(getScoreLevel(0)).toBe("cold");
    expect(getScoreLevel(1)).toBe("cold");
    expect(getScoreLevel(19)).toBe("cold");
  });

  it("returns 'warm' for score exactly 20", () => {
    expect(getScoreLevel(20)).toBe("warm");
  });

  it("returns 'warm' for score in range 20-50", () => {
    expect(getScoreLevel(25)).toBe("warm");
    expect(getScoreLevel(49)).toBe("warm");
    expect(getScoreLevel(50)).toBe("warm");
  });

  it("returns 'hot' for score above 50", () => {
    expect(getScoreLevel(51)).toBe("hot");
    expect(getScoreLevel(75)).toBe("hot");
    expect(getScoreLevel(99)).toBe("hot");
  });

  it("returns 'customer' when purchased flag is true, regardless of score", () => {
    expect(getScoreLevel(0, true)).toBe("customer");
    expect(getScoreLevel(25, true)).toBe("customer");
    expect(getScoreLevel(100, true)).toBe("customer");
  });

  it("returns 'customer' when score is 100+ (high threshold indicating purchase)", () => {
    expect(getScoreLevel(100)).toBe("customer");
    expect(getScoreLevel(150)).toBe("customer");
  });

  it("returns 'cold' for negative scores", () => {
    expect(getScoreLevel(-10)).toBe("cold");
  });
});

// ─── applyInactivityPenalty ───────────────────────────────────────────────────

describe("applyInactivityPenalty", () => {
  it("returns unchanged score when last activity is within 30 days", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    expect(applyInactivityPenalty(recent.toISOString(), 30, DEFAULT_RULES)).toBe(30);
  });

  it("returns unchanged score when last activity is exactly 29 days ago", () => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    expect(applyInactivityPenalty(d.toISOString(), 30, DEFAULT_RULES)).toBe(30);
  });

  it("applies penalty when last activity is exactly 30 days ago", () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    // inactive_30_days rule = -5 → 30 - 5 = 25
    expect(applyInactivityPenalty(d.toISOString(), 30, DEFAULT_RULES)).toBe(25);
  });

  it("applies penalty when last activity is more than 30 days ago", () => {
    const d = new Date();
    d.setDate(d.getDate() - 45);
    expect(applyInactivityPenalty(d.toISOString(), 30, DEFAULT_RULES)).toBe(25);
  });

  it("does not allow score to drop below 0", () => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    expect(applyInactivityPenalty(d.toISOString(), 3, DEFAULT_RULES)).toBe(0);
  });

  it("returns 0 when there is no inactivity rule", () => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    const rulesWithoutInactivity = DEFAULT_RULES.filter(
      (r) => r.action !== "inactive_30_days"
    );
    // No penalty rule → score unchanged
    expect(applyInactivityPenalty(d.toISOString(), 30, rulesWithoutInactivity)).toBe(30);
  });
});
