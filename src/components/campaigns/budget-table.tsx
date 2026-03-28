"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BudgetEntry, BudgetEntryType } from "@/lib/campaigns/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  entries: BudgetEntry[];
  onAdd: (data: {
    description: string;
    channel: string;
    entry_type: BudgetEntryType;
    amount: number;
    date: string;
  }) => void;
  onUpdate: (
    id: string,
    data: Partial<{
      description: string;
      channel: string | null;
      entry_type: BudgetEntryType;
      amount: number;
      date: string | null;
    }>
  ) => void;
  onDelete: (id: string) => void;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const ENTRY_TYPE_OPTIONS: { value: BudgetEntryType; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "actual", label: "Actual" },
];

const EMPTY_ROW = {
  description: "",
  channel: "",
  entry_type: "planned" as BudgetEntryType,
  amount: "",
  date: "",
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function BudgetTable({ entries, onAdd, onUpdate, onDelete }: Props) {
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<{
    description: string;
    channel: string;
    entry_type: BudgetEntryType;
    amount: string;
    date: string;
  } | null>(null);

  // ── Add row ──
  function handleAdd() {
    const amount = parseFloat(newRow.amount);
    if (!newRow.description.trim() || isNaN(amount) || amount <= 0) return;

    onAdd({
      description: newRow.description.trim(),
      channel: newRow.channel.trim(),
      entry_type: newRow.entry_type,
      amount,
      date: newRow.date,
    });
    setNewRow(EMPTY_ROW);
  }

  // ── Start edit ──
  function startEdit(entry: BudgetEntry) {
    setEditingId(entry.id);
    setEditRow({
      description: entry.description,
      channel: entry.channel ?? "",
      entry_type: entry.entry_type,
      amount: String(entry.amount),
      date: entry.date ? entry.date.slice(0, 10) : "",
    });
  }

  // ── Save edit ──
  function saveEdit(id: string) {
    if (!editRow) return;
    const amount = parseFloat(editRow.amount);
    if (!editRow.description.trim() || isNaN(amount)) return;

    onUpdate(id, {
      description: editRow.description.trim(),
      channel: editRow.channel.trim() || null,
      entry_type: editRow.entry_type,
      amount,
      date: editRow.date || null,
    });
    setEditingId(null);
    setEditRow(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow(null);
  }

  return (
    <div className="space-y-2">
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Description
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Channel
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Type
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Amount
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Date
              </th>
              <th className="px-3 py-2.5 w-24" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  No budget entries yet. Add one below.
                </td>
              </tr>
            )}

            {entries.map((entry, i) => {
              const isEditing = editingId === entry.id;
              return (
                <tr
                  key={entry.id}
                  className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
                >
                  {isEditing && editRow ? (
                    <>
                      <td className="px-2 py-1.5">
                        <Input
                          value={editRow.description}
                          onChange={(e) =>
                            setEditRow((r) => r && { ...r, description: e.target.value })
                          }
                          className="h-7 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={editRow.channel}
                          onChange={(e) =>
                            setEditRow((r) => r && { ...r, channel: e.target.value })
                          }
                          className="h-7 text-sm"
                          placeholder="e.g. email"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={editRow.entry_type}
                          onChange={(e) =>
                            setEditRow(
                              (r) => r && { ...r, entry_type: e.target.value as BudgetEntryType }
                            )
                          }
                          className="h-7 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {ENTRY_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editRow.amount}
                          onChange={(e) =>
                            setEditRow((r) => r && { ...r, amount: e.target.value })
                          }
                          className="h-7 text-sm text-right"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="date"
                          value={editRow.date}
                          onChange={(e) =>
                            setEditRow((r) => r && { ...r, date: e.target.value })
                          }
                          className="h-7 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 px-2 text-xs"
                            onClick={() => saveEdit(entry.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 font-medium">{entry.description}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {entry.channel ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.entry_type === "planned"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              : "bg-green-500/10 text-green-700 dark:text-green-400"
                          }`}
                        >
                          {entry.entry_type === "planned" ? "Planned" : "Actual"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        $
                        {entry.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => startEdit(entry)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => onDelete(entry.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div className="rounded-lg border p-3 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Add Entry
        </p>
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description</label>
            <Input
              value={newRow.description}
              onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))}
              placeholder="e.g. Facebook Ads"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Channel</label>
            <Input
              value={newRow.channel}
              onChange={(e) => setNewRow((r) => ({ ...r, channel: e.target.value }))}
              placeholder="e.g. social"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <select
              value={newRow.entry_type}
              onChange={(e) =>
                setNewRow((r) => ({ ...r, entry_type: e.target.value as BudgetEntryType }))
              }
              className="h-8 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ENTRY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount ($)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newRow.amount}
              onChange={(e) => setNewRow((r) => ({ ...r, amount: e.target.value }))}
              placeholder="0.00"
              className="h-8 text-sm w-28"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input
              type="date"
              value={newRow.date}
              onChange={(e) => setNewRow((r) => ({ ...r, date: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={
              !newRow.description.trim() ||
              !newRow.amount ||
              parseFloat(newRow.amount) <= 0
            }
          >
            Add Row
          </Button>
        </div>
      </div>
    </div>
  );
}
