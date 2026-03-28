"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SequenceBuilder } from "@/components/funnel/sequence-builder";
import { SequenceAnalytics } from "@/components/funnel/sequence-analytics";
import {
  getSequenceWithSteps,
  getSequenceAnalytics,
  updateSequence,
  deleteSequence,
} from "@/lib/funnel/actions";
import type {
  EmailSequence,
  EmailSequenceStep,
  SequenceStatus,
  SequenceTriggerType,
} from "@/lib/funnel/types";

const STATUS_OPTIONS: { value: SequenceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

const TRIGGER_TYPES: { value: SequenceTriggerType; label: string; hasValue: boolean }[] = [
  { value: "manual", label: "Manual", hasValue: false },
  { value: "form_submission", label: "Form Submission", hasValue: true },
  { value: "tag_added", label: "Tag Added", hasValue: true },
  { value: "stage_change", label: "Stage Change", hasValue: true },
];

type AnalyticsData = {
  totalEnrolled: number;
  active: number;
  completed: number;
  totalSent: number;
  openRate: number;
  clickRate: number;
};

export default function EditSequencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sequence, setSequence] = useState<EmailSequence | null>(null);
  const [steps, setSteps] = useState<EmailSequenceStep[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>("manual");
  const [triggerValue, setTriggerValue] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getSequenceWithSteps(id), getSequenceAnalytics(id)]).then(
      ([seqResult, analyticsResult]) => {
        setLoading(false);

        if (seqResult.error || !seqResult.data) {
          setNotFound(true);
          return;
        }

        const data = seqResult.data as EmailSequence & { steps: EmailSequenceStep[] };
        setSequence(data);
        setSteps(data.steps ?? []);
        setName(data.name);
        setDescription(data.description ?? "");
        setTriggerType(data.trigger_type);
        setTriggerValue(data.trigger_value ?? "");

        if (analyticsResult.data) {
          const a = analyticsResult.data;
          setAnalytics({
            totalEnrolled: a.enrollments.total,
            active: a.enrollments.active,
            completed: a.enrollments.completed,
            totalSent: a.sends.total,
            openRate: a.sends.openRate,
            clickRate: a.sends.clickRate,
          });
        }
      }
    );
  }, [id]);

  function handleSaveDetails() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateSequence(id, {
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: triggerType,
        trigger_value: triggerValue.trim() || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSequence(result.data as EmailSequence);
        setSuccess(true);
      }
    });
  }

  function handleStatusChange(status: SequenceStatus) {
    startTransition(async () => {
      const result = await updateSequence(id, { status });
      if (result.error) {
        setError(result.error);
      } else {
        setSequence(result.data as EmailSequence);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this sequence and all its steps? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteSequence(id);
      if (result.error) {
        setError(result.error as string);
      } else {
        router.push("/funnel/sequences");
      }
    });
  }

  const selectedTrigger = TRIGGER_TYPES.find((t) => t.value === triggerType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !sequence) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Sequence not found.</p>
        <Button variant="outline" onClick={() => router.push("/funnel/sequences")}>
          Back to Sequences
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            {sequence.name}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{sequence.status}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.filter((s) => s.value !== sequence.status).map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={s.value === "active" ? "default" : "outline"}
              onClick={() => handleStatusChange(s.value)}
              disabled={isPending}
            >
              Set {s.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Details saved successfully.
        </div>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sequence name..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this sequence do?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            {selectedTrigger?.hasValue && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Trigger Value</label>
                <Input
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                  placeholder="value..."
                />
              </div>
            )}
          </div>
          <div className="pt-1">
            <Button size="sm" onClick={handleSaveDetails} disabled={isPending}>
              {isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SequenceBuilder
            sequenceId={id}
            steps={steps}
            onChange={setSteps}
          />
        </CardContent>
      </Card>

      {/* Analytics */}
      {analytics && <SequenceAnalytics analytics={analytics} />}
    </div>
  );
}
