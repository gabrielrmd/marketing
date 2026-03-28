// Pure analytics helper functions — no Supabase, no "use server"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetRollup = {
  planned: number;
  actual: number;
  variance: number;
  variancePct: number;
};

export type ChannelMetrics = Record<
  string,
  { impressions: number; clicks: number; conversions: number }
>;

export type FunnelStageConversion = {
  stage: string;
  count: number;
  rate: number;
};

export type DropOffRate = {
  from: string;
  to: string;
  dropOffPct: number;
};

export type CohortRow = {
  cohort: string; // "YYYY-MM"
  total: number;
  stages: Record<string, number>;
};

export type PillarMetrics = Record<
  string,
  { published: number; total: number }
>;

// ─── calculateBudgetRollup ────────────────────────────────────────────────────

export function calculateBudgetRollup(
  entries: Array<{ entry_type: "planned" | "actual"; amount: number }>
): BudgetRollup {
  let planned = 0;
  let actual = 0;

  for (const entry of entries) {
    if (entry.entry_type === "planned") {
      planned += entry.amount;
    } else {
      actual += entry.amount;
    }
  }

  const variance = planned - actual;
  const variancePct = planned > 0 ? (variance / planned) * 100 : 0;

  return { planned, actual, variance, variancePct };
}

// ─── calculateChannelPerformance ─────────────────────────────────────────────

export function calculateChannelPerformance(
  events: Array<{ channel: string | null; event_type: string }>
): ChannelMetrics {
  const result: ChannelMetrics = {};

  for (const event of events) {
    const channel = event.channel ?? "unknown";
    if (!result[channel]) {
      result[channel] = { impressions: 0, clicks: 0, conversions: 0 };
    }

    if (event.event_type === "impression") {
      result[channel].impressions += 1;
    } else if (event.event_type === "click") {
      result[channel].clicks += 1;
    } else if (event.event_type === "conversion") {
      result[channel].conversions += 1;
    }
  }

  return result;
}

// ─── calculateFunnelConversions ───────────────────────────────────────────────

export function calculateFunnelConversions(
  contacts: Array<{ stage: string }>
): FunnelStageConversion[] {
  if (contacts.length === 0) return [];

  const stageCounts: Record<string, number> = {};
  for (const contact of contacts) {
    stageCounts[contact.stage] = (stageCounts[contact.stage] ?? 0) + 1;
  }

  const total = contacts.length;
  return Object.entries(stageCounts).map(([stage, count]) => ({
    stage,
    count,
    rate: count / total,
  }));
}

// ─── calculateDropOffRates ────────────────────────────────────────────────────

export function calculateDropOffRates(
  stageData: Array<{ stage: string; count: number }>
): DropOffRate[] {
  if (stageData.length < 2) return [];

  const result: DropOffRate[] = [];
  for (let i = 0; i < stageData.length - 1; i++) {
    const current = stageData[i];
    const next = stageData[i + 1];
    const dropOffPct =
      current.count > 0
        ? ((current.count - next.count) / current.count) * 100
        : 0;

    result.push({ from: current.stage, to: next.stage, dropOffPct });
  }
  return result;
}

// ─── calculateTimeInStage ─────────────────────────────────────────────────────

export function calculateTimeInStage(
  contacts: Array<{ stage: string; created_at: string; updated_at: string }>
): Record<string, number> {
  if (contacts.length === 0) return {};

  const stageTotals: Record<string, { totalDays: number; count: number }> = {};

  for (const contact of contacts) {
    const createdAt = new Date(contact.created_at).getTime();
    const updatedAt = new Date(contact.updated_at).getTime();
    const days = (updatedAt - createdAt) / (1000 * 60 * 60 * 24);

    if (!stageTotals[contact.stage]) {
      stageTotals[contact.stage] = { totalDays: 0, count: 0 };
    }
    stageTotals[contact.stage].totalDays += days;
    stageTotals[contact.stage].count += 1;
  }

  const result: Record<string, number> = {};
  for (const [stage, { totalDays, count }] of Object.entries(stageTotals)) {
    result[stage] = totalDays / count;
  }
  return result;
}

// ─── calculateCohortRetention ─────────────────────────────────────────────────

export function calculateCohortRetention(
  contacts: Array<{ created_at: string; stage: string }>,
  _periodDays: number
): CohortRow[] {
  if (contacts.length === 0) return [];

  const cohortMap: Record<string, { total: number; stages: Record<string, number> }> = {};

  for (const contact of contacts) {
    const date = new Date(contact.created_at);
    const cohort = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!cohortMap[cohort]) {
      cohortMap[cohort] = { total: 0, stages: {} };
    }
    cohortMap[cohort].total += 1;
    cohortMap[cohort].stages[contact.stage] =
      (cohortMap[cohort].stages[contact.stage] ?? 0) + 1;
  }

  return Object.entries(cohortMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cohort, { total, stages }]) => ({ cohort, total, stages }));
}

// ─── calculateCostPerAcquisition ─────────────────────────────────────────────

export function calculateCostPerAcquisition(
  spend: number,
  conversions: number
): number {
  if (conversions === 0 || spend === 0) return 0;
  return spend / conversions;
}

// ─── calculateLTV ─────────────────────────────────────────────────────────────

export function calculateLTV(revenue: number, customers: number): number {
  if (customers === 0 || revenue === 0) return 0;
  return revenue / customers;
}

// ─── calculatePillarPerformance ───────────────────────────────────────────────

export function calculatePillarPerformance(
  contentItems: Array<{ pillar: string | null; status: string }>
): PillarMetrics {
  const result: PillarMetrics = {};

  for (const item of contentItems) {
    const pillar = item.pillar ?? "uncategorized";
    if (!result[pillar]) {
      result[pillar] = { published: 0, total: 0 };
    }
    result[pillar].total += 1;
    if (item.status === "published") {
      result[pillar].published += 1;
    }
  }

  return result;
}
