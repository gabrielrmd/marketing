// Pure lead scoring functions — no "use server"

import type { ContactActivity, LeadScoreRule, LeadScoreLevel } from "./types";

/**
 * Calculate total lead score by matching activities against scoring rules.
 * Each activity that matches a rule contributes that rule's points.
 */
export function calculateLeadScore(
  activities: ContactActivity[],
  rules: LeadScoreRule[]
): number {
  const ruleMap = new Map<string, number>(
    rules.map((r) => [r.action, r.points])
  );

  let score = 0;
  for (const activity of activities) {
    const points = ruleMap.get(activity.activity_type);
    if (points !== undefined) {
      score += points;
    }
  }
  return score;
}

/**
 * Determine the score level label for a given numeric score.
 *
 * Thresholds:
 *   - customer: purchased flag is true OR score >= 100
 *   - hot:      score > 50
 *   - warm:     score >= 20
 *   - cold:     score < 20
 */
export function getScoreLevel(score: number, purchased = false): LeadScoreLevel {
  if (purchased || score >= 100) return "customer";
  if (score > 50) return "hot";
  if (score >= 20) return "warm";
  return "cold";
}

/**
 * Apply an inactivity penalty to a contact's current score when their last
 * activity was 30 or more days ago.  Uses the `inactive_30_days` rule from
 * the provided rules list.  Score floor is 0.
 */
export function applyInactivityPenalty(
  lastActivityDate: string,
  currentScore: number,
  rules: LeadScoreRule[]
): number {
  const last = new Date(lastActivityDate);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 30) return currentScore;

  const penaltyRule = rules.find((r) => r.action === "inactive_30_days");
  if (!penaltyRule) return currentScore;

  return Math.max(0, currentScore + penaltyRule.points);
}
