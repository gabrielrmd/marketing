"use server";

import { createClient } from "@/lib/supabase/server";
import type { ContactStage } from "@/lib/funnel/types";
import type {
  ContactWithDetails,
  ContactActivity,
  ContactNote,
  ContactTask,
  Segment,
  SegmentContact,
} from "./types";

// ─── Contact Filters type ─────────────────────────────────────────────────────

export type ContactFilters = {
  stage?: ContactStage;
  score_min?: number;
  score_max?: number;
  tags?: string[];
  source?: string;
  assigned_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

// ─── getContacts ──────────────────────────────────────────────────────────────

/**
 * Paginated contact list with optional filters for stage, score range, tags,
 * source, assigned team member, and a full-text search on name/email.
 */
export async function getContacts(filters: ContactFilters = {}) {
  const supabase = await createClient();

  const {
    stage,
    score_min,
    score_max,
    tags,
    source,
    assigned_to,
    search,
    limit = 50,
    offset = 0,
  } = filters;

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (stage) query = query.eq("stage", stage);
  if (score_min !== undefined) query = query.gte("lead_score", score_min);
  if (score_max !== undefined) query = query.lte("lead_score", score_max);
  if (source) query = query.eq("source", source);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);
  if (tags && tags.length > 0) query = query.overlaps("tags", tags);
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return { error: error.message };
  return { data, count };
}

// ─── getContact ───────────────────────────────────────────────────────────────

/**
 * Full contact profile including structured tags, recent activities, notes,
 * tasks, and segment memberships.
 */
export async function getContact(id: string) {
  const supabase = await createClient();

  const [
    contactResult,
    tagsResult,
    activitiesResult,
    notesResult,
    tasksResult,
    segmentsResult,
  ] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).single(),
    supabase.from("contact_tags").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase
      .from("contact_activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("contact_notes")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_tasks")
      .select("*")
      .eq("contact_id", id)
      .order("due_date", { ascending: true }),
    supabase
      .from("segment_contacts")
      .select("segment_id, segments(*)")
      .eq("contact_id", id),
  ]);

  if (contactResult.error) return { error: contactResult.error.message };

  const contact = contactResult.data;
  const segments: Segment[] = (segmentsResult.data ?? [])
    .map((sc: { segment_id: string; segments: unknown }) => sc.segments)
    .filter(Boolean) as Segment[];

  const full: ContactWithDetails = {
    ...contact,
    tags_structured: tagsResult.data ?? [],
    activities: (activitiesResult.data ?? []) as ContactActivity[],
    notes: (notesResult.data ?? []) as ContactNote[],
    tasks: (tasksResult.data ?? []) as ContactTask[],
    segments,
  };

  return { data: full };
}

// ─── getContactActivities ─────────────────────────────────────────────────────

/**
 * Activity timeline for a single contact, most recent first.
 */
export async function getContactActivities(
  contactId: string,
  limit = 25
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_activities")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data: data as ContactActivity[] };
}

// ─── getContactsByStage ───────────────────────────────────────────────────────

/**
 * All contacts grouped by stage — used by the Kanban pipeline view.
 */
export async function getContactsByStage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("lead_score", { ascending: false });

  if (error) return { error: error.message };

  const grouped: Record<ContactStage, typeof data> = {} as Record<
    ContactStage,
    typeof data
  >;

  for (const contact of data ?? []) {
    const stage = contact.stage as ContactStage;
    if (!grouped[stage]) grouped[stage] = [];
    grouped[stage].push(contact);
  }

  return { data: grouped };
}

// ─── getSegments ──────────────────────────────────────────────────────────────

/**
 * All segments with their current member counts.
 */
export async function getSegments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("segments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data: data as Segment[] };
}

// ─── getSegmentMembers ────────────────────────────────────────────────────────

/**
 * All contacts that are members of the given segment.
 */
export async function getSegmentMembers(segmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("segment_contacts")
    .select("contact_id, contacts(*)")
    .eq("segment_id", segmentId)
    .order("added_at", { ascending: false });

  if (error) return { error: error.message };

  const contacts = (data ?? [])
    .map((sc: { contact_id: string; contacts: unknown }) => sc.contacts)
    .filter(Boolean);

  return { data: contacts };
}

// ─── getTeamTasks ─────────────────────────────────────────────────────────────

/**
 * All pending/in-progress tasks assigned to a specific user, with contact info.
 */
export async function getTeamTasks(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_tasks")
    .select("*, contacts(id, name, email)")
    .eq("assigned_to", userId)
    .neq("status", "completed")
    .order("due_date", { ascending: true });

  if (error) return { error: error.message };
  return { data: data as (ContactTask & { contacts: { id: string; name: string | null; email: string } | null })[] };
}

// ─── getContactStats ──────────────────────────────────────────────────────────

/**
 * CRM overview stats: total contacts, per-stage counts, average lead score,
 * new contacts this month.
 */
export async function getContactStats() {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [allContactsResult, newThisMonthResult] = await Promise.all([
    supabase.from("contacts").select("stage, lead_score"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  if (allContactsResult.error) return { error: allContactsResult.error.message };

  const contacts = allContactsResult.data ?? [];
  const total = contacts.length;

  const perStage: Record<string, number> = {};
  let scoreSum = 0;

  for (const c of contacts) {
    const stage = c.stage ?? "unknown";
    perStage[stage] = (perStage[stage] ?? 0) + 1;
    scoreSum += c.lead_score ?? 0;
  }

  const avgScore = total > 0 ? Math.round(scoreSum / total) : 0;

  return {
    data: {
      total,
      perStage,
      avgScore,
      newThisMonth: newThisMonthResult.count ?? 0,
    },
  };
}
