"use server";

import { createClient } from "@/lib/supabase/server";
import { validateContact, validateNote, validateTask } from "./validation";
import { calculateLeadScore } from "./scoring";
import type { ContactStage, Contact } from "@/lib/funnel/types";
import type {
  TaskStatus,
  SegmentFilterRule,
  LeadScoreRule,
  ContactActivity,
} from "./types";

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function createContact(data: {
  email: string;
  name?: string | null;
  company?: string | null;
  source?: string | null;
  stage?: ContactStage;
  tags?: string[];
  assigned_to?: string | null;
}) {
  const errors = validateContact({ email: data.email });
  if (errors.length > 0) return { error: errors.join(", ") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      email: data.email.trim(),
      name: data.name ?? null,
      company: data.company ?? null,
      source: data.source ?? null,
      stage: data.stage ?? "subscriber",
      tags: data.tags ?? [],
      assigned_to: data.assigned_to ?? null,
      lead_score: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: contact };
}

export async function updateContact(
  id: string,
  data: Partial<{
    email: string;
    name: string | null;
    company: string | null;
    source: string | null;
    stage: ContactStage;
    tags: string[];
    assigned_to: string | null;
  }>
) {
  if (data.email !== undefined) {
    const errors = validateContact({ email: data.email });
    if (errors.length > 0) return { error: errors.join(", ") };
  }

  const supabase = await createClient();
  const { data: contact, error } = await supabase
    .from("contacts")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: contact };
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function assignContact(id: string, userId: string | null) {
  const supabase = await createClient();
  const { data: contact, error } = await supabase
    .from("contacts")
    .update({ assigned_to: userId })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: contact };
}

export async function updateContactStage(id: string, stage: ContactStage) {
  const supabase = await createClient();
  const { data: contact, error } = await supabase
    .from("contacts")
    .update({ stage })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: contact };
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function addTag(contactId: string, tag: string) {
  const supabase = await createClient();

  // Insert into structured contact_tags table
  const { error: tagError } = await supabase
    .from("contact_tags")
    .insert({ contact_id: contactId, tag: tag.trim() });

  if (tagError && tagError.code !== "23505") {
    // 23505 = unique violation (tag already exists)
    return { error: tagError.message };
  }

  // Also keep the tags[] array on the contacts row in sync
  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("tags")
    .eq("id", contactId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const currentTags: string[] = contact?.tags ?? [];
  if (!currentTags.includes(tag.trim())) {
    const { error: updateError } = await supabase
      .from("contacts")
      .update({ tags: [...currentTags, tag.trim()] })
      .eq("id", contactId);

    if (updateError) return { error: updateError.message };
  }

  return { success: true };
}

export async function removeTag(contactId: string, tag: string) {
  const supabase = await createClient();

  const { error: tagError } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", contactId)
    .eq("tag", tag.trim());

  if (tagError) return { error: tagError.message };

  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("tags")
    .eq("id", contactId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const currentTags: string[] = contact?.tags ?? [];
  const { error: updateError } = await supabase
    .from("contacts")
    .update({ tags: currentTags.filter((t) => t !== tag.trim()) })
    .eq("id", contactId);

  if (updateError) return { error: updateError.message };
  return { success: true };
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function addNote(contactId: string, content: string) {
  const errors = validateNote({ content });
  if (errors.length > 0) return { error: errors.join(", ") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: note, error } = await supabase
    .from("contact_notes")
    .insert({ contact_id: contactId, content: content.trim(), created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: note };
}

export async function updateNote(id: string, content: string) {
  const errors = validateNote({ content });
  if (errors.length > 0) return { error: errors.join(", ") };

  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("contact_notes")
    .update({ content: content.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: note };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_notes").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(data: {
  contact_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
}) {
  const errors = validateTask({ title: data.title });
  if (errors.length > 0) return { error: errors.join(", ") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: task, error } = await supabase
    .from("contact_tasks")
    .insert({
      contact_id: data.contact_id,
      title: data.title.trim(),
      description: data.description ?? null,
      due_date: data.due_date ?? null,
      assigned_to: data.assigned_to ?? null,
      created_by: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: task };
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    due_date: string | null;
    status: TaskStatus;
    assigned_to: string | null;
  }>
) {
  if (data.title !== undefined) {
    const errors = validateTask({ title: data.title });
    if (errors.length > 0) return { error: errors.join(", ") };
  }

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("contact_tasks")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: task };
}

export async function completeTask(id: string) {
  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("contact_tasks")
    .update({ status: "completed" })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: task };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Segments ─────────────────────────────────────────────────────────────────

export async function createSegment(data: {
  name: string;
  description?: string | null;
  filter_rules: SegmentFilterRule;
  is_preset?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: segment, error } = await supabase
    .from("segments")
    .insert({
      name: data.name,
      description: data.description ?? null,
      filter_rules: data.filter_rules,
      is_preset: data.is_preset ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: segment };
}

export async function updateSegment(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    filter_rules: SegmentFilterRule;
  }>
) {
  const supabase = await createClient();
  const { data: segment, error } = await supabase
    .from("segments")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: segment };
}

export async function deleteSegment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("segments").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Re-evaluate all contacts against a segment's filter rules and update
 * segment_contacts membership accordingly.
 */
export async function refreshSegmentMembers(segmentId: string) {
  const supabase = await createClient();

  // Load the segment's filter rules
  const { data: segment, error: segError } = await supabase
    .from("segments")
    .select("filter_rules")
    .eq("id", segmentId)
    .single();

  if (segError) return { error: segError.message };

  const rules: SegmentFilterRule = segment.filter_rules;

  // Load all contacts
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, email, name, source, tags, stage, lead_score, created_at, updated_at");

  if (contactsError) return { error: contactsError.message };

  // Evaluate each contact against the filter
  const { evaluateSegmentFilter } = await import("./segments");

  const matchingIds: string[] = [];
  const nonMatchingIds: string[] = [];

  for (const contact of contacts ?? []) {
    if (evaluateSegmentFilter(contact as Contact, rules)) {
      matchingIds.push(contact.id);
    } else {
      nonMatchingIds.push(contact.id);
    }
  }

  // Remove contacts no longer matching
  if (nonMatchingIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("segment_contacts")
      .delete()
      .eq("segment_id", segmentId)
      .in("contact_id", nonMatchingIds);

    if (deleteError) return { error: deleteError.message };
  }

  // Upsert matching contacts
  if (matchingIds.length > 0) {
    const rows = matchingIds.map((cid) => ({
      segment_id: segmentId,
      contact_id: cid,
    }));

    const { error: upsertError } = await supabase
      .from("segment_contacts")
      .upsert(rows, { onConflict: "segment_id,contact_id" });

    if (upsertError) return { error: upsertError.message };
  }

  // Update member count
  const { error: countError } = await supabase
    .from("segments")
    .update({ contact_count: matchingIds.length })
    .eq("id", segmentId);

  if (countError) return { error: countError.message };
  return { success: true, count: matchingIds.length };
}

// ─── Lead Score Rules ─────────────────────────────────────────────────────────

export async function getScoreRules() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_score_rules")
    .select("*")
    .order("points", { ascending: false });

  if (error) return { error: error.message };
  return { data: data as LeadScoreRule[] };
}

export async function updateScoreRule(id: string, points: number) {
  const supabase = await createClient();
  const { data: rule, error } = await supabase
    .from("lead_score_rules")
    .update({ points })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: rule as LeadScoreRule };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Recalculate a contact's lead score from their activities and the current
 * scoring rules, then persist the updated score.
 */
export async function recalculateContactScore(contactId: string) {
  const supabase = await createClient();

  const [activitiesResult, rulesResult] = await Promise.all([
    supabase
      .from("contact_activities")
      .select("*")
      .eq("contact_id", contactId),
    supabase.from("lead_score_rules").select("*"),
  ]);

  if (activitiesResult.error) return { error: activitiesResult.error.message };
  if (rulesResult.error) return { error: rulesResult.error.message };

  const activities = (activitiesResult.data ?? []) as ContactActivity[];
  const rules = (rulesResult.data ?? []) as LeadScoreRule[];

  const newScore = calculateLeadScore(activities, rules);

  const { data: contact, error: updateError } = await supabase
    .from("contacts")
    .update({ lead_score: newScore })
    .eq("id", contactId)
    .select()
    .single();

  if (updateError) return { error: updateError.message };
  return { data: contact, score: newScore };
}
