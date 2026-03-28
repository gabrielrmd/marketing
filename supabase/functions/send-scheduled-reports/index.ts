// supabase/functions/send-scheduled-reports/index.ts
//
// Deno Edge Function — processes enabled report schedules whose next_run_at
// has passed, sends a metrics summary email via Resend, then advances next_run_at.
//
// Invoked by pg_cron (run once in Supabase Dashboard > SQL Editor to schedule):
//
// -- Weekly check — runs every hour; the function itself decides what to send.
// -- select cron.schedule('send-scheduled-reports', '0 * * * *', $$
// --   select net.http_post(
// --     url := '<YOUR_SUPABASE_URL>/functions/v1/send-scheduled-reports',
// --     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
// --   );
// -- $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "reports@advertisingunplugged.com.au";
const dashboardUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL")
  ? `${Deno.env.get("NEXT_PUBLIC_SITE_URL")}/campaigns/analytics`
  : "https://yourdomain.com/campaigns/analytics";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

type ReportType = "weekly" | "monthly" | "campaign" | "custom";
type ReportFrequency = "weekly" | "monthly";

interface ReportSchedule {
  id: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  recipients: string[];
  next_run_at: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
  created_by: string;
}

interface MetricsSummary {
  contentPublished: number;
  emailsSent: number;
  emailOpenRate: number;
  totalSubmissions: number;
  totalRevenue: number;
}

// ──────────────────────────────────────────────────────────
// Analytics queries
// ──────────────────────────────────────────────────────────

async function fetchMetricsSummary(
  supabase: ReturnType<typeof createClient>,
  dateFrom: string,
  dateTo: string,
): Promise<MetricsSummary> {
  const [contentRes, emailRes, submissionsRes, revenueRes] = await Promise.all([
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    supabase
      .from("email_sends")
      .select("status")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),

    supabase
      .from("analytics_events")
      .select("revenue")
      .not("revenue", "is", null)
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),
  ]);

  const emails = emailRes.data ?? [];
  const emailTotal = emails.length;
  const emailOpened = emails.filter(
    (e: { status: string }) => e.status === "opened" || e.status === "clicked",
  ).length;
  const emailOpenRate = emailTotal > 0 ? (emailOpened / emailTotal) * 100 : 0;

  const revenueEvents = revenueRes.data ?? [];
  const totalRevenue = revenueEvents.reduce(
    (sum: number, e: { revenue: number | null }) => sum + (e.revenue ?? 0),
    0,
  );

  return {
    contentPublished: contentRes.count ?? 0,
    emailsSent: emailTotal,
    emailOpenRate,
    totalSubmissions: submissionsRes.count ?? 0,
    totalRevenue,
  };
}

// ──────────────────────────────────────────────────────────
// Email helpers
// ──────────────────────────────────────────────────────────

function buildEmailHtml(
  schedule: ReportSchedule,
  metrics: MetricsSummary,
  dateFrom: string,
  dateTo: string,
): string {
  const fmt = (n: number) => n.toLocaleString("en-AU");
  const fmtCurrency = (n: number) =>
    n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #333; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #2AB9B0; font-size: 22px; margin: 0;">AU Marketing Report</h1>
        <p style="color: #ccc; font-size: 13px; margin: 4px 0 0;">Advertising Unplugged — Clarity Over Noise</p>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="font-size: 18px; color: #333; margin: 0 0 8px; text-transform: capitalize;">
          ${schedule.frequency} ${schedule.report_type} Report
        </h2>
        <p style="color: #666; margin: 0 0 24px;">Period: ${dateFrom} to ${dateTo}</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center; width: 25%;">
              <div style="font-size: 24px; font-weight: bold; color: #2AB9B0;">${fmt(metrics.contentPublished)}</div>
              <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px;">Content Published</div>
            </td>
            <td style="width: 8px;"></td>
            <td style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center; width: 25%;">
              <div style="font-size: 24px; font-weight: bold; color: #8ED16A;">${metrics.emailOpenRate.toFixed(1)}%</div>
              <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px;">Email Open Rate</div>
            </td>
            <td style="width: 8px;"></td>
            <td style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center; width: 25%;">
              <div style="font-size: 24px; font-weight: bold; color: #F28C28;">${fmt(metrics.totalSubmissions)}</div>
              <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px;">Submissions</div>
            </td>
            <td style="width: 8px;"></td>
            <td style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center; width: 25%;">
              <div style="font-size: 24px; font-weight: bold; color: #F8CE30;">${fmtCurrency(metrics.totalRevenue)}</div>
              <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px;">Revenue</div>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 8px;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #2AB9B0; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Full Analytics Dashboard →
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin: 0;">
          This is an automated report from Advertising Unplugged Marketing Platform.
          Emails sent this period: ${fmt(metrics.emailsSent)}.
        </p>
      </div>
    </div>
  `;
}

async function sendEmail(
  to: string[],
  subject: string,
  html: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

// ──────────────────────────────────────────────────────────
// next_run_at calculator
// ──────────────────────────────────────────────────────────

function advanceNextRunAt(frequency: ReportFrequency, from: Date): Date {
  const next = new Date(from);
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + 30);
  }
  return next;
}

function dateRangeForFrequency(
  frequency: ReportFrequency,
  now: Date,
): { dateFrom: string; dateTo: string } {
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  if (frequency === "weekly") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(from.getDate() - 30);
  }
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
}

// ──────────────────────────────────────────────────────────
// Process one schedule
// ──────────────────────────────────────────────────────────

type ProcessResult = {
  scheduleId: string;
  action: string;
  error?: string;
};

async function processSchedule(
  supabase: ReturnType<typeof createClient>,
  schedule: ReportSchedule,
  now: Date,
): Promise<ProcessResult> {
  try {
    const { dateFrom, dateTo } = dateRangeForFrequency(schedule.frequency, now);

    // 1. Gather metrics
    const metrics = await fetchMetricsSummary(supabase, dateFrom, dateTo);

    // 2. Create a report record
    const { data: reportData, error: reportErr } = await supabase
      .from("reports")
      .insert({
        title: `${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} ${schedule.report_type} Report — ${dateFrom} to ${dateTo}`,
        report_type: schedule.report_type,
        date_from: dateFrom,
        date_to: dateTo,
        status: "ready",
        data: metrics,
        created_by: schedule.created_by,
      })
      .select("id")
      .single();

    if (reportErr) {
      throw new Error(`Failed to create report record: ${reportErr.message}`);
    }

    // 3. Send email with metrics summary
    const subject = `${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} Marketing Report — ${dateFrom} to ${dateTo}`;
    const html = buildEmailHtml(schedule, metrics, dateFrom, dateTo);
    await sendEmail(schedule.recipients, subject, html);

    // 4. Advance next_run_at
    const nextRunAt = advanceNextRunAt(schedule.frequency, now);
    await supabase
      .from("report_schedules")
      .update({ next_run_at: nextRunAt.toISOString() })
      .eq("id", schedule.id);

    return {
      scheduleId: schedule.id,
      action: `sent_email+report_created(${reportData?.id ?? "?"})`,
    };
  } catch (err) {
    return {
      scheduleId: schedule.id,
      action: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ──────────────────────────────────────────────────────────
// Edge Function handler
// ──────────────────────────────────────────────────────────

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();

    // 1. Fetch due enabled schedules
    const { data: schedules, error: fetchErr } = await supabase
      .from("report_schedules")
      .select("*")
      .eq("enabled", true)
      .lte("next_run_at", now.toISOString());

    if (fetchErr) {
      throw new Error(`Failed to fetch schedules: ${fetchErr.message}`);
    }

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, results: [] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Process each schedule sequentially to avoid hammering the API
    const results: ProcessResult[] = [];
    for (const schedule of schedules as ReportSchedule[]) {
      const result = await processSchedule(supabase, schedule, now);
      results.push(result);
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
