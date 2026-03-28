import type { Contact, ContactStage } from "@/lib/funnel/types";

// Lead score level thresholds: Cold (<20), Warm (20-50), Hot (50+), Customer (purchased)
export type LeadScoreLevel = "cold" | "warm" | "hot" | "customer";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type ContactTag = {
  id: string;
  contact_id: string;
  tag: string;
  created_at: string;
};

export type ContactActivity = {
  id: string;
  contact_id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  content_item_id: string | null;
  email_send_id: string | null;
  campaign_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type ContactNote = {
  id: string;
  contact_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ContactTask = {
  id: string;
  contact_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  filter_rules: SegmentFilterRule;
  is_preset: boolean;
  contact_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SegmentContact = {
  id: string;
  segment_id: string;
  contact_id: string;
  added_at: string;
};

export type LeadScoreRule = {
  id: string;
  action: string;
  points: number;
  description: string | null;
  created_at: string;
};

// Filter rule structure stored in segments.filter_rules jsonb column
export type SegmentFilterRule = {
  stage_equals?: ContactStage;
  score_above?: number;
  score_below?: number;
  has_tag?: string;
  source_equals?: string;
  inactive_days?: number;
};

// Extended contact with all CRM relations loaded
export type ContactWithDetails = Contact & {
  company: string | null;
  assigned_to: string | null;
  tags_structured: ContactTag[];
  activities: ContactActivity[];
  notes: ContactNote[];
  tasks: ContactTask[];
  segments: Segment[];
};
