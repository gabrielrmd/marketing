"use client";

import { FUNNEL_STAGES } from "@/lib/constants";

type FunnelChartProps = {
  stageDistribution: Record<string, number>;
};

const STAGE_COLORS = [
  "var(--au-teal)",
  "var(--au-green)",
  "var(--au-orange)",
  "var(--au-yellow)",
  "var(--au-teal)",
  "var(--au-green)",
  "var(--au-orange)",
];

export function FunnelChart({ stageDistribution }: FunnelChartProps) {
  const maxCount = Math.max(
    1,
    ...FUNNEL_STAGES.map((s) => stageDistribution[s.id] ?? 0)
  );
  const total = FUNNEL_STAGES.reduce(
    (sum, s) => sum + (stageDistribution[s.id] ?? 0),
    0
  );

  return (
    <div className="space-y-2">
      {FUNNEL_STAGES.map((stage, i) => {
        const count = stageDistribution[stage.id] ?? 0;
        const widthPct = (count / maxCount) * 100;
        const totalPct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

        return (
          <div key={stage.id} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-sm text-muted-foreground text-right">
              {stage.label}
            </span>
            <div className="flex-1 h-7 bg-muted rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length],
                  minWidth: count > 0 ? "2px" : "0",
                }}
              />
            </div>
            <span className="w-24 shrink-0 text-sm tabular-nums">
              {count.toLocaleString()} <span className="text-muted-foreground">({totalPct}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
