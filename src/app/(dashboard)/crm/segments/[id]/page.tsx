"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SegmentBuilder } from "@/components/crm/segment-builder";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSegment, refreshSegmentMembers } from "@/lib/crm/actions";
import { getSegments, getSegmentMembers } from "@/lib/crm/queries";
import type { Segment, SegmentFilterRule } from "@/lib/crm/types";
import type { Contact } from "@/lib/funnel/types";
import { FUNNEL_STAGES } from "@/lib/constants";
import { ChevronLeftIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default function SegmentDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [segment, setSegment] = useState<Segment | null>(null);
  const [members, setMembers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filterRules, setFilterRules] = useState<SegmentFilterRule>({});

  async function load() {
    const [segsResult, membersResult] = await Promise.all([
      getSegments(),
      getSegmentMembers(id),
    ]);

    if (segsResult.error) {
      setError(segsResult.error);
      setLoading(false);
      return;
    }

    const found = (segsResult.data ?? []).find((s) => s.id === id) ?? null;
    setSegment(found);

    if (found) {
      setName(found.name);
      setDescription(found.description ?? "");
      setFilterRules(found.filter_rules);
    } else {
      setError("Segment not found.");
    }

    setMembers((membersResult.data ?? []) as Contact[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const result = await updateSegment(id, {
        name: name.trim() || undefined,
        description: description.trim() || null,
        filter_rules: filterRules,
      });

      if (result.error) {
        setSaveError(result.error);
        return;
      }

      if (result.data) setSegment(result.data);
      router.refresh();
    });
  }

  function handleRefreshMembers() {
    startTransition(async () => {
      const result = await refreshSegmentMembers(id);
      if (!result.error) {
        const membersResult = await getSegmentMembers(id);
        setMembers((membersResult.data ?? []) as Contact[]);
        // Update count on segment
        if (result.count !== undefined) {
          setSegment((prev) =>
            prev ? { ...prev, contact_count: result.count! } : prev
          );
        }
        router.refresh();
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading segment...</p>
      </div>
    );
  }

  if (error || !segment) {
    return (
      <div className="space-y-4">
        <Link
          href="/crm/segments"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Segments
        </Link>
        <p className="text-destructive">{error ?? "Segment not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/crm/segments"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Segments
      </Link>

      {/* Header + editable name */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="seg-name">
                Name
              </label>
              <Input
                id="seg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Segment name"
                className="text-base font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="seg-desc">
                Description
              </label>
              <Input
                id="seg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {segment.is_preset && (
              <Badge
                variant="outline"
                className="text-xs bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400"
              >
                Preset
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {segment.contact_count} member{segment.contact_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}

        <Button
          onClick={handleSave}
          disabled={isPending}
          size="sm"
          className="gap-1.5"
        >
          <SaveIcon className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Filter rules */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-oswald)] text-lg font-medium tracking-wide">
          Filter Rules
        </h2>
        <p className="text-sm text-muted-foreground">
          Contacts matching ALL rules are members of this segment.
        </p>
        <SegmentBuilder
          rules={filterRules}
          onChange={setFilterRules}
          contacts={members}
        />
      </div>

      {/* Members */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-oswald)] text-lg font-medium tracking-wide">
            Members ({members.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshMembers}
            disabled={isPending}
            className="gap-1.5"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh Members
          </Button>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No members yet. Refresh to evaluate filter rules.
          </p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Stage</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {members.map((contact) => {
                  const stageLabel =
                    FUNNEL_STAGES.find((s) => s.id === contact.stage)?.label ??
                    contact.stage;
                  return (
                    <tr
                      key={contact.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/crm/contacts/${contact.id}`)
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {contact.name ?? (
                          <span className="text-muted-foreground italic">Unnamed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{contact.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {stageLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <LeadScoreBadge score={contact.lead_score} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
