"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChannelPerformanceProps = {
  data: Record<string, { impressions: number; clicks: number; conversions: number }>;
};

const AU_TEAL = "#2AB9B0";
const AU_GREEN = "#8ED16A";
const AU_ORANGE = "#F28C28";

export function ChannelPerformance({ data }: ChannelPerformanceProps) {
  const chartData = Object.entries(data).map(([channel, metrics]) => ({
    channel,
    Impressions: metrics.impressions,
    Clicks: metrics.clicks,
    Conversions: metrics.conversions,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No channel data for this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="channel"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="Impressions" fill={AU_TEAL} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Clicks" fill={AU_GREEN} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Conversions" fill={AU_ORANGE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
