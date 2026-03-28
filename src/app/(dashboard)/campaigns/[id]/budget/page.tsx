"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BudgetTable } from "@/components/campaigns/budget-table";
import { BudgetSummary } from "@/components/campaigns/budget-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBudgetEntries,
  addBudgetEntry,
  updateBudgetEntry,
  deleteBudgetEntry,
  getCampaign,
} from "@/lib/campaigns/actions";
import type { BudgetEntry, BudgetEntryType, Campaign } from "@/lib/campaigns/types";

export default function CampaignBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load data ──
  useEffect(() => {
    Promise.all([getCampaign(id), getBudgetEntries(id)]).then(
      ([campaignResult, entriesResult]) => {
        setLoading(false);
        if (campaignResult.data) {
          setCampaign(campaignResult.data as Campaign);
        }
        setEntries((entriesResult.data as BudgetEntry[]) ?? []);
      }
    );
  }, [id]);

  // ── Add entry ──
  function handleAdd(data: {
    description: string;
    channel: string;
    entry_type: BudgetEntryType;
    amount: number;
    date: string;
  }) {
    setError(null);
    startTransition(async () => {
      const result = await addBudgetEntry({
        campaign_id: id,
        description: data.description,
        amount: data.amount,
        entry_type: data.entry_type,
        channel: data.channel || null,
        date: data.date || null,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEntries((prev) => [result.data as BudgetEntry, ...prev]);
      }
    });
  }

  // ── Update entry ──
  function handleUpdate(
    entryId: string,
    data: Partial<{
      description: string;
      channel: string | null;
      entry_type: BudgetEntryType;
      amount: number;
      date: string | null;
    }>
  ) {
    setError(null);
    startTransition(async () => {
      const result = await updateBudgetEntry(entryId, data);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? (result.data as BudgetEntry) : e))
        );
      }
    });
  }

  // ── Delete entry ──
  function handleDelete(entryId: string) {
    if (!confirm("Delete this budget entry?")) return;
    startTransition(async () => {
      const result = await deleteBudgetEntry(entryId);
      if (result.error) {
        setError(result.error);
      } else {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Budget
          </h1>
          {campaign && (
            <p className="text-muted-foreground">
              {campaign.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/campaigns/${id}`}>
            <Button variant="outline">Back to Campaign</Button>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetSummary entries={entries} />
        </CardContent>
      </Card>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Budget Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetTable
            entries={entries}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
