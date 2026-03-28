"use client";

import { useState, useTransition } from "react";
import { getPillarCoverage } from "@/lib/content/actions";
import { AU_PILLARS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

export function PillarCoverage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getPillarCoverage();
      if (result.data) setCounts(result.data);
    });
  }, []);

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Pillar Coverage</h3>
      <div className="space-y-2">
        {AU_PILLARS.map((pillar) => {
          const count = counts[pillar.id] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={pillar.id} className="flex items-center gap-3">
              <span className="text-xs w-28 truncate">{pillar.label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
