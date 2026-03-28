"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import type { ContentItem } from "@/lib/content/types";

const DIMENSIONS: Record<string, string> = {
  youtube: "1280x720 (thumbnail)",
  instagram: "1080x1080 (feed) / 1080x1920 (story)",
};

function CopyBtn({ text, field, copied, onCopy }: { text: string; field: string; copied: string | null; onCopy: (text: string, field: string) => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={() => onCopy(text, field)} className="h-8 w-8 p-0">
      {copied === field ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export function PrepExportCard({ item }: { item: ContentItem }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Export for {item.channel === "youtube" ? "YouTube" : "Instagram"}</h3>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div><p className="text-xs text-muted-foreground">Title</p><p className="text-sm">{item.title}</p></div>
          <CopyBtn text={item.title} field="title" copied={copied} onCopy={copy} />
        </div>
        <div className="flex items-start justify-between">
          <div><p className="text-xs text-muted-foreground">Body</p><p className="text-sm whitespace-pre-wrap">{item.body_text}</p></div>
          <CopyBtn text={item.body_text} field="body" copied={copied} onCopy={copy} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recommended Dimensions</p>
          <p className="text-sm">{DIMENSIONS[item.channel] ?? "N/A"}</p>
        </div>
      </div>
    </Card>
  );
}
