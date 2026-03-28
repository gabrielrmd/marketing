"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContentTypeBadge } from "./content-type-badge";
import type { ContentItem } from "@/lib/content/types";
import { AU_CHANNELS } from "@/lib/constants";
import Link from "next/link";

export function CalendarItem({ item }: { item: ContentItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const channel = AU_CHANNELS.find((c) => c.id === item.channel);

  return (
    <Link href={`/dashboard/content/${item.id}`}>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}
        className="rounded-md border bg-card p-2 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-medium truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{channel?.label}</span>
          <ContentTypeBadge type={item.content_type} />
        </div>
      </div>
    </Link>
  );
}
