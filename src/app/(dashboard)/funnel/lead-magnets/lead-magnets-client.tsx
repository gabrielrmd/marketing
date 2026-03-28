"use client";

import { useState } from "react";
import { LeadMagnetCard } from "@/components/funnel/lead-magnet-card";
import type { LeadMagnet } from "@/lib/funnel/types";

type LeadMagnetsClientProps = {
  initialMagnets: LeadMagnet[];
};

export function LeadMagnetsClient({ initialMagnets }: LeadMagnetsClientProps) {
  const [magnets, setMagnets] = useState<LeadMagnet[]>(initialMagnets);

  function handleDeleted(id: string) {
    setMagnets((prev) => prev.filter((m) => m.id !== id));
  }

  if (magnets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">All lead magnets deleted.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {magnets.map((magnet) => (
        <LeadMagnetCard
          key={magnet.id}
          magnet={magnet}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
