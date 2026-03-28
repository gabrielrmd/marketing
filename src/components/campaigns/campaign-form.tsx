"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign, CampaignType } from "@/lib/campaigns/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CampaignFormData = {
  title: string;
  description: string;
  campaign_type: CampaignType;
  objective: string;
  audience_segment: string;
  start_date: string;
  end_date: string;
  total_budget: string;
};

type Props = {
  initialData?: Partial<Campaign>;
  onSubmit: (data: CampaignFormData) => void;
  isPending: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES: { value: CampaignType; label: string; color: string }[] = [
  { value: "product_launch", label: "Product Launch", color: "#2AB9B0" },
  { value: "seasonal", label: "Seasonal", color: "#F28C28" },
  { value: "evergreen", label: "Evergreen", color: "#8ED16A" },
  { value: "event", label: "Event", color: "#F8CE30" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function CampaignForm({ initialData, onSubmit, isPending }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [campaignType, setCampaignType] = useState<CampaignType>(
    initialData?.campaign_type ?? "evergreen"
  );
  const [objective, setObjective] = useState(initialData?.objective ?? "");
  const [audienceSegment, setAudienceSegment] = useState(initialData?.audience_segment ?? "");
  const [startDate, setStartDate] = useState(
    initialData?.start_date ? initialData.start_date.slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    initialData?.end_date ? initialData.end_date.slice(0, 10) : ""
  );
  const [totalBudget, setTotalBudget] = useState(
    initialData?.total_budget != null ? String(initialData.total_budget) : ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      description,
      campaign_type: campaignType,
      objective,
      audience_segment: audienceSegment,
      start_date: startDate,
      end_date: endDate,
      total_budget: totalBudget,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Campaign Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="campaign-title">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="campaign-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Campaign title..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="campaign-description">
              Description
            </label>
            <textarea
              id="campaign-description"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this campaign..."
            />
          </div>

          {/* Campaign Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Campaign Type <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setCampaignType(type.value)}
                  className="rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={
                    campaignType === type.value
                      ? {
                          borderColor: type.color,
                          backgroundColor: `${type.color}18`,
                          color: type.color,
                        }
                      : {}
                  }
                  data-selected={campaignType === type.value}
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="campaign-objective">
              Objective
            </label>
            <textarea
              id="campaign-objective"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What does this campaign aim to achieve?"
            />
          </div>

          {/* Audience Segment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="campaign-audience">
              Audience Segment
            </label>
            <Input
              id="campaign-audience"
              value={audienceSegment}
              onChange={(e) => setAudienceSegment(e.target.value)}
              placeholder="e.g. SMB owners, marketing managers 25-45..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Schedule &amp; Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="campaign-start">
                Start Date
              </label>
              <Input
                id="campaign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="campaign-end">
                End Date
              </label>
              <Input
                id="campaign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Total Budget */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="campaign-budget">
              Total Budget ($)
            </label>
            <Input
              id="campaign-budget"
              type="number"
              min="0"
              step="0.01"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions slot */}
      <div className="flex items-center gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Campaign"}
        </Button>
      </div>
    </form>
  );
}
