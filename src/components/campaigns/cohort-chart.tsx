"use client";

import { FUNNEL_STAGES } from "@/lib/constants";

type CohortRow = {
  period: string;
  stages: Record<string, number>;
  total: number;
};

type CohortChartProps = {
  data: CohortRow[];
};

/** Interpolate between two hex colors based on a 0–1 ratio */
function heatColor(intensity: number): string {
  // Low intensity: cool teal; high: warm orange
  const r = Math.round(42 + (242 - 42) * intensity);
  const g = Math.round(185 + (140 - 185) * intensity);
  const b = Math.round(176 + (40 - 176) * intensity);
  return `rgb(${r},${g},${b})`;
}

export function CohortChart({ data }: CohortChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No cohort data available.
      </div>
    );
  }

  // Only show stages that appear in the data
  const relevantStages = FUNNEL_STAGES.filter((s) =>
    data.some((row) => (row.stages[s.id] ?? 0) > 0)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="py-2 pr-3 text-left font-medium text-muted-foreground">
              Cohort
            </th>
            <th className="py-2 pr-3 text-right font-medium text-muted-foreground">
              Total
            </th>
            {relevantStages.map((s) => (
              <th
                key={s.id}
                className="py-2 px-2 text-center font-medium text-muted-foreground"
              >
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.period} className="border-t border-border">
              <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                {row.period}
              </td>
              <td className="py-1.5 pr-3 text-right tabular-nums">
                {row.total.toLocaleString()}
              </td>
              {relevantStages.map((s) => {
                const count = row.stages[s.id] ?? 0;
                const pct = row.total > 0 ? count / row.total : 0;
                return (
                  <td key={s.id} className="py-1.5 px-1 text-center">
                    <span
                      className="inline-block rounded px-2 py-0.5 tabular-nums font-medium"
                      style={{
                        backgroundColor: pct > 0 ? heatColor(pct) : undefined,
                        color: pct > 0 ? "#333" : undefined,
                        opacity: pct > 0 ? 1 : 0.3,
                      }}
                      title={`${(pct * 100).toFixed(1)}%`}
                    >
                      {pct > 0 ? `${(pct * 100).toFixed(0)}%` : "—"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
