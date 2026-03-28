"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateScoreRule } from "@/lib/crm/actions";
import type { LeadScoreRule } from "@/lib/crm/types";

type Props = {
  initialRules: LeadScoreRule[];
};

type DraftRule = LeadScoreRule & { draft_points: string; dirty: boolean };

export function LeadScoreConfig({ initialRules }: Props) {
  const [rules, setRules] = useState<DraftRule[]>(
    initialRules.map((r) => ({
      ...r,
      draft_points: String(r.points),
      dirty: false,
    }))
  );
  const [saving, setSaving] = useState<string | null>(null); // id of rule being saved
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handlePointsChange(id: string, value: string) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, draft_points: value, dirty: value !== String(r.points) } : r
      )
    );
    setSuccess(false);
    setError(null);
  }

  async function handleSave() {
    const dirtyRules = rules.filter((r) => r.dirty);
    if (dirtyRules.length === 0) return;

    setSaving("all");
    setError(null);
    setSuccess(false);

    try {
      for (const rule of dirtyRules) {
        const points = parseInt(rule.draft_points, 10);
        if (isNaN(points)) continue;
        const result = await updateScoreRule(rule.id, points);
        if (result.error) {
          setError(`Failed to update "${rule.action}": ${result.error}`);
          return;
        }
        // Mark as clean with new value
        setRules((prev) =>
          prev.map((r) =>
            r.id === rule.id ? { ...r, points, dirty: false } : r
          )
        );
      }
      setSuccess(true);
    } finally {
      setSaving(null);
    }
  }

  const hasDirty = rules.some((r) => r.dirty);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-28">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {rule.action}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {rule.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Input
                    type="number"
                    value={rule.draft_points}
                    onChange={(e) =>
                      handlePointsChange(rule.id, e.target.value)
                    }
                    className={`w-20 text-right ml-auto ${
                      rule.dirty
                        ? "border-primary ring-1 ring-primary/30"
                        : ""
                    }`}
                    step="1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Score rules saved successfully.
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasDirty || saving === "all"}
          size="sm"
        >
          {saving === "all" ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
