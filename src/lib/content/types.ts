export type ContentStatus = "draft" | "scheduled" | "published" | "failed";
export type ChannelId = "linkedin" | "email" | "youtube" | "instagram" | "blog" | "podcast";
export type PillarId = "library" | "challenge" | "circle" | "stage" | "summit" | "stories";
export type ContentTypeId = "educational" | "promotional" | "community" | "storytelling";

export type ContentItem = {
  id: string;
  title: string;
  slug: string | null;
  body: Record<string, unknown>;
  body_text: string;
  status: ContentStatus;
  content_type: ContentTypeId;
  channel: ChannelId;
  pillar: PillarId | null;
  episode_number: number | null;
  show_notes: string | null;
  guest_name: string | null;
  guest_bio: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ContentVersion = {
  id: string;
  content_item_id: string;
  title: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version_number: number;
  created_at: string;
};

export type ContentTemplate = {
  id: string;
  name: string;
  description: string | null;
  channel: ChannelId;
  body: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  tags: string[];
  uploaded_by: string;
  created_at: string;
};

export type PublishingLog = {
  id: string;
  content_item_id: string;
  channel: string;
  status: "pending" | "success" | "failed";
  external_id: string | null;
  response: Record<string, unknown>;
  error_message: string | null;
  published_at: string;
};

export type CalendarFilters = {
  channels?: ChannelId[];
  pillars?: PillarId[];
  contentTypes?: ContentTypeId[];
  statuses?: ContentStatus[];
};
