import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard-home";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: recentContent } = await supabase
    .from("content_items")
    .select("id, title, channel, status, created_at, scheduled_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const { count: templateCount } = await supabase
    .from("content_templates")
    .select("id", { count: "exact", head: true });

  const { count: assetCount } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true });

  const { count: leadMagnetCount } = await supabase
    .from("lead_magnets")
    .select("id", { count: "exact", head: true });

  return (
    <DashboardHome
      recentContent={recentContent ?? []}
      hasTemplates={(templateCount ?? 0) > 0}
      hasAssets={(assetCount ?? 0) > 0}
      hasLeadMagnets={(leadMagnetCount ?? 0) > 0}
    />
  );
}
