import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  getNextStepIndex,
  calculateNextSendAt,
} from "@/lib/funnel/sequence-engine";
import type { EmailSequenceStep } from "@/lib/funnel/types";

// --- evaluateCondition ---

describe("evaluateCondition", () => {
  describe("tag_exists", () => {
    it("returns true when tag exists in contact tags", () => {
      const context = { tags: ["vip", "subscriber"], lead_score: 0, email_opened: false, email_clicked: false };
      expect(evaluateCondition("tag_exists", "vip", context)).toBe(true);
    });

    it("returns false when tag does not exist", () => {
      const context = { tags: ["subscriber"], lead_score: 0, email_opened: false, email_clicked: false };
      expect(evaluateCondition("tag_exists", "vip", context)).toBe(false);
    });

    it("returns false when tags array is empty", () => {
      const context = { tags: [], lead_score: 0, email_opened: false, email_clicked: false };
      expect(evaluateCondition("tag_exists", "vip", context)).toBe(false);
    });
  });

  describe("score_above", () => {
    it("returns true when lead_score is above the threshold", () => {
      const context = { tags: [], lead_score: 75, email_opened: false, email_clicked: false };
      expect(evaluateCondition("score_above", "50", context)).toBe(true);
    });

    it("returns false when lead_score equals the threshold", () => {
      const context = { tags: [], lead_score: 50, email_opened: false, email_clicked: false };
      expect(evaluateCondition("score_above", "50", context)).toBe(false);
    });

    it("returns false when lead_score is below the threshold", () => {
      const context = { tags: [], lead_score: 30, email_opened: false, email_clicked: false };
      expect(evaluateCondition("score_above", "50", context)).toBe(false);
    });
  });

  describe("email_opened", () => {
    it("returns true when email was opened", () => {
      const context = { tags: [], lead_score: 0, email_opened: true, email_clicked: false };
      expect(evaluateCondition("email_opened", "true", context)).toBe(true);
    });

    it("returns false when email was not opened", () => {
      const context = { tags: [], lead_score: 0, email_opened: false, email_clicked: false };
      expect(evaluateCondition("email_opened", "true", context)).toBe(false);
    });
  });

  describe("email_clicked", () => {
    it("returns true when email was clicked", () => {
      const context = { tags: [], lead_score: 0, email_opened: true, email_clicked: true };
      expect(evaluateCondition("email_clicked", "true", context)).toBe(true);
    });

    it("returns false when email was not clicked", () => {
      const context = { tags: [], lead_score: 0, email_opened: false, email_clicked: false };
      expect(evaluateCondition("email_clicked", "true", context)).toBe(false);
    });
  });
});

// --- getNextStepIndex ---

function makeStep(overrides: Partial<EmailSequenceStep> = {}): EmailSequenceStep {
  return {
    id: "step-1",
    sequence_id: "seq-1",
    step_index: 0,
    step_type: "email",
    subject: "Hello",
    body_html: null,
    delay_minutes: null,
    condition_type: null,
    condition_value: null,
    true_next_index: null,
    false_next_index: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("getNextStepIndex", () => {
  const defaultContext = { tags: [], lead_score: 0, email_opened: false, email_clicked: false };

  it("returns currentIndex + 1 for linear (email) step", () => {
    const steps = [
      makeStep({ step_index: 0, step_type: "email" }),
      makeStep({ step_index: 1, step_type: "email" }),
    ];
    expect(getNextStepIndex(0, steps, defaultContext)).toBe(1);
  });

  it("returns currentIndex + 1 for linear (delay) step", () => {
    const steps = [
      makeStep({ step_index: 0, step_type: "delay", delay_minutes: 60 }),
      makeStep({ step_index: 1, step_type: "email" }),
    ];
    expect(getNextStepIndex(0, steps, defaultContext)).toBe(1);
  });

  it("returns null when past the end of the sequence", () => {
    const steps = [makeStep({ step_index: 0, step_type: "email" })];
    expect(getNextStepIndex(0, steps, defaultContext)).toBeNull();
  });

  it("returns null when currentIndex is already past end", () => {
    const steps = [makeStep({ step_index: 0, step_type: "email" })];
    expect(getNextStepIndex(5, steps, defaultContext)).toBeNull();
  });

  it("follows true_next_index when condition evaluates to true", () => {
    const context = { tags: ["vip"], lead_score: 0, email_opened: false, email_clicked: false };
    const steps = [
      makeStep({ step_index: 0, step_type: "condition", condition_type: "tag_exists", condition_value: "vip", true_next_index: 2, false_next_index: 1 }),
      makeStep({ step_index: 1, step_type: "email", subject: "Non-VIP path" }),
      makeStep({ step_index: 2, step_type: "email", subject: "VIP path" }),
    ];
    expect(getNextStepIndex(0, steps, context)).toBe(2);
  });

  it("follows false_next_index when condition evaluates to false", () => {
    const context = { tags: [], lead_score: 0, email_opened: false, email_clicked: false };
    const steps = [
      makeStep({ step_index: 0, step_type: "condition", condition_type: "tag_exists", condition_value: "vip", true_next_index: 2, false_next_index: 1 }),
      makeStep({ step_index: 1, step_type: "email", subject: "Non-VIP path" }),
      makeStep({ step_index: 2, step_type: "email", subject: "VIP path" }),
    ];
    expect(getNextStepIndex(0, steps, context)).toBe(1);
  });

  it("returns null when condition true_next_index is null (condition end of branch)", () => {
    const context = { tags: ["vip"], lead_score: 0, email_opened: false, email_clicked: false };
    const steps = [
      makeStep({ step_index: 0, step_type: "condition", condition_type: "tag_exists", condition_value: "vip", true_next_index: null, false_next_index: 1 }),
      makeStep({ step_index: 1, step_type: "email" }),
    ];
    expect(getNextStepIndex(0, steps, context)).toBeNull();
  });
});

// --- calculateNextSendAt ---

describe("calculateNextSendAt", () => {
  const now = new Date("2026-03-28T12:00:00.000Z");

  it("returns now for email steps (immediate send)", () => {
    const step = makeStep({ step_type: "email" });
    const result = calculateNextSendAt(step, now);
    expect(result).toEqual(now);
  });

  it("returns now + delay_minutes for delay steps", () => {
    const step = makeStep({ step_type: "delay", delay_minutes: 60 });
    const result = calculateNextSendAt(step, now);
    const expected = new Date("2026-03-28T13:00:00.000Z");
    expect(result).toEqual(expected);
  });

  it("returns correct time for 1440 minute (1 day) delay", () => {
    const step = makeStep({ step_type: "delay", delay_minutes: 1440 });
    const result = calculateNextSendAt(step, now);
    const expected = new Date("2026-03-29T12:00:00.000Z");
    expect(result).toEqual(expected);
  });

  it("returns now for delay step with null delay_minutes (falls back to immediate)", () => {
    const step = makeStep({ step_type: "delay", delay_minutes: null });
    const result = calculateNextSendAt(step, now);
    expect(result).toEqual(now);
  });

  it("returns now for condition steps (no wait)", () => {
    const step = makeStep({ step_type: "condition" });
    const result = calculateNextSendAt(step, now);
    expect(result).toEqual(now);
  });
});
