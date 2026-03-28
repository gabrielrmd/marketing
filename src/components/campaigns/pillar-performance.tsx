"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { AU_PILLARS } from "@/lib/constants";

type PillarPerformanceProps = {
  data: Record<string, number>;
};

// Map CSS var strings to hex for Recharts
const PILLAR_COLOR_MAP: Record<string, string> = {
  "var(--au-teal)": "#2AB9B0",
  "var(--au-green)": "#8ED16A",
  "var(--au-orange)": "#F28C28",
  "var(--au-yellow)": "#F8CE30",
};

function resolveColor(cssVar: string): string {
  return PILLAR_COLOR_MAP[cssVar] ?? "#2AB9B0";
}

export function PillarPerformance({ data }: PillarPerformanceProps) {
  const chartData = AU_PILLARS.map((pillar) => ({
    pillar: pillar.label,
    id: pillar.id,
    Published: data[pillar.id] ?? 0,
    color: resolveColor(pillar.color),
  }));

  const hasData = chartData.some((d) => d.Published > 0);

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No published content for this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="pillar"
          tick={{ fontSize: 11 }}
          angle={-20}
          textAnchor="end"
          interval={0}
          className="fill-muted-foreground"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="Published" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.id} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
