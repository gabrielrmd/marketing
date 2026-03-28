"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { tiptapToHtml } from "./tiptap-html";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailResult = { success: boolean; external_id?: string; error?: string };

export async function publishAsEmail(
  contentItemId: string,
  options: { to: string[]; subject?: string; from?: string }
): Promise<EmailResult> {
  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("content_items").select("*").eq("id", contentItemId).single();

  if (fetchError || !item) return { success: false, error: "Content item not found" };

  const htmlBody = tiptapToHtml(item.body as Record<string, unknown>);

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: options.from ?? "AU <hello@advertisingunplugged.com>",
        to: options.to,
        subject: options.subject ?? item.title,
        html: `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="font-family: Oswald, sans-serif;">${item.title}</h1>
          ${htmlBody}
        </div>`,
      });

      if (data?.id) {
        await supabase.from("publishing_logs").insert({
          content_item_id: contentItemId, channel: "email", status: "success", external_id: data.id,
        });
        await supabase.from("content_items")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", contentItemId);
        return { success: true, external_id: data.id };
      }
      lastError = error?.message ?? "Unknown Resend error";
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }

  await supabase.from("publishing_logs").insert({
    content_item_id: contentItemId, channel: "email", status: "failed", error_message: lastError,
  });
  await supabase.from("content_items").update({ status: "failed" }).eq("id", contentItemId);
  return { success: false, error: lastError };
}
