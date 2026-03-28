"use server";

import { createClient } from "@/lib/supabase/server";

type LinkedInResult = { success: boolean; external_id?: string; error?: string };

export async function publishToLinkedIn(contentItemId: string): Promise<LinkedInResult> {
  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("content_items").select("*").eq("id", contentItemId).single();

  if (fetchError || !item) return { success: false, error: "Content item not found" };

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  if (!accessToken || !personId) {
    await supabase.from("publishing_logs").insert({
      content_item_id: contentItemId, channel: "linkedin", status: "failed",
      error_message: "LinkedIn credentials not configured. Use prep & export.",
    });
    return { success: false, error: "LinkedIn not configured. Use prep & export." };
  }

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${personId}`,
          commentary: item.body_text,
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
        }),
      });

      if (response.ok) {
        const headerUrn = response.headers.get("x-restli-id");
        await supabase.from("publishing_logs").insert({
          content_item_id: contentItemId, channel: "linkedin", status: "success",
          external_id: headerUrn ?? undefined, response: {},
        });
        await supabase.from("content_items")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", contentItemId);
        return { success: true, external_id: headerUrn ?? undefined };
      }

      lastError = `LinkedIn API returned ${response.status}: ${await response.text()}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }

  await supabase.from("publishing_logs").insert({
    content_item_id: contentItemId, channel: "linkedin", status: "failed", error_message: lastError,
  });
  await supabase.from("content_items").update({ status: "failed" }).eq("id", contentItemId);
  return { success: false, error: lastError };
}
