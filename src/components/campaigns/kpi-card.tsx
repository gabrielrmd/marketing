"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
};

export function KpiCard({ label, value, trend, trendLabel }: KpiCardProps) {
  const hasTrend = typeof trend === "number";
  const isPositive = hasTrend && trend >= 0;
  const isNegative = hasTrend && trend < 0;

  return (
    <Card size="sm" className="min-w-[160px] flex-1">
      <CardHeader>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="font-[family-name:var(--font-oswald)] text-3xl font-bold tabular-nums leading-none">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {hasTrend && (
            <span
              className={[
                "mb-0.5 flex items-center gap-0.5 text-xs font-medium",
                isPositive ? "text-emerald-500" : "",
                isNegative ? "text-red-500" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isPositive ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        {trendLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{trendLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
