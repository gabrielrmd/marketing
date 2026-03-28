import { describe, it, expect } from "vitest";
import {
  matchesFilter,
  evaluateSegmentFilter,
  CHALLENGE_READY_FILTER,
  UPGRADE_CANDIDATES_FILTER,
  AT_RISK_FILTER,
} from "@/lib/crm/segments";
import type { Contact } from "@/lib/funnel/types";
import type { SegmentFilterRule } from "@/lib/crm/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "contact-1",
    email: "test@example.com",
    name: "Test User",
    source: "website",
    tags: [],
    stage: "subscriber",
    lead_score: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── matchesFilter ────────────────────────────────────────────────────────────

describe("matchesFilter", () => {
  describe("stage_equals", () => {
    it("returns true when contact stage matches", () => {
      const contact = makeContact({ stage: "circle_member" });
      expect(matchesFilter(contact, { stage_equals: "circle_member" })).toBe(true);
    });

    it("returns false when contact stage doesn't match", () => {
      const contact = makeContact({ stage: "subscriber" });
      expect(matchesFilter(contact, { stage_equals: "circle_member" })).toBe(false);
    });
  });

  describe("score_above", () => {
    it("returns true when score is strictly above threshold", () => {
      const contact = makeContact({ lead_score: 51 });
      expect(matchesFilter(contact, { score_above: 50 })).toBe(true);
    });

    it("returns false when score equals the threshold", () => {
      const contact = makeContact({ lead_score: 50 });
      expect(matchesFilter(contact, { score_above: 50 })).toBe(false);
    });

    it("returns false when score is below threshold", () => {
      const contact = makeContact({ lead_score: 30 });
      expect(matchesFilter(contact, { score_above: 50 })).toBe(false);
    });
  });

  describe("score_below", () => {
    it("returns true when score is strictly below threshold", () => {
      const contact = makeContact({ lead_score: 19 });
      expect(matchesFilter(contact, { score_below: 20 })).toBe(true);
    });

    it("returns false when score equals the threshold", () => {
      const contact = makeContact({ lead_score: 20 });
      expect(matchesFilter(contact, { score_below: 20 })).toBe(false);
    });

    it("returns false when score is above threshold", () => {
      const contact = makeContact({ lead_score: 30 });
      expect(matchesFilter(contact, { score_below: 20 })).toBe(false);
    });
  });

  describe("has_tag", () => {
    it("returns true when contact has the tag", () => {
      const contact = makeContact({ tags: ["vip", "challenge_participant"] });
      expect(matchesFilter(contact, { has_tag: "vip" })).toBe(true);
    });

    it("returns false when contact doesn't have the tag", () => {
      const contact = makeContact({ tags: ["subscriber"] });
      expect(matchesFilter(contact, { has_tag: "vip" })).toBe(false);
    });

    it("returns false when contact has no tags", () => {
      const contact = makeContact({ tags: [] });
      expect(matchesFilter(contact, { has_tag: "vip" })).toBe(false);
    });
  });

  describe("source_equals", () => {
    it("returns true when source matches", () => {
      const contact = makeContact({ source: "instagram" });
      expect(matchesFilter(contact, { source_equals: "instagram" })).toBe(true);
    });

    it("returns false when source doesn't match", () => {
      const contact = makeContact({ source: "website" });
      expect(matchesFilter(contact, { source_equals: "instagram" })).toBe(false);
    });

    it("returns false when contact has no source", () => {
      const contact = makeContact({ source: null });
      expect(matchesFilter(contact, { source_equals: "instagram" })).toBe(false);
    });
  });

  describe("inactive_days", () => {
    it("returns true when contact updated_at is older than inactive_days", () => {
      const old = new Date();
      old.setDate(old.getDate() - 20);
      const contact = makeContact({ updated_at: old.toISOString() });
      expect(matchesFilter(contact, { inactive_days: 14 })).toBe(true);
    });

    it("returns false when contact updated_at is within inactive_days", () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 5);
      const contact = makeContact({ updated_at: recent.toISOString() });
      expect(matchesFilter(contact, { inactive_days: 14 })).toBe(false);
    });

    it("returns false when inactive_days equals days since last update", () => {
      const d = new Date();
      d.setDate(d.getDate() - 14);
      const contact = makeContact({ updated_at: d.toISOString() });
      // exactly 14 days — need strictly greater, so false
      expect(matchesFilter(contact, { inactive_days: 14 })).toBe(false);
    });

    it("returns true when contact is well past inactive threshold", () => {
      const old = new Date();
      old.setDate(old.getDate() - 30);
      const contact = makeContact({ updated_at: old.toISOString() });
      expect(matchesFilter(contact, { inactive_days: 14 })).toBe(true);
    });
  });
});

// ─── evaluateSegmentFilter ────────────────────────────────────────────────────

describe("evaluateSegmentFilter", () => {
  it("returns true when filter rules object is empty (no constraints)", () => {
    const contact = makeContact();
    expect(evaluateSegmentFilter(contact, {})).toBe(true);
  });

  it("returns true when contact matches a single rule", () => {
    const contact = makeContact({ stage: "circle_member" });
    expect(evaluateSegmentFilter(contact, { stage_equals: "circle_member" })).toBe(true);
  });

  it("returns false when contact fails a single rule", () => {
    const contact = makeContact({ stage: "subscriber" });
    expect(evaluateSegmentFilter(contact, { stage_equals: "circle_member" })).toBe(false);
  });

  it("applies AND logic — returns true only if ALL rules match", () => {
    const contact = makeContact({ stage: "circle_member", lead_score: 60 });
    const filter: SegmentFilterRule = {
      stage_equals: "circle_member",
      score_above: 50,
    };
    expect(evaluateSegmentFilter(contact, filter)).toBe(true);
  });

  it("applies AND logic — returns false if any one rule fails", () => {
    const contact = makeContact({ stage: "circle_member", lead_score: 30 });
    const filter: SegmentFilterRule = {
      stage_equals: "circle_member",
      score_above: 50, // fails: 30 is not above 50
    };
    expect(evaluateSegmentFilter(contact, filter)).toBe(false);
  });

  it("evaluates all defined filter fields together", () => {
    const contact = makeContact({
      stage: "engaged",
      lead_score: 35,
      tags: ["newsletter"],
      source: "email",
    });
    const filter: SegmentFilterRule = {
      stage_equals: "engaged",
      score_above: 20,
      score_below: 50,
      has_tag: "newsletter",
      source_equals: "email",
    };
    expect(evaluateSegmentFilter(contact, filter)).toBe(true);
  });
});

// ─── Pre-built segment filters ─────────────────────────────────────────────────

describe("CHALLENGE_READY_FILTER (warm + not challenge_participant stage)", () => {
  it("matches a warm contact not in challenge stage", () => {
    const contact = makeContact({ stage: "engaged", lead_score: 30 });
    expect(evaluateSegmentFilter(contact, CHALLENGE_READY_FILTER)).toBe(true);
  });

  it("does not match a cold contact", () => {
    const contact = makeContact({ stage: "engaged", lead_score: 10 });
    expect(evaluateSegmentFilter(contact, CHALLENGE_READY_FILTER)).toBe(false);
  });

  it("does not match a contact already in challenge_participant stage", () => {
    const contact = makeContact({ stage: "challenge_participant", lead_score: 30 });
    expect(evaluateSegmentFilter(contact, CHALLENGE_READY_FILTER)).toBe(false);
  });
});

describe("UPGRADE_CANDIDATES_FILTER (circle_member + hot score)", () => {
  it("matches a circle_member with hot score", () => {
    const contact = makeContact({ stage: "circle_member", lead_score: 60 });
    expect(evaluateSegmentFilter(contact, UPGRADE_CANDIDATES_FILTER)).toBe(true);
  });

  it("does not match a circle_member with warm score", () => {
    const contact = makeContact({ stage: "circle_member", lead_score: 35 });
    expect(evaluateSegmentFilter(contact, UPGRADE_CANDIDATES_FILTER)).toBe(false);
  });

  it("does not match a non-circle_member with hot score", () => {
    const contact = makeContact({ stage: "engaged", lead_score: 60 });
    expect(evaluateSegmentFilter(contact, UPGRADE_CANDIDATES_FILTER)).toBe(false);
  });
});

describe("AT_RISK_FILTER (inactive 14+ days)", () => {
  it("matches a contact inactive for 15 days", () => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    const contact = makeContact({ updated_at: d.toISOString() });
    expect(evaluateSegmentFilter(contact, AT_RISK_FILTER)).toBe(true);
  });

  it("does not match a contact active 5 days ago", () => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    const contact = makeContact({ updated_at: d.toISOString() });
    expect(evaluateSegmentFilter(contact, AT_RISK_FILTER)).toBe(false);
  });
});
