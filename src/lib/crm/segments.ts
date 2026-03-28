// Pure segment filter evaluation — no "use server"

import type { Contact } from "@/lib/funnel/types";
import type { SegmentFilterRule } from "./types";

/**
 * Evaluate a single filter rule against a contact.
 *
 * Only the keys present in the rule object are checked; undefined keys are
 * treated as "no constraint" (match everything).  Supports AND-only logic
 * including a not_stage_equals exclusion.
 */
export function matchesFilter(
  contact: Contact,
  rule: SegmentFilterRule
): boolean {
  if (rule.stage_equals !== undefined) {
    if (contact.stage !== rule.stage_equals) return false;
  }

  if (rule.not_stage_equals !== undefined) {
    if (contact.stage === rule.not_stage_equals) return false;
  }

  if (rule.score_above !== undefined) {
    if (contact.lead_score <= rule.score_above) return false;
  }

  if (rule.score_below !== undefined) {
    if (contact.lead_score >= rule.score_below) return false;
  }

  if (rule.has_tag !== undefined) {
    if (!contact.tags.includes(rule.has_tag)) return false;
  }

  if (rule.source_equals !== undefined) {
    if ((contact.source ?? "") !== rule.source_equals) return false;
  }

  if (rule.inactive_days !== undefined) {
    const last = new Date(contact.updated_at);
    const now = new Date();
    const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= rule.inactive_days) return false;
  }

  return true;
}

/**
 * Evaluate all filter rules against a contact using AND logic.
 * Returns true only if the contact satisfies every rule in the filter.
 */
export function evaluateSegmentFilter(
  contact: Contact,
  filterRules: SegmentFilterRule
): boolean {
  return matchesFilter(contact, filterRules);
}

// ─── Pre-built segment filters ─────────────────────────────────────────────────

/**
 * "Challenge-ready": warm contact (score > 19) who has not yet joined the
 * challenge (stage is NOT challenge_participant).
 */
export const CHALLENGE_READY_FILTER: SegmentFilterRule = {
  score_above: 19,
  not_stage_equals: "challenge_participant",
};

/**
 * "Upgrade candidates": circle_member with a hot score (> 50).
 */
export const UPGRADE_CANDIDATES_FILTER: SegmentFilterRule = {
  stage_equals: "circle_member",
  score_above: 50,
};

/**
 * "At-risk": any contact inactive for more than 14 days.
 */
export const AT_RISK_FILTER: SegmentFilterRule = {
  inactive_days: 14,
};
