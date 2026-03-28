"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, TrashIcon, PlusIcon } from "lucide-react";
import type { ContactTask, TaskStatus } from "@/lib/crm/types";

type Props = {
  tasks: ContactTask[];
  onAdd: (data: { title: string; due_date: string | null; assigned_to: string | null }) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
};

function isOverdue(task: ContactTask): boolean {
  if (!task.due_date || task.status === "completed") return false;
  const due = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactTasks({ tasks, onAdd, onComplete, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsPending(true);
    try {
      await onAdd({
        title: title.trim(),
        due_date: dueDate || null,
        assigned_to: assignedTo.trim() || null,
      });
      setTitle("");
      setDueDate("");
      setAssignedTo("");
      setShowForm(false);
    } finally {
      setIsPending(false);
    }
  }

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-4">
      {/* Add Task button / form */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowForm(true)}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Task
        </Button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <p className="text-sm font-medium">New Task</p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Follow up on proposal..."
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Assign To (ID)
              </label>
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="User ID..."
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </form>
      )}

      {/* Active tasks */}
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks yet.
        </p>
      ) : (
        <div className="space-y-2">
          {activeTasks.map((task) => {
            const overdue = isOverdue(task);
            const statusConfig = STATUS_CONFIG[task.status];
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  overdue ? "border-destructive/40 bg-destructive/5" : "bg-card"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {overdue ? "Overdue · " : "Due "}
                      {formatDate(task.due_date)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs h-4 py-0 ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </Badge>
                    {task.assigned_to && (
                      <span className="text-xs text-muted-foreground">
                        → {task.assigned_to.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onComplete(task.id)}
                    title="Mark complete"
                  >
                    <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(task.id)}
                    title="Delete task"
                  >
                    <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 opacity-60">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4">
                Completed
              </p>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-muted-foreground">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {formatDate(task.due_date)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(task.id)}
                    title="Delete task"
                  >
                    <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
