"use server";

import { createClient } from "@/lib/supabase/server";

// ─── sendReportEmail ──────────────────────────────────────────────────────────
// Sends a report notification email via Resend.
// For reports that have a pdf_path, we include a link to the public PDF URL.
// For reports without a PDF, we send a plain metrics summary.

export async function sendReportEmail(params: {
  reportId: string;
  reportTitle: string;
  pdfPath: string | null;
  recipients: string[];
}): Promise<{ success?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "RESEND_API_KEY is not configured" };

  if (!params.recipients.length) {
    return { error: "No recipients provided" };
  }

  // Build a public URL for the PDF if one exists
  const supabase = await createClient();
  let pdfUrl: string | null = null;
  if (params.pdfPath) {
    const { data } = supabase.storage.from("reports").getPublicUrl(params.pdfPath);
    pdfUrl = data.publicUrl;
  }

  const dashboardUrl =
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/campaigns/analytics`
      : "/campaigns/analytics";

  const subject = `Report Ready: ${params.reportTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #333; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #2AB9B0; font-size: 22px; margin: 0;">AU Marketing Report</h1>
        <p style="color: #ccc; font-size: 13px; margin: 4px 0 0;">Advertising Unplugged — Clarity Over Noise</p>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin: 0 0 16px;">Your report is ready:</p>
        <h2 style="font-size: 18px; color: #333; margin: 0 0 24px;">${params.reportTitle}</h2>

        ${
          pdfUrl
            ? `<a href="${pdfUrl}" style="display: inline-block; background: #2AB9B0; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
                Download PDF Report
              </a>`
            : ""
        }

        <p style="margin: 24px 0 8px;">
          <a href="${dashboardUrl}" style="color: #2AB9B0;">View live analytics dashboard →</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin: 0;">
          Sent by Advertising Unplugged Marketing Platform. To unsubscribe from scheduled reports,
          visit your dashboard settings.
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "reports@advertisingunplugged.com.au",
        to: params.recipients,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Resend error ${res.status}: ${text}` };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
