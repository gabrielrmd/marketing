"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { KpiCard } from "@/components/campaigns/kpi-card";
import { ChannelPerformance } from "@/components/campaigns/channel-performance";
import { PillarPerformance } from "@/components/campaigns/pillar-performance";
import { FunnelHealthChart } from "@/components/campaigns/funnel-health-chart";
import { TimeInStage } from "@/components/campaigns/time-in-stage";
import { CohortChart } from "@/components/campaigns/cohort-chart";
import { AttributionTable } from "@/components/campaigns/attribution-table";
import { DateRangePicker } from "@/components/campaigns/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportGenerator } from "@/components/campaigns/report-generator";

// ─── Query data shapes (matching queries.ts outputs) ─────────────────────────

type EmailStats = {
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
};

type PerformanceData = {
  contentByPillar: Record<string, number>;
  emailStats: EmailStats;
  channelMetrics: Record<string, { impressions: number; clicks: number; conversions: number }>;
  websiteTraffic: number;
  totalSubmissions: number;
} | null;

type StageDistributionItem = { stage: string; count: number };
type DropOffRateItem = { from: string; to: string; dropOffPct: number };
type CohortRowRaw = { cohort: string; total: number; stages: Record<string, number> };

type FunnelData = {
  stageDistribution: StageDistributionItem[];
  timeInStage: Record<string, number>;
  dropOffRates: DropOffRateItem[];
  cohortData: CohortRowRaw[];
} | null;

type AttributionItem = {
  key: string;
  conversions: number;
  revenue: number;
  uniqueCustomers: number;
  cpa: number;
  ltv: number;
};

type AttributionData = {
  attributionBySource: AttributionItem[];
  attributionByCampaign: AttributionItem[];
  attributionByChannel: AttributionItem[];
  overallLTV: number;
  totalRevenue: number;
} | null;

// ─── Props ────────────────────────────────────────────────────────────────────

type AnalyticsClientProps = {
  initialRange: { from: string; to: string };
  performance: PerformanceData;
  funnel: FunnelData;
  attribution: AttributionData;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageDistToRecord(
  dist: StageDistributionItem[]
): Record<string, number> {
  const r: Record<string, number> = {};
  for (const d of dist) r[d.stage] = d.count;
  return r;
}

function dropOffRatesToRecord(
  rates: DropOffRateItem[]
): Record<string, number> {
  const r: Record<string, number> = {};
  for (const d of rates) r[`${d.from}→${d.to}`] = d.dropOffPct;
  return r;
}

function fmt$(n: number) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsClient({
  initialRange,
  performance,
  funnel,
  attribution,
}: AnalyticsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [range, setRange] = useState(initialRange);

  function handleRangeChange(next: { from: string; to: string }) {
    setRange(next);
    startTransition(() => {
      router.push(
        `/campaigns/analytics?from=${encodeURIComponent(next.from)}&to=${encodeURIComponent(next.to)}`
      );
    });
  }

  // ── Performance tab data ──────────────────────────────────────────────────
  const totalContentPublished = performance
    ? Object.values(performance.contentByPillar).reduce((a, b) => a + b, 0)
    : 0;
  const emailOpenRatePct = performance
    ? (performance.emailStats.openRate * 100).toFixed(1)
    : "0.0";

  // ── Attribution tab data ─────────────────────────────────────────────────
  const totalRevenue = attribution?.totalRevenue ?? 0;
  const overallLTV = attribution?.overallLTV ?? 0;
  const attributionRows = (attribution?.attributionBySource ?? []).map((a) => ({
    source: a.key,
    conversions: a.conversions,
    revenue: a.revenue,
    cpa: a.cpa,
    ltv: a.ltv,
  }));
  const avgCpa =
    attributionRows.length > 0
      ? attributionRows.reduce((s, r) => s + r.cpa, 0) / attributionRows.length
      : 0;
  const topChannelByRevenue = (attribution?.attributionByChannel ?? []).sort(
    (a, b) => b.revenue - a.revenue
  )[0]?.key ?? "—";

  // ── Funnel tab data ───────────────────────────────────────────────────────
  const stageDistRecord = funnel
    ? stageDistToRecord(funnel.stageDistribution)
    : {};
  const dropOffRecord = funnel
    ? dropOffRatesToRecord(funnel.dropOffRates)
    : {};
  const cohortRows = (funnel?.cohortData ?? []).map((r) => ({
    period: r.cohort,
    stages: r.stages,
    total: r.total,
  }));

  return (
    <div className={isPending ? "opacity-60 pointer-events-none transition-opacity" : ""}>
      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Health</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
        </TabsList>

        {/* ── Performance Tab ─────────────────────────────────────────────── */}
        <TabsContent value="performance">
          <div className="mt-4 space-y-6">
            {/* Date range */}
            <DateRangePicker
              from={range.from}
              to={range.to}
              onChange={handleRangeChange}
            />

            {/* KPI cards */}
            <div className="flex flex-wrap gap-4">
              <KpiCard
                label="Content Published"
                value={totalContentPublished}
                trendLabel="published items"
              />
              <KpiCard
                label="Email Open Rate"
                value={`${emailOpenRatePct}%`}
                trendLabel={`${performance?.emailStats.sent ?? 0} sent`}
              />
              <KpiCard
                label="Website Page Views"
                value={performance?.websiteTraffic ?? 0}
                trendLabel="page views"
              />
              <KpiCard
                label="Form Submissions"
                value={performance?.totalSubmissions ?? 0}
                trendLabel="total submissions"
              />
            </div>

            {/* Channel performance chart */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChannelPerformance
                  data={performance?.channelMetrics ?? {}}
                />
              </CardContent>
            </Card>

            {/* Pillar performance chart */}
            <Card>
              <CardHeader>
                <CardTitle>Content by Pillar</CardTitle>
              </CardHeader>
              <CardContent>
                <PillarPerformance
                  data={performance?.contentByPillar ?? {}}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Funnel Health Tab ────────────────────────────────────────────── */}
        <TabsContent value="funnel">
          <div className="mt-4 space-y-6">
            {/* Funnel health chart */}
            <Card>
              <CardHeader>
                <CardTitle>Funnel Stage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelHealthChart
                  stageDistribution={stageDistRecord}
                  dropOffRates={dropOffRecord}
                />
              </CardContent>
            </Card>

            {/* Time in stage */}
            <Card>
              <CardHeader>
                <CardTitle>Average Time per Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeInStage data={funnel?.timeInStage ?? {}} />
              </CardContent>
            </Card>

            {/* Cohort chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <CohortChart data={cohortRows} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Attribution Tab ──────────────────────────────────────────────── */}
        <TabsContent value="attribution">
          <div className="mt-4 space-y-6">
            {/* Date range */}
            <DateRangePicker
              from={range.from}
              to={range.to}
              onChange={handleRangeChange}
            />

            {/* KPI cards */}
            <div className="flex flex-wrap gap-4">
              <KpiCard
                label="Total Revenue"
                value={fmt$(totalRevenue)}
                trendLabel="in period"
              />
              <KpiCard
                label="Avg. CPA"
                value={fmt$(avgCpa)}
                trendLabel="cost per acquisition"
              />
              <KpiCard
                label="Overall LTV"
                value={fmt$(overallLTV)}
                trendLabel="lifetime value"
              />
              <KpiCard
                label="Top Channel"
                value={topChannelByRevenue}
                trendLabel="by revenue"
              />
            </div>

            {/* Attribution table */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Attribution by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <AttributionTable data={attributionRows} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Report Generation ─────────────────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Reports</h2>
        <ReportGenerator />
      </div>
    </div>
  );
}
