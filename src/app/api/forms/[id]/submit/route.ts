import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateFormSubmission } from "@/lib/funnel/validation";

// ─── In-memory rate limiter: 10 submissions per IP per hour ──────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }

  if (entry.count >= 10) return true;

  entry.count += 1;
  return false;
}

// ─── Turnstile verification ───────────────────────────────────────────────────
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Dev mode: skip verification
    console.warn("[forms/submit] TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification");
    return true;
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });

  const data = await res.json() as { success: boolean };
  return data.success === true;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: formId } = await params;

  // 1. Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    email,
    name,
    turnstile_token,
    landing_page_id,
    variant,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    ...extra
  } = body as {
    email: string;
    name?: string;
    turnstile_token?: string;
    landing_page_id?: string;
    variant?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    [key: string]: unknown;
  };

  // 3. Turnstile verification
  if (turnstile_token) {
    const valid = await verifyTurnstile(turnstile_token, ip);
    if (!valid) {
      return Response.json({ error: "CAPTCHA verification failed" }, { status: 403 });
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    return Response.json({ error: "CAPTCHA token required" }, { status: 400 });
  }

  // 4. Validate email
  const validationErrors = validateFormSubmission({ email });
  if (validationErrors.length > 0) {
    return Response.json({ error: validationErrors.join(", ") }, { status: 400 });
  }

  const supabase = await createClient();

  // 5. Insert form submission (DB trigger auto-creates/links contact)
  const { data: submission, error: submissionError } = await supabase
    .from("form_submissions")
    .insert({
      form_id: formId,
      email,
      name: name ?? null,
      data: extra,
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      utm_content: utm_content ?? null,
      utm_term: utm_term ?? null,
      ip_address: ip,
    })
    .select()
    .single();

  if (submissionError) {
    return Response.json({ error: submissionError.message }, { status: 500 });
  }

  const contactId = submission.contact_id;

  // 6. Log funnel event
  await supabase.from("funnel_events").insert({
    contact_id: contactId ?? null,
    event_type: "form_submission",
    event_data: { form_id: formId, landing_page_id: landing_page_id ?? null },
    source: utm_source ?? null,
  });

  // 7. Increment landing page conversion counter
  if (landing_page_id) {
    const conversionField = variant === "b" ? "conversions_b" : "conversions_a";
    await supabase.rpc("increment_field", {
      p_table: "landing_pages",
      p_id: landing_page_id,
      p_field: conversionField,
    });

    // Auto-enroll contact in triggered sequences
    if (contactId) {
      const { data: sequences } = await supabase
        .from("email_sequences")
        .select("id")
        .eq("trigger_type", "form_submission")
        .eq("trigger_value", formId)
        .eq("status", "active");

      if (sequences && sequences.length > 0) {
        for (const seq of sequences) {
          // Upsert enrollment (ignore if already enrolled)
          await supabase
            .from("sequence_enrollments")
            .upsert(
              {
                contact_id: contactId,
                sequence_id: seq.id,
                current_step_index: 0,
                next_send_at: new Date().toISOString(),
                status: "active",
              },
              { onConflict: "contact_id,sequence_id", ignoreDuplicates: true }
            );
        }
      }

      // 8. Auto-deliver lead magnet
      const { data: page } = await supabase
        .from("landing_pages")
        .select("lead_magnet_id")
        .eq("id", landing_page_id)
        .single();

      if (page?.lead_magnet_id) {
        const { data: magnet } = await supabase
          .from("lead_magnets")
          .select("*")
          .eq("id", page.lead_magnet_id)
          .single();

        if (magnet) {
          // Deliver via Resend if API key is configured
          const resendApiKey = process.env.RESEND_API_KEY;
          if (resendApiKey && magnet.delivery_email_subject && magnet.delivery_email_body) {
            try {
              const emailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "noreply@resend.dev",
                  to: email,
                  subject: magnet.delivery_email_subject,
                  html: magnet.delivery_email_body,
                }),
              });

              if (emailRes.ok) {
                const emailData = await emailRes.json() as { id?: string };

                // Track email send
                await supabase.from("email_sends").insert({
                  contact_id: contactId,
                  subject: magnet.delivery_email_subject,
                  resend_id: emailData.id ?? null,
                  status: "sent",
                });
              }
            } catch (err) {
              console.error("[forms/submit] Failed to send lead magnet email:", err);
            }
          }

          // Increment download count atomically
          await supabase.rpc("increment_field", {
            p_table: "lead_magnets",
            p_id: magnet.id,
            p_field: "download_count",
          });
        }
      }
    }
  }

  return Response.json({ success: true, submission_id: submission.id }, { status: 200 });
}
