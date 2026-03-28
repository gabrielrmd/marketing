"use server";

import { createClient } from "@/lib/supabase/server";
import { validateContentItem, prepareContentForSave, generateSlug } from "./validation";
import type { ChannelId, ContentTypeId } from "./types";


export async function createContentItem(data: {
  title: string;
  body: Record<string, unknown>;
  channel: ChannelId;
  content_type: ContentTypeId;
  pillar?: string | null;
  scheduled_at?: string | null;
  episode_number?: number | null;
  show_notes?: string | null;
  guest_name?: string | null;
  guest_bio?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const errors = validateContentItem(data);
  if (errors.length > 0) return { error: errors.join(", ") };

  const { body_text } = prepareContentForSave({ body: data.body });
  const status = data.scheduled_at ? "scheduled" : "draft";
  const slug = data.channel === "blog" ? generateSlug(data.title) : null;

  const { data: item, error } = await supabase
    .from("content_items")
    .insert({
      title: data.title, slug, body: data.body, body_text, status,
      channel: data.channel, content_type: data.content_type,
      pillar: data.pillar ?? null, scheduled_at: data.scheduled_at ?? null,
      episode_number: data.episode_number ?? null, show_notes: data.show_notes ?? null,
      guest_name: data.guest_name ?? null, guest_bio: data.guest_bio ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("content_versions").insert({
    content_item_id: item.id, title: data.title, body: data.body, version_number: 1,
  });

  return { data: item };
}

export async function updateContentItem(
  id: string,
  data: Partial<{
    title: string; body: Record<string, unknown>; channel: ChannelId;
    content_type: ContentTypeId; pillar: string | null; scheduled_at: string | null;
    status: string; episode_number: number | null; show_notes: string | null;
    guest_name: string | null; guest_bio: string | null;
  }>
) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { ...data };

  if (data.body) {
    updates.body_text = prepareContentForSave({ body: data.body }).body_text;
  }
  if (data.scheduled_at && !data.status) {
    updates.status = "scheduled";
  }

  const { data: item, error } = await supabase
    .from("content_items").update(updates).eq("id", id).select().single();

  if (error) return { error: error.message };

  if (data.body) {
    const { count } = await supabase
      .from("content_versions")
      .select("*", { count: "exact", head: true })
      .eq("content_item_id", id);

    await supabase.from("content_versions").insert({
      content_item_id: id, title: item.title, body: data.body,
      version_number: (count ?? 0) + 1,
    });
  }

  return { data: item };
}

export async function deleteContentItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function rescheduleContentItem(id: string, newDate: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({ scheduled_at: newDate, status: "scheduled" })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getContentItems(filters: {
  from?: string; to?: string; channels?: string[]; pillars?: string[]; statuses?: string[];
}) {
  const supabase = await createClient();
  let query = supabase.from("content_items").select("*").order("scheduled_at", { ascending: true });

  if (filters.from) query = query.gte("scheduled_at", filters.from);
  if (filters.to) query = query.lte("scheduled_at", filters.to);
  if (filters.channels?.length) query = query.in("channel", filters.channels);
  if (filters.pillars?.length) query = query.in("pillar", filters.pillars);
  if (filters.statuses?.length) query = query.in("status", filters.statuses);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getPillarCoverage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_items").select("pillar").not("pillar", "is", null);

  if (error) return { error: error.message };

  const counts: Record<string, number> = {};
  for (const item of data ?? []) {
    counts[item.pillar] = (counts[item.pillar] || 0) + 1;
  }
  return { data: counts };
}

export async function getContentVersions(contentItemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_versions").select("*")
    .eq("content_item_id", contentItemId)
    .order("version_number", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function saveCalendarView(name: string, filters: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("content_calendar_views")
    .insert({ user_id: user.id, name, filters })
    .select().single();

  if (error) return { error: error.message };
  return { data };
}

export async function getCalendarViews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_calendar_views").select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
