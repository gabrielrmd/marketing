"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { publishToLinkedIn } from "@/lib/content/publish-linkedin";
import { PrepExportCard } from "./prep-export-card";
import { Send } from "lucide-react";
import { AU_CHANNELS } from "@/lib/constants";
import type { ContentItem } from "@/lib/content/types";

export function PublishingPanel({ item }: { item: ContentItem }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const channel = AU_CHANNELS.find((c) => c.id === item.channel);

  if (!channel) return null;

  if (channel.mode === "prep_export") {
    return <PrepExportCard item={item} />;
  }

  function handlePublish() {
    startTransition(async () => {
      if (item.channel === "linkedin") {
        const res = await publishToLinkedIn(item.id);
        setResult(res.success ? "Published to LinkedIn!" : `Error: ${res.error}`);
      }
    });
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Publish to {channel.label}</h3>
      {item.channel === "blog" && (
        <p className="text-sm text-muted-foreground">
          Blog posts are published automatically when status is set to &quot;published.&quot;
        </p>
      )}
      {item.channel === "linkedin" && (
        <Button onClick={handlePublish} disabled={isPending} size="sm">
          <Send className="mr-1 h-4 w-4" />
          {isPending ? "Publishing..." : "Publish Now"}
        </Button>
      )}
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </Card>
  );
}
