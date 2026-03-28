"use client";

import { FUNNEL_STAGES } from "@/lib/constants";

type FunnelHealthChartProps = {
  stageDistribution: Record<string, number>;
  dropOffRates: Record<string, number>;
};

/** Returns a color hex based on drop-off severity: green → yellow → red */
function dropOffColor(pct: number): string {
  if (pct < 20) return "#8ED16A"; // AU green — low drop-off
  if (pct < 40) return "#F8CE30"; // AU yellow — moderate
  if (pct < 60) return "#F28C28"; // AU orange — high
  return "#ef4444"; // red — severe
}

export function FunnelHealthChart({
  stageDistribution,
  dropOffRates,
}: FunnelHealthChartProps) {
  const maxCount = Math.max(
    1,
    ...FUNNEL_STAGES.map((s) => stageDistribution[s.id] ?? 0)
  );

  return (
    <div className="space-y-1">
      {FUNNEL_STAGES.map((stage, i) => {
        const count = stageDistribution[stage.id] ?? 0;
        const widthPct = (count / maxCount) * 100;

        // Drop-off between this stage and the next
        const nextStage = FUNNEL_STAGES[i + 1];
        const dropOffKey = nextStage
          ? `${stage.id}→${nextStage.id}`
          : null;
        // dropOffRates may be keyed as "from→to" or by index — check both forms
        const rawDropOff =
          dropOffKey !== null
            ? (dropOffRates[dropOffKey] ??
              dropOffRates[`${stage.label}→${nextStage?.label}`] ??
              null)
            : null;

        return (
          <div key={stage.id}>
            {/* Stage bar row */}
            <div className="flex items-center gap-3">
              <span className="w-48 shrink-0 text-right text-sm text-muted-foreground">
                {stage.label}
              </span>
              <div className="flex-1 h-7 rounded bg-muted overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: "#2AB9B0",
                    minWidth: count > 0 ? "4px" : "0",
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-sm tabular-nums text-right">
                {count.toLocaleString()}
              </span>
            </div>

            {/* Drop-off indicator between stages */}
            {nextStage && rawDropOff !== null && (
              <div className="flex items-center gap-3 py-0.5">
                <span className="w-48 shrink-0" />
                <div className="flex-1 flex items-center gap-2 pl-2">
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: dropOffColor(rawDropOff) }}
                  />
                  <span
                    className="text-xs font-medium tabular-nums"
                    style={{ color: dropOffColor(rawDropOff) }}
                  >
                    −{rawDropOff.toFixed(1)}% drop-off
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: dropOffColor(rawDropOff) }}
                  />
                </div>
                <span className="w-20 shrink-0" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
