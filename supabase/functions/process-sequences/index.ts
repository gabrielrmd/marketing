// supabase/functions/process-sequences/index.ts
//
// Deno Edge Function — processes active sequence enrollments.
// Invoked by pg_cron every 5 minutes via:
//
// -- Run in Supabase Dashboard > SQL Editor to schedule:
// -- select cron.schedule('process-sequences', '*/5 * * * *', $$
// --   select net.http_post(
// --     url := '<YOUR_SUPABASE_URL>/functions/v1/process-sequences',
// --     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
// --   );
// -- $$);

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// ──────────────────────────────────────────────────────────
// Types (mirrored from src/lib/funnel/types.ts — Deno can't
// import from the Next.js source tree at runtime)
// ──────────────────────────────────────────────────────────

type SequenceStepType = "email" | "delay" | "condition";
type ConditionType =
  | "tag_exists"
  | "email_opened"
  | "email_clicked"
  | "score_above";

interface EmailSequenceStep {
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
}

interface SequenceEnrollment {
  id: string;
  contact_id: string;
  sequence_id: string;
  current_step_index: number;
  next_send_at: string | null;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
}

interface Contact {
  id: string;
  email: string;
  name: string | null;
  tags: string[];
  lead_score: number;
}

interface SequenceContext {
  tags: string[];
  lead_score: number;
  email_opened: boolean;
  email_clicked: boolean;
}

// ──────────────────────────────────────────────────────────
// Inline condition evaluator
// (copied from src/lib/funnel/sequence-engine.ts so this
//  Deno file has no build-time dependency on the Next.js tree)
// ──────────────────────────────────────────────────────────

function evaluateCondition(
  conditionType: ConditionType,
  conditionValue: string,
  context: SequenceContext,
): boolean {
  switch (conditionType) {
    case "tag_exists":
      return context.tags.includes(conditionValue);
    case "score_above":
      return context.lead_score > Number(conditionValue);
    case "email_opened":
      return context.email_opened;
    case "email_clicked":
      return context.email_clicked;
    default:
      return false;
  }
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

/** Send a single email via the Resend REST API (no SDK — Deno-safe). */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<string> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "noreply@yourdomain.com",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Calculate when the next step should fire. */
function calculateNextSendAt(step: EmailSequenceStep, now: Date): Date {
  if (
    step.step_type === "delay" &&
    step.delay_minutes != null &&
    step.delay_minutes > 0
  ) {
    return new Date(now.getTime() + step.delay_minutes * 60 * 1000);
  }
  return now;
}

// ──────────────────────────────────────────────────────────
// Core processor
// ──────────────────────────────────────────────────────────

type ProcessResult = {
  enrollmentId: string;
  action: string;
  error?: string;
};

async function processEnrollment(
  supabase: SupabaseClient,
  enrollment: SequenceEnrollment,
  steps: EmailSequenceStep[],
  contact: Contact,
): Promise<ProcessResult> {
  const now = new Date();
  let currentIndex = enrollment.current_step_index;

  // Safety: guard against infinite loops on condition chains
  const MAX_HOPS = steps.length + 1;
  let hops = 0;

  while (hops < MAX_HOPS) {
    hops++;

    const step = steps.find((s) => s.step_index === currentIndex);
    if (!step) {
      // No step at this index — sequence is complete
      await supabase
        .from("sequence_enrollments")
        .update({ status: "completed", completed_at: now.toISOString() })
        .eq("id", enrollment.id);
      return { enrollmentId: enrollment.id, action: "completed" };
    }

    // ── EMAIL step ───────────────────────────────────────
    if (step.step_type === "email") {
      const subject = step.subject ?? "(no subject)";
      const html = step.body_html ?? "";

      // Send via Resend
      const resendId = await sendEmail(contact.email, subject, html);

      // Record in email_sends
      await supabase.from("email_sends").insert({
        sequence_enrollment_id: enrollment.id,
        contact_id: contact.id,
        subject,
        resend_id: resendId,
        status: "sent",
        sent_at: now.toISOString(),
      });

      // Advance to next step
      const nextIndex = currentIndex + 1;
      const nextStep = steps.find((s) => s.step_index === nextIndex);

      if (!nextStep) {
        // Last step — mark complete
        await supabase
          .from("sequence_enrollments")
          .update({ status: "completed", completed_at: now.toISOString() })
          .eq("id", enrollment.id);
        return { enrollmentId: enrollment.id, action: "email_sent+completed" };
      }

      // Schedule the next step
      const nextSendAt = calculateNextSendAt(nextStep, now);
      await supabase
        .from("sequence_enrollments")
        .update({
          current_step_index: nextIndex,
          next_send_at: nextSendAt.toISOString(),
        })
        .eq("id", enrollment.id);

      return { enrollmentId: enrollment.id, action: `email_sent->step_${nextIndex}` };
    }

    // ── DELAY step ───────────────────────────────────────
    if (step.step_type === "delay") {
      const nextIndex = currentIndex + 1;
      const nextStep = steps.find((s) => s.step_index === nextIndex);

      if (!nextStep) {
        await supabase
          .from("sequence_enrollments")
          .update({ status: "completed", completed_at: now.toISOString() })
          .eq("id", enrollment.id);
        return { enrollmentId: enrollment.id, action: "delay+completed" };
      }

      const nextSendAt = calculateNextSendAt(step, now);
      await supabase
        .from("sequence_enrollments")
        .update({
          current_step_index: nextIndex,
          next_send_at: nextSendAt.toISOString(),
        })
        .eq("id", enrollment.id);

      return { enrollmentId: enrollment.id, action: `delay->step_${nextIndex}` };
    }

    // ── CONDITION step ───────────────────────────────────
    if (step.step_type === "condition") {
      const context: SequenceContext = {
        tags: contact.tags,
        lead_score: contact.lead_score,
        // email_opened / email_clicked would require a lookup;
        // default to false unless a dedicated query is added
        email_opened: false,
        email_clicked: false,
      };

      const conditionMet =
        step.condition_type != null
          ? evaluateCondition(
              step.condition_type,
              step.condition_value ?? "",
              context,
            )
          : false;

      const resolvedIndex = conditionMet
        ? step.true_next_index
        : step.false_next_index;

      if (resolvedIndex == null) {
        // Dead-end branch — complete the enrollment
        await supabase
          .from("sequence_enrollments")
          .update({ status: "completed", completed_at: now.toISOString() })
          .eq("id", enrollment.id);
        return { enrollmentId: enrollment.id, action: "condition_deadend+completed" };
      }

      // Jump to resolved index and process immediately (loop)
      currentIndex = resolvedIndex;
      continue;
    }

    // Unknown step type — bail
    return {
      enrollmentId: enrollment.id,
      action: "skipped",
      error: `Unknown step_type at index ${currentIndex}`,
    };
  }

  return {
    enrollmentId: enrollment.id,
    action: "error",
    error: "Max condition hops exceeded",
  };
}

// ──────────────────────────────────────────────────────────
// Edge Function handler
// ──────────────────────────────────────────────────────────

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch active enrollments whose next_send_at is due
    const { data: enrollments, error: enrollErr } = await supabase
      .from("sequence_enrollments")
      .select("*")
      .eq("status", "active")
      .lte("next_send_at", new Date().toISOString());

    if (enrollErr) {
      throw new Error(`Failed to fetch enrollments: ${enrollErr.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, results: [] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const results: ProcessResult[] = [];

    for (const enrollment of enrollments as SequenceEnrollment[]) {
      try {
        // 2. Load sequence steps
        const { data: steps, error: stepsErr } = await supabase
          .from("email_sequence_steps")
          .select("*")
          .eq("sequence_id", enrollment.sequence_id)
          .order("step_index", { ascending: true });

        if (stepsErr || !steps) {
          results.push({
            enrollmentId: enrollment.id,
            action: "error",
            error: stepsErr?.message ?? "No steps found",
          });
          continue;
        }

        // 3. Load contact
        const { data: contact, error: contactErr } = await supabase
          .from("contacts")
          .select("id, email, name, tags, lead_score")
          .eq("id", enrollment.contact_id)
          .single();

        if (contactErr || !contact) {
          results.push({
            enrollmentId: enrollment.id,
            action: "error",
            error: contactErr?.message ?? "Contact not found",
          });
          continue;
        }

        // 4. Process the enrollment
        const result = await processEnrollment(
          supabase,
          enrollment,
          steps as EmailSequenceStep[],
          contact as Contact,
        );
        results.push(result);
      } catch (err) {
        results.push({
          enrollmentId: enrollment.id,
          action: "error",
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
