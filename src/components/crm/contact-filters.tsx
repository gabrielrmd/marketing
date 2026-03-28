"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FUNNEL_STAGES } from "@/lib/constants";
import { XIcon } from "lucide-react";
import type { ContactStage } from "@/lib/funnel/types";

export type ContactFilterValues = {
  search?: string;
  stage?: ContactStage | "";
  score_min?: number | null;
  score_max?: number | null;
  tag?: string;
  source?: string;
  assigned_to?: string;
};

type Props = {
  onChange: (filters: ContactFilterValues) => void;
  initialValues?: ContactFilterValues;
};

export function ContactFilters({ onChange, initialValues = {} }: Props) {
  const [search, setSearch] = useState(initialValues.search ?? "");
  const [stage, setStage] = useState<ContactStage | "">(initialValues.stage ?? "");
  const [scoreMin, setScoreMin] = useState(
    initialValues.score_min != null ? String(initialValues.score_min) : ""
  );
  const [scoreMax, setScoreMax] = useState(
    initialValues.score_max != null ? String(initialValues.score_max) : ""
  );
  const [tag, setTag] = useState(initialValues.tag ?? "");
  const [source, setSource] = useState(initialValues.source ?? "");
  const [assignedTo, setAssignedTo] = useState(initialValues.assigned_to ?? "");

  const emit = useCallback(
    (overrides: Partial<ContactFilterValues> = {}) => {
      onChange({
        search: search || undefined,
        stage: stage || undefined,
        score_min: scoreMin ? parseInt(scoreMin, 10) : null,
        score_max: scoreMax ? parseInt(scoreMax, 10) : null,
        tag: tag || undefined,
        source: source || undefined,
        assigned_to: assignedTo || undefined,
        ...overrides,
      });
    },
    [search, stage, scoreMin, scoreMax, tag, source, assignedTo, onChange]
  );

  function clearAll() {
    setSearch("");
    setStage("");
    setScoreMin("");
    setScoreMax("");
    setTag("");
    setSource("");
    setAssignedTo("");
    onChange({});
  }

  const hasFilters =
    search || stage || scoreMin || scoreMax || tag || source || assignedTo;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search text */}
      <div className="space-y-1 min-w-[160px] flex-1">
        <label className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            emit({ search: e.target.value || undefined });
          }}
          placeholder="Name or email..."
        />
      </div>

      {/* Stage */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Stage
        </label>
        <select
          value={stage}
          onChange={(e) => {
            const val = e.target.value as ContactStage | "";
            setStage(val);
            emit({ stage: val || undefined });
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9"
        >
          <option value="">All stages</option>
          {FUNNEL_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Score range */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Score min
        </label>
        <Input
          type="number"
          value={scoreMin}
          onChange={(e) => {
            setScoreMin(e.target.value);
            emit({
              score_min: e.target.value ? parseInt(e.target.value, 10) : null,
            });
          }}
          placeholder="0"
          className="w-20"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Score max
        </label>
        <Input
          type="number"
          value={scoreMax}
          onChange={(e) => {
            setScoreMax(e.target.value);
            emit({
              score_max: e.target.value ? parseInt(e.target.value, 10) : null,
            });
          }}
          placeholder="100"
          className="w-20"
        />
      </div>

      {/* Tag */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Tag</label>
        <Input
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            emit({ tag: e.target.value || undefined });
          }}
          placeholder="e.g. vip"
          className="w-28"
        />
      </div>

      {/* Source */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Source
        </label>
        <Input
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            emit({ source: e.target.value || undefined });
          }}
          placeholder="e.g. linkedin"
          className="w-28"
        />
      </div>

      {/* Assigned To */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Assigned To
        </label>
        <Input
          value={assignedTo}
          onChange={(e) => {
            setAssignedTo(e.target.value);
            emit({ assigned_to: e.target.value || undefined });
          }}
          placeholder="User ID..."
          className="w-28"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="gap-1.5"
        >
          <XIcon className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
