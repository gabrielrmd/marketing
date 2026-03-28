"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Campaign, CampaignType, CampaignStatus } from "@/lib/campaigns/types";

// ─── Color Maps ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<CampaignType, { bg: string; text: string; border: string }> = {
  product_launch: {
    bg: "bg-[#2AB9B0]/10",
    text: "text-[#2AB9B0]",
    border: "border-[#2AB9B0]/30",
  },
  seasonal: {
    bg: "bg-[#F28C28]/10",
    text: "text-[#F28C28]",
    border: "border-[#F28C28]/30",
  },
  evergreen: {
    bg: "bg-[#8ED16A]/10",
    text: "text-[#8ED16A]",
    border: "border-[#8ED16A]/30",
  },
  event: {
    bg: "bg-[#F8CE30]/10",
    text: "text-[#F8CE30]",
    border: "border-[#F8CE30]/30",
  },
};

const STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; border: string }> = {
  draft: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted-foreground/20",
  },
  active: {
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-500/30",
  },
  completed: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  archived: {
    bg: "bg-muted/50",
    text: "text-muted-foreground/60",
    border: "border-muted-foreground/10",
  },
};

const TYPE_LABELS: Record<CampaignType, string> = {
  product_launch: "Product Launch",
  seasonal: "Seasonal",
  evergreen: "Evergreen",
  event: "Event",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const typeStyle = TYPE_COLORS[campaign.campaign_type];
  const statusStyle = STATUS_COLORS[campaign.status];

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block group">
      <Card className="h-full transition-shadow group-hover:shadow-md group-hover:border-[#2AB9B0]/40">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-[family-name:var(--font-oswald)] text-lg font-bold leading-tight group-hover:text-[#2AB9B0] transition-colors line-clamp-2">
              {campaign.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {/* Type badge */}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
            >
              {TYPE_LABELS[campaign.campaign_type]}
            </span>
            {/* Status badge */}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {campaign.status}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Description */}
          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
          )}

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Dates:</span>
            <span>
              {formatDate(campaign.start_date)}
              {" — "}
              {formatDate(campaign.end_date)}
            </span>
          </div>

          {/* Budget */}
          <div className="flex items-center justify-between pt-1 border-t">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Budget</span>
            </div>
            <div className="text-sm font-semibold text-[#2AB9B0]">
              {formatCurrency(campaign.total_budget)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
