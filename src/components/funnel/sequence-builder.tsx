"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { SequenceStep } from "./sequence-step";
import { saveSequenceSteps } from "@/lib/funnel/actions";
import type { EmailSequenceStep, SequenceStepType } from "@/lib/funnel/types";

type SequenceBuilderProps = {
  sequenceId: string;
  steps: EmailSequenceStep[];
  onChange: (steps: EmailSequenceStep[]) => void;
};

type SortableStepProps = {
  step: EmailSequenceStep;
  totalSteps: number;
  onChange: (step: EmailSequenceStep) => void;
  onDelete: () => void;
};

function SortableStepWrapper({ step, totalSteps, onChange, onDelete }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} className="hidden" />
      <SequenceStep
        step={step}
        totalSteps={totalSteps}
        onChange={onChange}
        onDelete={onDelete}
      />
    </div>
  );
}

const ADD_STEP_TYPES: { type: SequenceStepType; label: string }[] = [
  { type: "email", label: "Email" },
  { type: "delay", label: "Delay" },
  { type: "condition", label: "Condition" },
];

function makeStep(type: SequenceStepType, index: number, sequenceId: string): EmailSequenceStep {
  return {
    id: crypto.randomUUID(),
    sequence_id: sequenceId,
    step_index: index,
    step_type: type,
    subject: null,
    body_html: null,
    delay_minutes: type === "delay" ? 60 : null,
    condition_type: null,
    condition_value: null,
    true_next_index: null,
    false_next_index: null,
    created_at: new Date().toISOString(),
  };
}

export function SequenceBuilder({ sequenceId, steps, onChange }: SequenceBuilderProps) {
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [openDropdownAt, setOpenDropdownAt] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function addStep(type: SequenceStepType, afterIndex: number) {
    const newStep = makeStep(type, afterIndex + 1, sequenceId);
    const updated = [
      ...steps.slice(0, afterIndex + 1),
      newStep,
      ...steps.slice(afterIndex + 1),
    ].map((s, i) => ({ ...s, step_index: i }));
    onChange(updated);
    setOpenDropdownAt(null);
  }

  function updateStep(index: number, step: EmailSequenceStep) {
    onChange(steps.map((s, i) => (i === index ? step : s)));
  }

  function deleteStep(index: number) {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step_index: i }));
    onChange(updated);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({
        ...s,
        step_index: i,
      }));
      onChange(reordered);
    }
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);
    startTransition(async () => {
      const payload = steps.map((s) => ({
        step_index: s.step_index,
        step_type: s.step_type,
        subject: s.subject,
        body_html: s.body_html,
        delay_minutes: s.delay_minutes,
        condition_type: s.condition_type,
        condition_value: s.condition_value,
        true_next_index: s.true_next_index,
        false_next_index: s.false_next_index,
      }));
      const result = await saveSequenceSteps(sequenceId, payload);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveSuccess(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      {saveError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Sequence steps saved.
        </div>
      )}

      {/* Initial "Add Step" if empty */}
      {steps.length === 0 && (
        <div className="rounded-lg border border-dashed py-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No steps yet. Add your first step below.
          </p>
          <div className="flex items-center justify-center gap-2">
            {ADD_STEP_TYPES.map(({ type, label }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => addStep(type, -1)}
              >
                + {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0">
              {steps.map((step, index) => (
                <div key={step.id}>
                  <SortableStepWrapper
                    step={step}
                    totalSteps={steps.length}
                    onChange={(updated) => updateStep(index, updated)}
                    onDelete={() => deleteStep(index)}
                  />

                  {/* Add Step connector */}
                  <div className="flex items-center justify-center py-2 relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-border" />
                    <div className="relative z-10">
                      {openDropdownAt === index ? (
                        <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-1 shadow-sm">
                          {ADD_STEP_TYPES.map(({ type, label }) => (
                            <Button
                              key={type}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              type="button"
                              onClick={() => addStep(type, index)}
                            >
                              {label}
                            </Button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setOpenDropdownAt(null)}
                            className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-3 text-xs bg-background"
                          type="button"
                          onClick={() => setOpenDropdownAt(index)}
                        >
                          + Add Step
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {steps.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {ADD_STEP_TYPES.map(({ type, label }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => addStep(type, steps.length - 1)}
              >
                + {label}
              </Button>
            ))}
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? "Saving..." : "Save All Steps"}
          </Button>
        </div>
      )}
    </div>
  );
}
