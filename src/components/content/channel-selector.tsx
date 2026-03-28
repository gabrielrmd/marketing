"use client";

import { AU_CHANNELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChannelId } from "@/lib/content/types";

type ChannelSelectorProps = { value: ChannelId | null; onChange: (channel: ChannelId) => void };

export function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AU_CHANNELS.map((channel) => (
        <button
          key={channel.id}
          type="button"
          onClick={() => onChange(channel.id as ChannelId)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            value === channel.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
          )}
        >
          {channel.label}
          <Badge variant="secondary" className="text-xs">{channel.mode === "direct" ? "Publish" : "Export"}</Badge>
        </button>
      ))}
    </div>
  );
}
