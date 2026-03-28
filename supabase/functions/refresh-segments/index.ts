// supabase/functions/refresh-segments/index.ts
//
// Deno Edge Function — refreshes segment memberships for all contacts.
// For each segment, evaluates filter_rules against every contact and
// upserts/deletes rows in segment_contacts, then updates contact_count.
//
// Run in Supabase Dashboard > SQL Editor:
// -- select cron.schedule('refresh-segments', '0 3 * * *', $$
// --   select net.http_post(
// --     url := '<YOUR_SUPABASE_URL>/functions/v1/refresh-segments',
// --     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
// --   );
// -- $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ──────────────────────────────────────────────────────────
// Types (mirrored from src/lib/crm/types.ts and src/lib/funnel/types.ts
// — Deno can't import from the Next.js source tree at runtime)
// ──────────────────────────────────────────────────────────

type ContactStage =
  | "visitor"
  | "subscriber"
  | "engaged"
  | "challenge_participant"
  | "circle_member"
  | "strategy_customer"
  | "advocate";

interface Contact {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  tags: string[];
  stage: ContactStage;
  lead_score: number;
  created_at: string;
  updated_at: string;
}

interface SegmentFilterRule {
  stage_equals?: ContactStage;
  not_stage_equals?: ContactStage;
  score_above?: number;
  score_below?: number;
  has_tag?: string;
  source_equals?: string;
  inactive_days?: number;
}

interface Segment {
  id: string;
  name: string;
  filter_rules: SegmentFilterRule;
}

// ──────────────────────────────────────────────────────────
// Inline filter rule evaluator
// (Mirrors the logic from the migration's refresh_contact_segments
//  PL/pgSQL trigger function in 005_crm.sql)
// ──────────────────────────────────────────────────────────

function evaluateFilterRules(
  contact: Contact,
  rules: SegmentFilterRule,
  now: Date,
): boolean {
  // stage_equals: contact.stage must equal the specified stage
  if (rules.stage_equals !== undefined && contact.stage !== rules.stage_equals) {
    return false;
  }

  // not_stage_equals: contact.stage must NOT equal the specified stage
  if (rules.not_stage_equals !== undefined && contact.stage === rules.not_stage_equals) {
    return false;
  }

  // score_above: contact.lead_score must be strictly greater than the threshold
  if (rules.score_above !== undefined && contact.lead_score <= rules.score_above) {
    return false;
  }

  // score_below: contact.lead_score must be strictly less than the threshold
  if (rules.score_below !== undefined && contact.lead_score >= rules.score_below) {
    return false;
  }

  // has_tag: contact.tags array must include the specified tag
  if (rules.has_tag !== undefined && !contact.tags.includes(rules.has_tag)) {
    return false;
  }

  // source_equals: contact.source must match (empty string treated as null)
  if (
    rules.source_equals !== undefined &&
    (contact.source ?? "") !== rules.source_equals
  ) {
    return false;
  }

  // inactive_days: contact must NOT have been updated within the last N days
  if (rules.inactive_days !== undefined) {
    const cutoff = new Date(now.getTime() - rules.inactive_days * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(contact.updated_at);
    if (updatedAt >= cutoff) {
      return false;
    }
  }

  return true;
}

// ──────────────────────────────────────────────────────────
// Per-segment processor
// ──────────────────────────────────────────────────────────

type SegmentResult = {
  segmentId: string;
  segmentName: string;
  inserted: number;
  deleted: number;
  contactCount: number;
  error?: string;
};

async function processSegment(
  supabase: ReturnType<typeof createClient>,
  segment: Segment,
  contacts: Contact[],
  now: Date,
): Promise<SegmentResult> {
  const rules = segment.filter_rules ?? {};
  const matchingIds: string[] = [];
  const nonMatchingIds: string[] = [];

  for (const contact of contacts) {
    if (evaluateFilterRules(contact, rules, now)) {
      matchingIds.push(contact.id);
    } else {
      nonMatchingIds.push(contact.id);
    }
  }

  let inserted = 0;
  let deleted = 0;

  // Upsert matching contacts into segment_contacts
  if (matchingIds.length > 0) {
    const rows = matchingIds.map((contact_id) => ({
      segment_id: segment.id,
      contact_id,
    }));
    const { error: upsertErr } = await supabase
      .from("segment_contacts")
      .upsert(rows, { onConflict: "segment_id,contact_id", ignoreDuplicates: true });

    if (upsertErr) {
      throw new Error(`Upsert failed for segment ${segment.id}: ${upsertErr.message}`);
    }
    inserted = matchingIds.length;
  }

  // Delete non-matching contacts from segment_contacts
  if (nonMatchingIds.length > 0) {
    const { error: deleteErr } = await supabase
      .from("segment_contacts")
      .delete()
      .eq("segment_id", segment.id)
      .in("contact_id", nonMatchingIds);

    if (deleteErr) {
      throw new Error(`Delete failed for segment ${segment.id}: ${deleteErr.message}`);
    }
    deleted = nonMatchingIds.length;
  }

  // Update segment.contact_count
  const { count, error: countErr } = await supabase
    .from("segment_contacts")
    .select("*", { count: "exact", head: true })
    .eq("segment_id", segment.id);

  if (countErr) {
    throw new Error(`Count query failed for segment ${segment.id}: ${countErr.message}`);
  }

  const contactCount = count ?? matchingIds.length;

  const { error: updateErr } = await supabase
    .from("segments")
    .update({ contact_count: contactCount })
    .eq("id", segment.id);

  if (updateErr) {
    throw new Error(`Count update failed for segment ${segment.id}: ${updateErr.message}`);
  }

  return {
    segmentId: segment.id,
    segmentName: segment.name,
    inserted,
    deleted,
    contactCount,
  };
}

// ──────────────────────────────────────────────────────────
// Edge Function handler
// ──────────────────────────────────────────────────────────

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();

    // 1. Load all segments with their filter_rules
    const { data: segments, error: segErr } = await supabase
      .from("segments")
      .select("id, name, filter_rules");

    if (segErr) {
      throw new Error(`Failed to fetch segments: ${segErr.message}`);
    }

    if (!segments || segments.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, results: [] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Load all contacts (id, email, name, source, tags, stage, lead_score, created_at, updated_at)
    const { data: contacts, error: contactErr } = await supabase
      .from("contacts")
      .select("id, email, name, source, tags, stage, lead_score, created_at, updated_at");

    if (contactErr) {
      throw new Error(`Failed to fetch contacts: ${contactErr.message}`);
    }

    const allContacts = (contacts ?? []) as Contact[];

    // 3. Process each segment
    const results: SegmentResult[] = [];

    for (const segment of segments as Segment[]) {
      try {
        const result = await processSegment(supabase, segment, allContacts, now);
        results.push(result);
      } catch (err) {
        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          inserted: 0,
          deleted: 0,
          contactCount: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
