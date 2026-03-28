"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MailIcon,
  FileTextIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  CheckSquareIcon,
  ActivityIcon,
} from "lucide-react";
import type { ContactActivity } from "@/lib/crm/types";

type Props = {
  activities: ContactActivity[];
  onAddNote: (content: string) => void;
};

function getActivityIcon(type: string) {
  if (type.startsWith("email_")) return <MailIcon className="h-4 w-4" />;
  if (type === "form_submit") return <FileTextIcon className="h-4 w-4" />;
  if (type === "stage_change") return <ArrowRightIcon className="h-4 w-4" />;
  if (type === "note_added") return <MessageSquareIcon className="h-4 w-4" />;
  if (type === "task_completed") return <CheckSquareIcon className="h-4 w-4" />;
  return <ActivityIcon className="h-4 w-4" />;
}

function getActivityDescription(activity: ContactActivity): string {
  const meta = activity.metadata as Record<string, string>;
  switch (activity.activity_type) {
    case "email_opened":
      return `Opened email: "${meta.subject ?? ""}"`;
    case "email_clicked":
      return `Clicked link in email: "${meta.subject ?? ""}"`;
    case "email_delivered":
      return `Email delivered: "${meta.subject ?? ""}"`;
    case "form_submit":
      return `Submitted form${meta.form_id ? ` (${meta.form_id})` : ""}`;
    case "stage_change":
      return `Stage changed to ${meta.new_stage ?? "unknown"}`;
    case "note_added":
      return `Note added`;
    case "task_completed":
      return `Task completed: "${meta.title ?? ""}"`;
    default:
      return activity.activity_type.replace(/_/g, " ");
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimeline({ activities, onAddNote }: Props) {
  const [noteText, setNoteText] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleAddNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    setIsPending(true);
    try {
      await onAddNote(trimmed);
      setNoteText("");
    } finally {
      setIsPending(false);
    }
  }

  // Sort newest first
  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <label className="text-sm font-medium">Add Note</label>
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
          placeholder="Write a note about this contact..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={isPending || !noteText.trim()}
          >
            {isPending ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No activity recorded yet.
        </p>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {sorted.map((activity) => (
              <div key={activity.id} className="relative flex gap-3">
                {/* Icon dot */}
                <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-background border text-muted-foreground">
                  {getActivityIcon(activity.activity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 rounded-lg border bg-card px-3 py-2">
                  <p className="text-sm">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
