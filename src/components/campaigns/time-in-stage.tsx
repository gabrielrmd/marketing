"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { FUNNEL_STAGES } from "@/lib/constants";

type TimeInStageProps = {
  data: Record<string, number>;
};

export function TimeInStage({ data }: TimeInStageProps) {
  const chartData = FUNNEL_STAGES.map((stage) => ({
    stage: stage.label,
    days: parseFloat((data[stage.id] ?? 0).toFixed(1)),
  })).filter((d) => d.days > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No stage duration data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis
          type="number"
          unit=" d"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="stage"
          width={160}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          formatter={(value) => [`${value} days`, "Avg. time"]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="days" fill="#2AB9B0" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="days"
            position="right"
            formatter={(v: unknown) => `${v}d`}
            style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
