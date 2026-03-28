export type ContactStage =
  | "visitor"
  | "subscriber"
  | "engaged"
  | "challenge_participant"
  | "circle_member"
  | "strategy_customer"
  | "advocate";

export type Contact = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  tags: string[];
  stage: ContactStage;
  lead_score: number;
  created_at: string;
  updated_at: string;
};

export type LandingPageStatus = "draft" | "published" | "archived";
export type LandingPageWinner = "a" | "b";

export type LandingPage = {
  id: string;
  title: string;
  slug: string;
  status: LandingPageStatus;
  blocks: Record<string, unknown>[];
  variant_b_blocks: Record<string, unknown>[] | null;
  ab_test_active: boolean;
  visitors_a: number;
  visitors_b: number;
  conversions_a: number;
  conversions_b: number;
  winner: LandingPageWinner | null;
  lead_magnet_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type LeadMagnet = {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_type: string | null;
  download_count: number;
  delivery_email_subject: string | null;
  delivery_email_body: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SequenceTriggerType = "manual" | "form_submission" | "tag_added" | "stage_change";
export type SequenceStatus = "draft" | "active" | "paused" | "archived";

export type EmailSequence = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: SequenceTriggerType;
  trigger_value: string | null;
  status: SequenceStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SequenceStepType = "email" | "delay" | "condition";
export type ConditionType = "tag_exists" | "email_opened" | "email_clicked" | "score_above";

export type EmailSequenceStep = {
  id: string;
  sequence_id: string;
  step_index: number;
  step_type: SequenceStepType;
  subject: string | null;
  body_html: string | null;
  delay_minutes: number | null;
  condition_type: ConditionType | null;
  condition_value: string | null;
  true_next_index: number | null;
  false_next_index: number | null;
  created_at: string;
};

export type EnrollmentStatus = "active" | "completed" | "exited" | "paused";

export type SequenceEnrollment = {
  id: string;
  contact_id: string;
  sequence_id: string;
  current_step_index: number;
  next_send_at: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
};

export type EmailSendStatus = "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed";

export type EmailSend = {
  id: string;
  sequence_enrollment_id: string | null;
  contact_id: string;
  subject: string;
  resend_id: string | null;
  status: EmailSendStatus;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
};

export type FormSubmission = {
  id: string;
  form_id: string;
  contact_id: string | null;
  email: string;
  name: string | null;
  data: Record<string, unknown>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  ip_address: string | null;
  created_at: string;
};

export type FunnelEvent = {
  id: string;
  contact_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  source: string | null;
  created_at: string;
};

export type ABTestResult = {
  significant: boolean;
  winner: "a" | "b" | null;
  confidence: number;
};

export type PageBlockType = "hero" | "text" | "cta" | "form" | "image" | "testimonial";

export type PageBlock = {
  id: string;
  type: PageBlockType;
  content: Record<string, unknown>;
};
