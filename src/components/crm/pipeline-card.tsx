"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { LeadScoreBadge } from "./lead-score-badge";
import type { Contact } from "@/lib/funnel/types";

type Props = {
  contact: Contact & { company?: string | null };
};

export function PipelineCard({ contact }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const visibleTags = contact.tags.slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Name + score */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <Link
          href={`/crm/contacts/${contact.id}`}
          className="font-medium text-sm leading-snug hover:underline line-clamp-1 flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          {contact.name ?? "Unnamed"}
        </Link>
        <LeadScoreBadge score={contact.lead_score} />
      </div>

      {/* Email */}
      <p className="text-xs text-muted-foreground truncate mb-2">
        {contact.email}
      </p>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs py-0 h-4">
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{contact.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Source */}
      {contact.source && (
        <p className="text-xs text-muted-foreground">via {contact.source}</p>
      )}
    </div>
  );
}
