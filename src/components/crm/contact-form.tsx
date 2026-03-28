"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUNNEL_STAGES } from "@/lib/constants";
import { XIcon } from "lucide-react";
import type { ContactWithDetails } from "@/lib/crm/types";
import type { ContactStage } from "@/lib/funnel/types";

export type ContactFormData = {
  name: string;
  email: string;
  company: string;
  source: string;
  stage: ContactStage;
  tags: string[];
  assigned_to: string;
};

type Props = {
  initialData?: Partial<ContactWithDetails>;
  onSubmit: (data: ContactFormData) => void;
  isPending: boolean;
};

// Minimal team member shape for the dropdown
type TeamMember = { id: string; full_name: string };

// Static placeholder — replaced at page level by passing teamMembers prop if needed.
// For now the form accepts assigned_to as a free-text id selected from a simple select.
const PLACEHOLDER_TEAM: TeamMember[] = [];

export function ContactForm({ initialData, onSubmit, isPending }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [company, setCompany] = useState(initialData?.company ?? "");
  const [source, setSource] = useState(initialData?.source ?? "");
  const [stage, setStage] = useState<ContactStage>(
    initialData?.stage ?? "subscriber"
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [assignedTo, setAssignedTo] = useState(
    initialData?.assigned_to ?? ""
  );

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      email,
      company,
      source,
      stage,
      tags,
      assigned_to: assignedTo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-name">
          Full Name
        </label>
        <Input
          id="cf-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-email">
          Email <span className="text-destructive">*</span>
        </label>
        <Input
          id="cf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          required
        />
      </div>

      {/* Company */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-company">
          Company
        </label>
        <Input
          id="cf-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Corp"
        />
      </div>

      {/* Source */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-source">
          Source
        </label>
        <Input
          id="cf-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. linkedin, referral, organic"
        />
      </div>

      {/* Stage */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-stage">
          Stage
        </label>
        <select
          id="cf-stage"
          value={stage}
          onChange={(e) => setStage(e.target.value as ContactStage)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {FUNNEL_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-tags">
          Tags
        </label>
        <div className="flex gap-2">
          <Input
            id="cf-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag} size="sm">
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
                  aria-label={`Remove tag ${tag}`}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Assigned To */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="cf-assigned">
          Assigned To
        </label>
        {PLACEHOLDER_TEAM.length > 0 ? (
          <select
            id="cf-assigned"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Unassigned</option>
            {PLACEHOLDER_TEAM.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="cf-assigned"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Team member ID (or leave blank)"
          />
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Contact"}
        </Button>
      </div>
    </form>
  );
}
