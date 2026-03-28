"use server";

import { createClient } from "@/lib/supabase/server";
import {
  validateLandingPage,
  validateLeadMagnet,
  validateSequence,
} from "./validation";

// ─── Landing Pages ───────────────────────────────────────────────────────────

export async function createLandingPage(data: {
  title: string;
  slug: string;
  blocks?: Record<string, unknown>[];
  lead_magnet_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const errors = validateLandingPage({ title: data.title, slug: data.slug });
  if (errors.length > 0) return { error: errors.join(", ") };

  const { data: page, error } = await supabase
    .from("landing_pages")
    .insert({
      title: data.title,
      slug: data.slug,
      blocks: data.blocks ?? [],
      lead_magnet_id: data.lead_magnet_id ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: page };
}

export async function updateLandingPage(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    status: string;
    blocks: Record<string, unknown>[];
    variant_b_blocks: Record<string, unknown>[] | null;
    ab_test_active: boolean;
    winner: string | null;
    lead_magnet_id: string | null;
  }>
) {
  const supabase = await createClient();

  if (data.title !== undefined || data.slug !== undefined) {
    const errors = validateLandingPage({
      title: data.title ?? "",
      slug: data.slug ?? "",
    });
    if (errors.length > 0) return { error: errors.join(", ") };
  }

  const { data: page, error } = await supabase
    .from("landing_pages")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: page };
}

export async function getLandingPages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getLandingPage(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteLandingPage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("landing_pages").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Lead Magnets ─────────────────────────────────────────────────────────────

export async function createLeadMagnet(data: {
  title: string;
  description?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  delivery_email_subject?: string | null;
  delivery_email_body?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const errors = validateLeadMagnet({ title: data.title });
  if (errors.length > 0) return { error: errors.join(", ") };

  const { data: magnet, error } = await supabase
    .from("lead_magnets")
    .insert({
      title: data.title,
      description: data.description ?? null,
      file_path: data.file_path ?? null,
      file_type: data.file_type ?? null,
      delivery_email_subject: data.delivery_email_subject ?? null,
      delivery_email_body: data.delivery_email_body ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: magnet };
}

export async function getLeadMagnets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_magnets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function deleteLeadMagnet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Email Sequences ──────────────────────────────────────────────────────────

export async function createSequence(data: {
  name: string;
  description?: string | null;
  trigger_type?: string;
  trigger_value?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const errors = validateSequence({ name: data.name });
  if (errors.length > 0) return { error: errors.join(", ") };

  const { data: sequence, error } = await supabase
    .from("email_sequences")
    .insert({
      name: data.name,
      description: data.description ?? null,
      trigger_type: data.trigger_type ?? "manual",
      trigger_value: data.trigger_value ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: sequence };
}

export async function updateSequence(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    trigger_type: string;
    trigger_value: string | null;
    status: string;
  }>
) {
  const supabase = await createClient();
  const { data: sequence, error } = await supabase
    .from("email_sequences")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: sequence };
}

export async function getSequences() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_sequences")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getSequenceWithSteps(id: string) {
  const supabase = await createClient();
  const { data: sequence, error: seqError } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("id", id)
    .single();

  if (seqError) return { error: seqError.message };

  const { data: steps, error: stepsError } = await supabase
    .from("email_sequence_steps")
    .select("*")
    .eq("sequence_id", id)
    .order("step_index", { ascending: true });

  if (stepsError) return { error: stepsError.message };
  return { data: { ...sequence, steps: steps ?? [] } };
}

export async function saveSequenceSteps(
  sequenceId: string,
  steps: Array<{
    step_index: number;
    step_type: string;
    subject?: string | null;
    body_html?: string | null;
    delay_minutes?: number | null;
    condition_type?: string | null;
    condition_value?: string | null;
    true_next_index?: number | null;
    false_next_index?: number | null;
  }>
) {
  const supabase = await createClient();

  // Delete existing steps and re-insert
  const { error: deleteError } = await supabase
    .from("email_sequence_steps")
    .delete()
    .eq("sequence_id", sequenceId);

  if (deleteError) return { error: deleteError.message };

  if (steps.length === 0) return { data: [] };

  const { data, error } = await supabase
    .from("email_sequence_steps")
    .insert(steps.map((step) => ({ ...step, sequence_id: sequenceId })))
    .select();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteSequence(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

export async function enrollContact(contactId: string, sequenceId: string) {
  const supabase = await createClient();

  // Check for existing enrollment
  const { data: existing } = await supabase
    .from("sequence_enrollments")
    .select("id, status")
    .eq("contact_id", contactId)
    .eq("sequence_id", sequenceId)
    .single();

  if (existing) {
    if (existing.status === "active") {
      return { error: "Contact is already enrolled in this sequence" };
    }
    // Re-enroll: reset to active
    const { data, error } = await supabase
      .from("sequence_enrollments")
      .update({ status: "active", current_step_index: 0, completed_at: null })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  }

  const { data, error } = await supabase
    .from("sequence_enrollments")
    .insert({
      contact_id: contactId,
      sequence_id: sequenceId,
      current_step_index: 0,
      next_send_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getSequenceAnalytics(sequenceId: string) {
  const supabase = await createClient();

  const { data: enrollments, error: enrollError } = await supabase
    .from("sequence_enrollments")
    .select("status")
    .eq("sequence_id", sequenceId);

  if (enrollError) return { error: enrollError.message };

  const { data: steps, error: stepsError } = await supabase
    .from("email_sequence_steps")
    .select("id, step_index, subject, step_type")
    .eq("sequence_id", sequenceId)
    .order("step_index", { ascending: true });

  if (stepsError) return { error: stepsError.message };

  const { data: sends, error: sendsError } = await supabase
    .from("email_sends")
    .select("status, sequence_enrollment_id");

  if (sendsError) return { error: sendsError.message };

  const total = enrollments?.length ?? 0;
  const active = enrollments?.filter((e) => e.status === "active").length ?? 0;
  const completed = enrollments?.filter((e) => e.status === "completed").length ?? 0;
  const exited = enrollments?.filter((e) => e.status === "exited").length ?? 0;

  const totalSends = sends?.length ?? 0;
  const opened = sends?.filter((s) => s.status === "opened" || s.status === "clicked").length ?? 0;
  const clicked = sends?.filter((s) => s.status === "clicked").length ?? 0;

  return {
    data: {
      enrollments: { total, active, completed, exited },
      sends: {
        total: totalSends,
        opened,
        clicked,
        openRate: totalSends > 0 ? opened / totalSends : 0,
        clickRate: totalSends > 0 ? clicked / totalSends : 0,
      },
      steps: steps ?? [],
    },
  };
}

// ─── Form Submissions ─────────────────────────────────────────────────────────

export async function getFormSubmissions(formId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("form_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (formId) query = query.eq("form_id", formId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

// ─── Funnel Overview ──────────────────────────────────────────────────────────

export async function getFunnelOverview() {
  const supabase = await createClient();

  const [
    { count: totalPages },
    { count: publishedPages },
    { count: totalMagnets },
    { data: magnetStats },
    { count: activeSequences },
    { count: totalSubmissions },
    { data: contactStages },
  ] = await Promise.all([
    supabase.from("landing_pages").select("*", { count: "exact", head: true }),
    supabase
      .from("landing_pages")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("lead_magnets").select("*", { count: "exact", head: true }),
    supabase.from("lead_magnets").select("download_count"),
    supabase
      .from("email_sequences")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("form_submissions").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("stage"),
  ]);

  const totalDownloads = magnetStats?.reduce((sum, m) => sum + (m.download_count ?? 0), 0) ?? 0;

  const stageCounts: Record<string, number> = {};
  for (const contact of contactStages ?? []) {
    stageCounts[contact.stage] = (stageCounts[contact.stage] || 0) + 1;
  }

  return {
    data: {
      landingPages: { total: totalPages ?? 0, published: publishedPages ?? 0 },
      leadMagnets: { total: totalMagnets ?? 0, totalDownloads },
      sequences: { active: activeSequences ?? 0 },
      formSubmissions: { total: totalSubmissions ?? 0 },
      contactsByStage: stageCounts,
    },
  };
}
