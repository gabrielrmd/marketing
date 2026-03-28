"use client";

import { Card, CardContent } from "@/components/ui/card";

type ConversionStatsProps = {
  totalPages: number;
  publishedPages: number;
  totalMagnets: number;
  totalDownloads: number;
  activeSequences: number;
  totalSubmissions: number;
};

type StatCard = {
  label: string;
  value: number;
};

export function ConversionStats({
  totalPages,
  publishedPages,
  totalMagnets,
  totalDownloads,
  activeSequences,
  totalSubmissions,
}: ConversionStatsProps) {
  const stats: StatCard[] = [
    { label: "Total Landing Pages", value: totalPages },
    { label: "Published Pages", value: publishedPages },
    { label: "Total Lead Magnets", value: totalMagnets },
    { label: "Total Downloads", value: totalDownloads },
    { label: "Active Sequences", value: activeSequences },
    { label: "Form Submissions", value: totalSubmissions },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <p className="font-[family-name:var(--font-oswald)] text-3xl font-bold tabular-nums">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
