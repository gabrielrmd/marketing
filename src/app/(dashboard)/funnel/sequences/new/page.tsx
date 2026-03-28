"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSequence } from "@/lib/funnel/actions";
import type { SequenceTriggerType } from "@/lib/funnel/types";

const TRIGGER_TYPES: { value: SequenceTriggerType; label: string; hasValue: boolean; placeholder: string }[] = [
  { value: "manual", label: "Manual", hasValue: false, placeholder: "" },
  { value: "form_submission", label: "Form Submission", hasValue: true, placeholder: "form-id" },
  { value: "tag_added", label: "Tag Added", hasValue: true, placeholder: "tag-name" },
  { value: "stage_change", label: "Stage Change", hasValue: true, placeholder: "subscriber" },
];

export default function NewSequencePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>("manual");
  const [triggerValue, setTriggerValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedTrigger = TRIGGER_TYPES.find((t) => t.value === triggerType)!;

  function handleSave() {
    if (!name.trim()) {
      setError("Please enter a sequence name.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createSequence({
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: triggerType,
        trigger_value: triggerValue.trim() || null,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        router.push(`/funnel/sequences/${(result.data as { id: string }).id}`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          New Sequence
        </h1>
        <p className="text-muted-foreground">
          Set up an automated email sequence triggered by contact behaviour.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Subscriber Welcome"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this sequence do?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Trigger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When should contacts be enrolled into this sequence?
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Trigger Type</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={triggerType}
              onChange={(e) => {
                setTriggerType(e.target.value as SequenceTriggerType);
                setTriggerValue("");
              }}
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {selectedTrigger.hasValue && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trigger Value</label>
              <Input
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder={selectedTrigger.placeholder}
              />
              <p className="text-xs text-muted-foreground">
                {triggerType === "form_submission" && "Enter the form ID to watch for submissions."}
                {triggerType === "tag_added" && "Enter the tag name that triggers enrollment."}
                {triggerType === "stage_change" && "Enter the stage name (e.g. subscriber, engaged)."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Creating..." : "Create Sequence"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/funnel/sequences")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
