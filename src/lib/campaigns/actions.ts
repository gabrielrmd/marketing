"use server";

import { createClient } from "@/lib/supabase/server";
import { validateCampaign, validateBudgetEntry } from "./validation";
import type {
  CampaignType,
  CampaignStatus,
  BudgetEntryType,
  ReportType,
  ReportFrequency,
} from "./types";

// ─── Campaigns ────────────────────────────────────────────────────────────────

export async function createCampaign(data: {
  title: string;
  campaign_type: CampaignType;
  description?: string | null;
  objective?: string | null;
  audience_segment?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_budget?: number | null;
  kpis?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const errors = validateCampaign({
    title: data.title,
    campaign_type: data.campaign_type,
    start_date: data.start_date ?? null,
    end_date: data.end_date ?? null,
  });
  if (errors.length > 0) return { error: errors.join(", ") };

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      title: data.title,
      campaign_type: data.campaign_type,
      description: data.description ?? null,
      objective: data.objective ?? null,
      audience_segment: data.audience_segment ?? null,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      total_budget: data.total_budget ?? null,
      kpis: data.kpis ?? {},
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: campaign };
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    title: string;
    campaign_type: CampaignType;
    description: string | null;
    objective: string | null;
    audience_segment: string | null;
    status: CampaignStatus;
    start_date: string | null;
    end_date: string | null;
    total_budget: number | null;
    kpis: Record<string, unknown>;
  }>
) {
  const supabase = await createClient();

  if (data.title !== undefined || data.campaign_type !== undefined) {
    const errors = validateCampaign({
      title: data.title ?? "",
      campaign_type: data.campaign_type ?? "evergreen",
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
    });
    if (errors.length > 0) return { error: errors.join(", ") };
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: campaign };
}

export async function getCampaigns() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getCampaign(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Campaign Channels ────────────────────────────────────────────────────────

export async function addCampaignChannel(data: {
  campaign_id: string;
  channel: string;
  planned_budget?: number | null;
  actual_spend?: number | null;
  target_impressions?: number | null;
  target_clicks?: number | null;
  target_conversions?: number | null;
}) {
  const supabase = await createClient();

  const { data: channel, error } = await supabase
    .from("campaign_channels")
    .insert({
      campaign_id: data.campaign_id,
      channel: data.channel,
      planned_budget: data.planned_budget ?? null,
      actual_spend: data.actual_spend ?? null,
      target_impressions: data.target_impressions ?? null,
      target_clicks: data.target_clicks ?? null,
      target_conversions: data.target_conversions ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: channel };
}

export async function updateCampaignChannel(
  id: string,
  data: Partial<{
    channel: string;
    planned_budget: number | null;
    actual_spend: number | null;
    target_impressions: number | null;
    target_clicks: number | null;
    target_conversions: number | null;
  }>
) {
  const supabase = await createClient();
  const { data: channel, error } = await supabase
    .from("campaign_channels")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: channel };
}

export async function getCampaignChannels(campaignId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_channels")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

// ─── Campaign Content ─────────────────────────────────────────────────────────

export async function linkContent(data: {
  campaign_id: string;
  content_item_id?: string | null;
  sequence_id?: string | null;
}) {
  const supabase = await createClient();

  const { data: link, error } = await supabase
    .from("campaign_content")
    .insert({
      campaign_id: data.campaign_id,
      content_item_id: data.content_item_id ?? null,
      sequence_id: data.sequence_id ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: link };
}

export async function unlinkContent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaign_content").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getCampaignContent(campaignId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_content")
    .select("*, content_item_id(*), sequence_id(*)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

// ─── Budget Entries ───────────────────────────────────────────────────────────

export async function addBudgetEntry(data: {
  campaign_id: string;
  description: string;
  amount: number;
  entry_type: BudgetEntryType;
  channel?: string | null;
  date?: string | null;
}) {
  const supabase = await createClient();

  const errors = validateBudgetEntry({
    description: data.description,
    amount: data.amount,
    entry_type: data.entry_type,
  });
  if (errors.length > 0) return { error: errors.join(", ") };

  const { data: entry, error } = await supabase
    .from("budget_entries")
    .insert({
      campaign_id: data.campaign_id,
      description: data.description,
      amount: data.amount,
      entry_type: data.entry_type,
      channel: data.channel ?? null,
      date: data.date ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: entry };
}

export async function updateBudgetEntry(
  id: string,
  data: Partial<{
    description: string;
    amount: number;
    entry_type: BudgetEntryType;
    channel: string | null;
    date: string | null;
  }>
) {
  const supabase = await createClient();

  if (
    data.description !== undefined ||
    data.amount !== undefined ||
    data.entry_type !== undefined
  ) {
    const errors = validateBudgetEntry({
      description: data.description ?? "placeholder",
      amount: data.amount ?? 1,
      entry_type: data.entry_type ?? "planned",
    });
    if (errors.length > 0) return { error: errors.join(", ") };
  }

  const { data: entry, error } = await supabase
    .from("budget_entries")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: entry };
}

export async function deleteBudgetEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budget_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getBudgetEntries(campaignId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_entries")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function createReport(data: {
  title: string;
  report_type: ReportType;
  date_from?: string | null;
  date_to?: string | null;
  data?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!data.title?.trim()) return { error: "Title is required" };

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      title: data.title,
      report_type: data.report_type,
      date_from: data.date_from ?? null,
      date_to: data.date_to ?? null,
      data: data.data ?? {},
      status: "generating",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: report };
}

export async function getReports() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getReport(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateReport(
  id: string,
  data: Partial<{
    title: string;
    status: string;
    data: Record<string, unknown>;
    pdf_path: string | null;
  }>
) {
  const supabase = await createClient();
  const { data: report, error } = await supabase
    .from("reports")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: report };
}

// ─── Report Schedules ─────────────────────────────────────────────────────────

export async function createReportSchedule(data: {
  report_type: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  next_run_at?: string | null;
  config?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!data.recipients?.length) return { error: "At least one recipient is required" };

  const { data: schedule, error } = await supabase
    .from("report_schedules")
    .insert({
      report_type: data.report_type,
      frequency: data.frequency,
      recipients: data.recipients,
      next_run_at: data.next_run_at ?? null,
      enabled: true,
      config: data.config ?? {},
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: schedule };
}

export async function updateReportSchedule(
  id: string,
  data: Partial<{
    frequency: ReportFrequency;
    recipients: string[];
    next_run_at: string | null;
    enabled: boolean;
    config: Record<string, unknown>;
  }>
) {
  const supabase = await createClient();
  const { data: schedule, error } = await supabase
    .from("report_schedules")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: schedule };
}

export async function getReportSchedules() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function deleteReportSchedule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("report_schedules").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
