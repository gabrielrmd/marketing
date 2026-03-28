"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateCohortRetention,
  calculateDropOffRates,
  calculateTimeInStage,
  calculateCostPerAcquisition,
  calculateLTV,
} from "./analytics";

// ─── Marketing Performance ────────────────────────────────────────────────────

export async function getMarketingPerformance(dateFrom: string, dateTo: string) {
  const supabase = await createClient();

  const [
    contentResult,
    emailResult,
    channelResult,
    pageViewResult,
    formResult,
  ] = await Promise.all([
    // Content items: published count by pillar
    supabase
      .from("content_items")
      .select("pillar, status")
      .eq("status", "published")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    // Email sends: sent/opened/clicked counts
    supabase
      .from("email_sends")
      .select("status")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    // Analytics events: grouped by channel
    supabase
      .from("analytics_events")
      .select("channel, event_type")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    // Website traffic: page_view events
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    // Form submissions: total in range
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),
  ]);

  // Content by pillar
  const contentByPillar: Record<string, number> = {};
  for (const item of contentResult.data ?? []) {
    const pillar = item.pillar ?? "uncategorized";
    contentByPillar[pillar] = (contentByPillar[pillar] ?? 0) + 1;
  }

  // Email stats
  const emails = emailResult.data ?? [];
  const emailTotal = emails.length;
  const emailOpened = emails.filter(
    (e) => e.status === "opened" || e.status === "clicked"
  ).length;
  const emailClicked = emails.filter((e) => e.status === "clicked").length;
  const emailStats = {
    sent: emailTotal,
    opened: emailOpened,
    clicked: emailClicked,
    openRate: emailTotal > 0 ? emailOpened / emailTotal : 0,
    clickRate: emailTotal > 0 ? emailClicked / emailTotal : 0,
  };

  // Channel metrics
  const events = channelResult.data ?? [];
  const channelMetrics: Record<
    string,
    { impressions: number; clicks: number; conversions: number }
  > = {};
  for (const event of events) {
    const ch = event.channel ?? "unknown";
    if (!channelMetrics[ch]) {
      channelMetrics[ch] = { impressions: 0, clicks: 0, conversions: 0 };
    }
    if (event.event_type === "impression") channelMetrics[ch].impressions += 1;
    else if (event.event_type === "click") channelMetrics[ch].clicks += 1;
    else if (event.event_type === "conversion") channelMetrics[ch].conversions += 1;
  }

  return {
    data: {
      contentByPillar,
      emailStats,
      channelMetrics,
      websiteTraffic: pageViewResult.count ?? 0,
      totalSubmissions: formResult.count ?? 0,
    },
  };
}

// ─── Funnel Health ────────────────────────────────────────────────────────────

export async function getFunnelHealth() {
  const supabase = await createClient();

  const [contactsResult, funnelEventsResult] = await Promise.all([
    supabase.from("contacts").select("stage, created_at, updated_at"),
    supabase
      .from("funnel_events")
      .select("event_type, from_stage, to_stage, created_at"),
  ]);

  const contacts = contactsResult.data ?? [];

  // Stage distribution
  const stageDistributionMap: Record<string, number> = {};
  for (const c of contacts) {
    const stage = c.stage ?? "unknown";
    stageDistributionMap[stage] = (stageDistributionMap[stage] ?? 0) + 1;
  }
  const stageDistribution = Object.entries(stageDistributionMap).map(
    ([stage, count]) => ({ stage, count })
  );

  // Time in stage (avg days per stage)
  const timeInStage = calculateTimeInStage(
    contacts.map((c) => ({
      stage: c.stage ?? "unknown",
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))
  );

  // Drop-off rates from funnel events
  const funnelEvents = funnelEventsResult.data ?? [];
  const transitionCounts: Record<string, Record<string, number>> = {};
  for (const ev of funnelEvents) {
    if (!ev.from_stage || !ev.to_stage) continue;
    if (!transitionCounts[ev.from_stage]) transitionCounts[ev.from_stage] = {};
    transitionCounts[ev.from_stage][ev.to_stage] =
      (transitionCounts[ev.from_stage][ev.to_stage] ?? 0) + 1;
  }

  const dropOffRates = calculateDropOffRates(stageDistribution);

  // Cohort analysis: group contacts by signup month + stage
  const cohortData = calculateCohortRetention(
    contacts.map((c) => ({
      created_at: c.created_at,
      stage: c.stage ?? "unknown",
    })),
    30
  );

  return {
    data: {
      stageDistribution,
      timeInStage,
      dropOffRates,
      cohortData,
    },
  };
}

// ─── Revenue Attribution ──────────────────────────────────────────────────────

export async function getRevenueAttribution(dateFrom: string, dateTo: string) {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("campaign_id, channel, source, revenue, contact_id, event_type")
    .not("revenue", "is", null)
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo);

  if (error) return { error: error.message };

  const revenueEvents = events ?? [];

  // Attribution by source
  const bySource: Record<
    string,
    { conversions: number; revenue: number; customers: Set<string> }
  > = {};
  // Attribution by campaign
  const byCampaign: Record<
    string,
    { conversions: number; revenue: number; customers: Set<string> }
  > = {};
  // Attribution by channel
  const byChannel: Record<
    string,
    { conversions: number; revenue: number; customers: Set<string> }
  > = {};

  let totalRevenue = 0;
  const allCustomers = new Set<string>();

  for (const ev of revenueEvents) {
    const source = ev.source ?? "unknown";
    const campaign = ev.campaign_id ?? "unknown";
    const channel = ev.channel ?? "unknown";
    const revenue = ev.revenue ?? 0;
    const customerId = ev.contact_id ?? `anon-${Math.random()}`;

    totalRevenue += revenue;
    if (ev.contact_id) allCustomers.add(ev.contact_id);

    // By source
    if (!bySource[source]) bySource[source] = { conversions: 0, revenue: 0, customers: new Set() };
    bySource[source].conversions += 1;
    bySource[source].revenue += revenue;
    if (ev.contact_id) bySource[source].customers.add(ev.contact_id);

    // By campaign
    if (!byCampaign[campaign]) byCampaign[campaign] = { conversions: 0, revenue: 0, customers: new Set() };
    byCampaign[campaign].conversions += 1;
    byCampaign[campaign].revenue += revenue;
    if (ev.contact_id) byCampaign[campaign].customers.add(ev.contact_id);

    // By channel
    if (!byChannel[channel]) byChannel[channel] = { conversions: 0, revenue: 0, customers: new Set() };
    byChannel[channel].conversions += 1;
    byChannel[channel].revenue += revenue;
    if (ev.contact_id) byChannel[channel].customers.add(ev.contact_id);
  }

  // Serialize to plain objects (Sets → counts)
  const serializeAttribution = (
    map: Record<string, { conversions: number; revenue: number; customers: Set<string> }>
  ) =>
    Object.entries(map).map(([key, val]) => ({
      key,
      conversions: val.conversions,
      revenue: val.revenue,
      uniqueCustomers: val.customers.size,
      cpa: calculateCostPerAcquisition(val.revenue, val.conversions),
      ltv: calculateLTV(val.revenue, val.customers.size),
    }));

  const overallLTV = calculateLTV(totalRevenue, allCustomers.size);

  return {
    data: {
      attributionBySource: serializeAttribution(bySource),
      attributionByCampaign: serializeAttribution(byCampaign),
      attributionByChannel: serializeAttribution(byChannel),
      overallLTV,
      totalRevenue,
    },
  };
}
