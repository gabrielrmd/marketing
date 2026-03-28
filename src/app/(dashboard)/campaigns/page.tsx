import Link from "next/link";
import { getCampaigns } from "@/lib/campaigns/actions";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/lib/campaigns/types";

export default async function CampaignsPage() {
  const result = await getCampaigns();
  const campaigns = (result.data as Campaign[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Campaigns
          </h1>
          <p className="text-muted-foreground">
            Plan, track, and analyze your marketing campaigns.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>Create Campaign</Button>
        </Link>
      </div>

      {/* Error state */}
      {result.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && !result.error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center gap-4">
          <div>
            <p className="font-[family-name:var(--font-oswald)] text-xl font-bold text-muted-foreground">
              No campaigns yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first campaign to get started.
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button>Create Campaign</Button>
          </Link>
        </div>
      )}

      {/* Campaign grid */}
      {campaigns.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
