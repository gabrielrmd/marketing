"use client";

import { Input } from "@/components/ui/input";
import type { EmailSequenceStep, ConditionType, SequenceStepType } from "@/lib/funnel/types";

type SequenceStepProps = {
  step: EmailSequenceStep;
  totalSteps: number;
  onChange: (step: EmailSequenceStep) => void;
  onDelete: () => void;
};

const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: "tag_exists", label: "Tag Exists" },
  { value: "email_opened", label: "Email Opened" },
  { value: "email_clicked", label: "Email Clicked" },
  { value: "score_above", label: "Score Above" },
];

const STEP_TYPE_LABELS: Record<SequenceStepType, string> = {
  email: "Email",
  delay: "Delay",
  condition: "Condition",
};

const STEP_TYPE_COLORS: Record<SequenceStepType, string> = {
  email: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delay: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  condition: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export function SequenceStep({ step, totalSteps, onChange, onDelete }: SequenceStepProps) {
  function update(patch: Partial<EmailSequenceStep>) {
    onChange({ ...step, ...patch });
  }

  const stepIndexOptions = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STEP_TYPE_COLORS[step.step_type]}`}
          >
            {STEP_TYPE_LABELS[step.step_type]}
          </span>
          <span className="text-xs text-muted-foreground">Step {step.step_index + 1}</span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-destructive hover:text-destructive/80 font-medium"
        >
          Remove
        </button>
      </div>

      {/* Fields by type */}
      {step.step_type === "email" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Input
              className="h-8 text-sm"
              value={step.subject ?? ""}
              onChange={(e) => update({ subject: e.target.value })}
              placeholder="Email subject line..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Body (HTML)</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-y"
              value={step.body_html ?? ""}
              onChange={(e) => update({ body_html: e.target.value })}
              placeholder="<p>Hi {{name}},</p>&#10;<p>Your email body here...</p>"
            />
          </div>
        </div>
      )}

      {step.step_type === "delay" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Wait</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              className="h-8 text-sm w-32"
              value={step.delay_minutes ?? ""}
              onChange={(e) => update({ delay_minutes: parseInt(e.target.value, 10) || null })}
              placeholder="60"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>
      )}

      {step.step_type === "condition" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Condition Type</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8"
              value={step.condition_type ?? ""}
              onChange={(e) => update({ condition_type: e.target.value as ConditionType || null })}
            >
              <option value="">Select condition...</option>
              {CONDITION_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Value</label>
            <Input
              className="h-8 text-sm"
              value={step.condition_value ?? ""}
              onChange={(e) => update({ condition_value: e.target.value })}
              placeholder={
                step.condition_type === "tag_exists"
                  ? "tag-name"
                  : step.condition_type === "score_above"
                  ? "50"
                  : "value"
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                If true → go to step
              </label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8"
                value={step.true_next_index ?? ""}
                onChange={(e) =>
                  update({
                    true_next_index:
                      e.target.value !== "" ? parseInt(e.target.value, 10) : null,
                  })
                }
              >
                <option value="">Next</option>
                {stepIndexOptions.map((i) => (
                  <option key={i} value={i}>
                    Step {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                If false → go to step
              </label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8"
                value={step.false_next_index ?? ""}
                onChange={(e) =>
                  update({
                    false_next_index:
                      e.target.value !== "" ? parseInt(e.target.value, 10) : null,
                  })
                }
              >
                <option value="">Next</option>
                {stepIndexOptions.map((i) => (
                  <option key={i} value={i}>
                    Step {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
