"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { createCampaign } from "@/lib/campaigns/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { CampaignFormData } from "@/components/campaigns/campaign-form";

export default function NewCampaignPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(data: CampaignFormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCampaign({
        title: data.title,
        campaign_type: data.campaign_type,
        description: data.description || null,
        objective: data.objective || null,
        audience_segment: data.audience_segment || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        total_budget: data.total_budget ? parseFloat(data.total_budget) : null,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        router.push(`/campaigns/${result.data.id}`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            New Campaign
          </h1>
          <p className="text-muted-foreground">Create a new marketing campaign.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <CampaignForm onSubmit={handleSubmit} isPending={isPending} />
    </div>
  );
}
