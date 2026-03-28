import type { ConditionType, EmailSequenceStep } from "./types";

export type SequenceContext = {
  tags: string[];
  lead_score: number;
  email_opened: boolean;
  email_clicked: boolean;
};

/**
 * Evaluates a condition step against the contact's current context.
 * Pure function — no side effects, no Supabase.
 */
export function evaluateCondition(
  conditionType: ConditionType,
  conditionValue: string,
  context: SequenceContext
): boolean {
  switch (conditionType) {
    case "tag_exists":
      return context.tags.includes(conditionValue);
    case "score_above":
      return context.lead_score > Number(conditionValue);
    case "email_opened":
      return context.email_opened;
    case "email_clicked":
      return context.email_clicked;
    default:
      return false;
  }
}

/**
 * Determines the next step index given the current index, steps array, and context.
 * Returns null when the sequence is complete (no next step).
 * Pure function — no side effects, no Supabase.
 */
export function getNextStepIndex(
  currentIndex: number,
  steps: EmailSequenceStep[],
  context: SequenceContext
): number | null {
  const current = steps.find((s) => s.step_index === currentIndex);
  if (!current) return null;

  if (current.step_type === "condition") {
    const conditionMet =
      current.condition_type != null
        ? evaluateCondition(current.condition_type, current.condition_value ?? "", context)
        : false;

    const nextIndex = conditionMet ? current.true_next_index : current.false_next_index;
    if (nextIndex == null) return null;
    return nextIndex;
  }

  // Linear: email or delay — advance to next step by index
  const nextIndex = currentIndex + 1;
  const exists = steps.some((s) => s.step_index === nextIndex);
  return exists ? nextIndex : null;
}

/**
 * Calculates when the next send should happen based on step type.
 * - email → send immediately (now)
 * - delay → now + delay_minutes
 * - condition → send immediately (evaluated inline)
 * Pure function — no side effects, no Supabase.
 */
export function calculateNextSendAt(step: EmailSequenceStep, now: Date): Date {
  if (step.step_type === "delay" && step.delay_minutes != null && step.delay_minutes > 0) {
    return new Date(now.getTime() + step.delay_minutes * 60 * 1000);
  }
  return now;
}
