"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { BudgetSummary } from "@/components/campaigns/budget-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCampaign,
  updateCampaign,
  getCampaignContent,
  getBudgetEntries,
  unlinkContent,
} from "@/lib/campaigns/actions";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, BudgetEntry } from "@/lib/campaigns/types";
import type { CampaignFormData } from "@/components/campaigns/campaign-form";

// ─── Types ─────────────────────────────────────────────────────────────────────

type LinkedItem = {
  id: string;
  content_item_id: string | null;
  sequence_id: string | null;
  content?: { title?: string } | null;
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [linkedContent, setLinkedContent] = useState<LinkedItem[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Load campaign ──
  useEffect(() => {
    getCampaign(id).then((result) => {
      setLoading(false);
      if (result.error || !result.data) {
        setNotFound(true);
        return;
      }
      setCampaign(result.data as Campaign);
    });
  }, [id]);

  // ── Load budget entries ──
  useEffect(() => {
    getBudgetEntries(id).then((result) => {
      setBudgetEntries((result.data as BudgetEntry[]) ?? []);
    });
  }, [id]);

  // ── Load linked content ──
  useEffect(() => {
    getCampaignContent(id).then((result) => {
      setLinkedContent((result.data as LinkedItem[]) ?? []);
    });
  }, [id]);

  function handleSave(data: CampaignFormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateCampaign(id, {
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
      } else {
        setSuccess(true);
        setCampaign(result.data as Campaign);
      }
    });
  }

  async function handleUnlinkContent(linkId: string) {
    startTransition(async () => {
      const result = await unlinkContent(linkId);
      if (!result.error) {
        setLinkedContent((prev) => prev.filter((l) => l.id !== linkId));
      }
    });
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button variant="outline" onClick={() => router.push("/campaigns")}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            {campaign.title}
          </h1>
          <p className="text-muted-foreground capitalize">
            {campaign.campaign_type.replace("_", " ")} · {campaign.status}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/campaigns")}>
          Back
        </Button>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Campaign saved successfully.
        </div>
      )}

      {/* Editable form */}
      <CampaignForm
        initialData={campaign}
        onSubmit={handleSave}
        isPending={isPending}
      />

      {/* Linked Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Linked Content
          </CardTitle>
          <Button size="sm" variant="outline" disabled>
            Link Content
          </Button>
        </CardHeader>
        <CardContent>
          {linkedContent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content linked to this campaign yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {linkedContent.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.content_item_id
                      ? `Content: ${item.content_item_id}`
                      : item.sequence_id
                      ? `Sequence: ${item.sequence_id}`
                      : "Unknown"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleUnlinkContent(item.id)}
                    disabled={isPending}
                  >
                    Unlink
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Budget
          </CardTitle>
          <Link href={`/campaigns/${id}/budget`}>
            <Button size="sm" variant="outline">View Full Budget</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <BudgetSummary entries={budgetEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
