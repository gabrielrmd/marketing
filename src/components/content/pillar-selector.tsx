"use client";

import { AU_PILLARS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PillarId } from "@/lib/content/types";

type PillarSelectorProps = { value: PillarId | null; onChange: (pillar: PillarId | null) => void };

export function PillarSelector({ value, onChange }: PillarSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AU_PILLARS.map((pillar) => (
        <button
          key={pillar.id}
          type="button"
          onClick={() => onChange(value === pillar.id ? null : (pillar.id as PillarId))}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm transition-colors",
            value === pillar.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
          )}
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: pillar.color }} />
          {pillar.label}
        </button>
      ))}
    </div>
  );
}
