import {
  getMarketingPerformance,
  getFunnelHealth,
  getRevenueAttribution,
} from "@/lib/campaigns/queries";
import { AnalyticsClient } from "./analytics-client";

// Default date range: last 30 days
function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  return {
    from: to.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

// Make sure "from" is always the earlier date for the default range
function buildRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const resolved = await searchParams;
  const range = resolved?.from && resolved?.to
    ? { from: resolved.from, to: resolved.to }
    : buildRange();

  const [performanceResult, funnelResult, attributionResult] =
    await Promise.all([
      getMarketingPerformance(range.from, range.to),
      getFunnelHealth(),
      getRevenueAttribution(range.from, range.to),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Marketing performance, funnel health, and revenue attribution.
        </p>
      </div>

      <AnalyticsClient
        initialRange={range}
        performance={performanceResult.data ?? null}
        funnel={funnelResult.data ?? null}
        attribution={"data" in attributionResult ? (attributionResult.data ?? null) : null}
      />
    </div>
  );
}
