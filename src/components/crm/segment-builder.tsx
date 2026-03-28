"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon } from "lucide-react";
import { FUNNEL_STAGES } from "@/lib/constants";
import { evaluateSegmentFilter } from "@/lib/crm/segments";
import type { SegmentFilterRule } from "@/lib/crm/types";
import type { Contact } from "@/lib/funnel/types";

type RuleType = keyof SegmentFilterRule;

const RULE_TYPE_OPTIONS: { value: RuleType; label: string; inputType: "text" | "number" | "stage" }[] = [
  { value: "stage_equals", label: "Stage is", inputType: "stage" },
  { value: "not_stage_equals", label: "Stage is not", inputType: "stage" },
  { value: "score_above", label: "Score above", inputType: "number" },
  { value: "score_below", label: "Score below", inputType: "number" },
  { value: "has_tag", label: "Has tag", inputType: "text" },
  { value: "source_equals", label: "Source is", inputType: "text" },
  { value: "inactive_days", label: "Inactive for (days)", inputType: "number" },
];

type RuleEntry = {
  id: string;
  type: RuleType;
  value: string;
};

type Props = {
  rules: SegmentFilterRule;
  onChange: (rules: SegmentFilterRule) => void;
  /** Optional: pass all contacts to enable the preview count feature */
  contacts?: Contact[];
};

function rulesEntriesToFilterRule(entries: RuleEntry[]): SegmentFilterRule {
  const result: SegmentFilterRule = {};
  for (const entry of entries) {
    if (!entry.value.trim()) continue;
    const numericTypes: RuleType[] = ["score_above", "score_below", "inactive_days"];
    if (numericTypes.includes(entry.type)) {
      const num = parseInt(entry.value, 10);
      if (!isNaN(num)) {
        (result as Record<string, unknown>)[entry.type] = num;
      }
    } else {
      (result as Record<string, unknown>)[entry.type] = entry.value.trim();
    }
  }
  return result;
}

function filterRuleToEntries(rule: SegmentFilterRule): RuleEntry[] {
  const entries: RuleEntry[] = [];
  let counter = 0;
  for (const [key, value] of Object.entries(rule)) {
    if (value !== undefined) {
      entries.push({
        id: String(counter++),
        type: key as RuleType,
        value: String(value),
      });
    }
  }
  return entries;
}

export function SegmentBuilder({ rules, onChange, contacts }: Props) {
  const [entries, setEntries] = useState<RuleEntry[]>(() =>
    filterRuleToEntries(rules)
  );
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  function addRule() {
    const newEntry: RuleEntry = {
      id: String(Date.now()),
      type: "stage_equals",
      value: FUNNEL_STAGES[0].id,
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    onChange(rulesEntriesToFilterRule(updated));
    setPreviewCount(null);
  }

  function removeRule(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    onChange(rulesEntriesToFilterRule(updated));
    setPreviewCount(null);
  }

  function updateRuleType(id: string, type: RuleType) {
    const option = RULE_TYPE_OPTIONS.find((o) => o.value === type);
    const updated = entries.map((e) => {
      if (e.id !== id) return e;
      const defaultValue =
        option?.inputType === "stage" ? FUNNEL_STAGES[0].id : "";
      return { ...e, type, value: defaultValue };
    });
    setEntries(updated);
    onChange(rulesEntriesToFilterRule(updated));
    setPreviewCount(null);
  }

  function updateRuleValue(id: string, value: string) {
    const updated = entries.map((e) => (e.id === id ? { ...e, value } : e));
    setEntries(updated);
    onChange(rulesEntriesToFilterRule(updated));
    setPreviewCount(null);
  }

  function handlePreview() {
    if (!contacts) return;
    const combinedRule = rulesEntriesToFilterRule(entries);
    const count = contacts.filter((c) =>
      evaluateSegmentFilter(c, combinedRule)
    ).length;
    setPreviewCount(count);
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No rules yet — click &quot;Add Rule&quot; to start filtering.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const option = RULE_TYPE_OPTIONS.find((o) => o.value === entry.type);
            return (
              <div key={entry.id} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-xs font-medium text-muted-foreground w-8 shrink-0 text-center">
                    AND
                  </span>
                )}
                {index === 0 && <div className="w-8 shrink-0" />}

                {/* Rule type dropdown */}
                <select
                  value={entry.type}
                  onChange={(e) =>
                    updateRuleType(entry.id, e.target.value as RuleType)
                  }
                  className="rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-1"
                >
                  {RULE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Value input */}
                {option?.inputType === "stage" ? (
                  <select
                    value={entry.value}
                    onChange={(e) => updateRuleValue(entry.id, e.target.value)}
                    className="rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-1"
                  >
                    {FUNNEL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : option?.inputType === "number" ? (
                  <Input
                    type="number"
                    value={entry.value}
                    onChange={(e) => updateRuleValue(entry.id, e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                ) : (
                  <Input
                    value={entry.value}
                    onChange={(e) => updateRuleValue(entry.id, e.target.value)}
                    placeholder="value..."
                    className="flex-1"
                  />
                )}

                {/* Delete rule */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRule(entry.id)}
                  aria-label="Remove rule"
                >
                  <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={addRule}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Rule
        </Button>

        {contacts && entries.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePreview}
          >
            Preview Count
          </Button>
        )}

        {previewCount !== null && (
          <Badge variant="outline" className="text-xs">
            {previewCount} matching contact{previewCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  );
}
