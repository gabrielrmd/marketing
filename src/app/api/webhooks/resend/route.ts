import { type NextRequest } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@/lib/supabase/server";

// ─── Resend webhook event types ───────────────────────────────────────────────
type ResendWebhookEvent = {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    created_at?: string;
    [key: string]: unknown;
  };
};

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify signature via svix if secret is configured
  if (secret) {
    const svixId = request.headers.get("svix-id") ?? "";
    const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
    const svixSignature = request.headers.get("svix-signature") ?? "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    try {
      const wh = new Webhook(secret);
      wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("[webhooks/resend] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 401 });
    }
  } else {
    console.warn("[webhooks/resend] RESEND_WEBHOOK_SECRET not set — skipping signature verification");
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const supabase = await createClient();
  const resendId = event.data?.email_id;

  if (!resendId) {
    // No email_id to correlate — acknowledge and skip
    return new Response("OK", { status: 200 });
  }

  switch (event.type) {
    case "email.delivered": {
      await supabase
        .from("email_sends")
        .update({ status: "delivered" })
        .eq("resend_id", resendId)
        .eq("status", "sent"); // Only update if still in 'sent' state
      break;
    }

    case "email.opened": {
      await supabase
        .from("email_sends")
        .update({ status: "opened", opened_at: new Date().toISOString() })
        .eq("resend_id", resendId)
        .in("status", ["sent", "delivered"]); // Advance status
      break;
    }

    case "email.clicked": {
      await supabase
        .from("email_sends")
        .update({ status: "clicked", clicked_at: new Date().toISOString() })
        .eq("resend_id", resendId);
      break;
    }

    case "email.bounced": {
      await supabase
        .from("email_sends")
        .update({ status: "bounced" })
        .eq("resend_id", resendId);
      break;
    }

    case "email.complained": {
      // Mark as unsubscribed on complaint
      await supabase
        .from("email_sends")
        .update({ status: "unsubscribed" })
        .eq("resend_id", resendId);
      break;
    }

    default:
      // Unknown event type — acknowledge and ignore
      break;
  }

  return new Response("OK", { status: 200 });
}
