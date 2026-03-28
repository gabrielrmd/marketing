export type CampaignType = "product_launch" | "seasonal" | "evergreen" | "event";
export type CampaignStatus = "draft" | "active" | "completed" | "archived";

export type Campaign = {
  id: string;
  title: string;
  description: string | null;
  campaign_type: CampaignType;
  objective: string | null;
  audience_segment: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  total_budget: number | null;
  kpis: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CampaignChannel = {
  id: string;
  campaign_id: string;
  channel: string;
  planned_budget: number | null;
  actual_spend: number | null;
  target_impressions: number | null;
  target_clicks: number | null;
  target_conversions: number | null;
  created_at: string;
  updated_at: string;
};

export type CampaignContent = {
  id: string;
  campaign_id: string;
  content_item_id: string | null;
  sequence_id: string | null;
  created_at: string;
};

export type BudgetEntryType = "planned" | "actual";

export type BudgetEntry = {
  id: string;
  campaign_id: string;
  channel: string | null;
  description: string;
  entry_type: BudgetEntryType;
  amount: number;
  date: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalyticsEvent = {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  contact_id: string | null;
  campaign_id: string | null;
  channel: string | null;
  source: string | null;
  revenue: number | null;
  created_at: string;
};

export type DashboardWidget = {
  id: string;
  user_id: string;
  widget_type: string;
  config: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ReportType = "weekly" | "monthly" | "campaign" | "custom";
export type ReportStatus = "generating" | "ready" | "failed";

export type Report = {
  id: string;
  title: string;
  report_type: ReportType;
  date_from: string | null;
  date_to: string | null;
  data: Record<string, unknown>;
  pdf_path: string | null;
  status: ReportStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ReportFrequency = "weekly" | "monthly";

export type ReportSchedule = {
  id: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  next_run_at: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};
