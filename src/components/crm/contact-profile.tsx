"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { LeadScoreBadge } from "./lead-score-badge";
import { ActivityTimeline } from "./activity-timeline";
import { ContactTasks } from "./contact-tasks";
import { ContactForm, type ContactFormData } from "./contact-form";
import { PencilIcon, BuildingIcon, UserIcon } from "lucide-react";
import { FUNNEL_STAGES } from "@/lib/constants";
import type { ContactWithDetails, ContactTask } from "@/lib/crm/types";

type Props = {
  contact: ContactWithDetails;
  onUpdate: (data: ContactFormData) => void;
  onAddNote: (content: string) => void;
  onAddTask: (data: {
    title: string;
    due_date: string | null;
    assigned_to: string | null;
  }) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
};

export function ContactProfile({
  contact,
  onUpdate,
  onAddNote,
  onAddTask,
  onCompleteTask,
  onDeleteTask,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const stageLabel =
    FUNNEL_STAGES.find((s) => s.id === contact.stage)?.label ?? contact.stage;

  async function handleUpdate(data: ContactFormData) {
    setIsPending(true);
    try {
      await onUpdate(data);
      setEditOpen(false);
    } finally {
      setIsPending(false);
    }
  }

  // Build task list from contact details
  const tasks: ContactTask[] = contact.tasks ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-oswald)] text-2xl font-medium tracking-wide leading-none">
              {contact.name ?? "Unnamed Contact"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {contact.email}
            </p>
          </div>

          {/* Edit button */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" />
              }
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Contact</DialogTitle>
              </DialogHeader>
              <ContactForm
                initialData={contact}
                onSubmit={handleUpdate}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {contact.company && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <BuildingIcon className="h-3.5 w-3.5" />
              {contact.company}
            </span>
          )}
          {contact.assigned_to && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" />
              {contact.assigned_to.slice(0, 8)}…
            </span>
          )}
          <LeadScoreBadge score={contact.lead_score} />
          <Badge variant="outline" className="text-xs">
            {stageLabel}
          </Badge>
        </div>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks
            {tasks.filter((t) => t.status !== "completed").length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-px">
                {tasks.filter((t) => t.status !== "completed").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        {/* Activity tab */}
        <TabsContent value="activity" className="pt-4">
          <ActivityTimeline
            activities={contact.activities ?? []}
            onAddNote={onAddNote}
          />
        </TabsContent>

        {/* Tasks tab */}
        <TabsContent value="tasks" className="pt-4">
          <ContactTasks
            tasks={tasks}
            onAdd={onAddTask}
            onComplete={onCompleteTask}
            onDelete={onDeleteTask}
          />
        </TabsContent>

        {/* Segments tab */}
        <TabsContent value="segments" className="pt-4">
          {contact.segments && contact.segments.length > 0 ? (
            <div className="space-y-2">
              {contact.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{segment.name}</p>
                    {segment.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {segment.description}
                      </p>
                    )}
                  </div>
                  {segment.is_preset && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400"
                    >
                      Preset
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Not a member of any segments yet.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
