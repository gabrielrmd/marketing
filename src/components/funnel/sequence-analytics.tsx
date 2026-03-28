import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SequenceAnalyticsProps = {
  analytics: {
    totalEnrolled: number;
    active: number;
    completed: number;
    totalSent: number;
    openRate: number;
    clickRate: number;
  };
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function SequenceAnalytics({ analytics }: SequenceAnalyticsProps) {
  const { totalEnrolled, active, completed, totalSent, openRate, clickRate } = analytics;

  function pct(rate: number) {
    return `${(rate * 100).toFixed(1)}%`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Enrolled" value={totalEnrolled.toLocaleString()} />
          <StatCard label="Active" value={active.toLocaleString()} />
          <StatCard label="Completed" value={completed.toLocaleString()} />
          <StatCard label="Emails Sent" value={totalSent.toLocaleString()} />
          <StatCard label="Open Rate" value={pct(openRate)} />
          <StatCard label="Click Rate" value={pct(clickRate)} />
        </div>
      </CardContent>
    </Card>
  );
}
