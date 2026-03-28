const VALID_CHANNELS = ["linkedin", "email", "youtube", "instagram", "blog", "podcast"];
const VALID_TYPES = ["educational", "promotional", "community", "storytelling"];

type ContentInput = {
  title: string;
  channel: string;
  content_type: string;
  scheduled_at?: string;
};

export function validateContentItem(input: ContentInput): string[] {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required");
  if (!input.channel || !VALID_CHANNELS.includes(input.channel)) errors.push("Channel is required");
  if (!input.content_type || !VALID_TYPES.includes(input.content_type)) errors.push("Content type is required");
  if (input.scheduled_at && new Date(input.scheduled_at) <= new Date()) {
    errors.push("Scheduled date must be in the future");
  }
  return errors;
}

function extractText(node: Record<string, unknown>): string {
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) return node.content.map((child: Record<string, unknown>) => extractText(child)).join(" ");
  return "";
}

export function prepareContentForSave(data: { body: Record<string, unknown> }) {
  return { body_text: extractText(data.body).trim() };
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
