"use client";

import { useState, useEffect, useTransition } from "react";
import { getContentVersions } from "@/lib/content/actions";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import type { ContentVersion } from "@/lib/content/types";

type VersionHistoryProps = {
  contentItemId: string;
  onRestore: (version: ContentVersion) => void;
};

export function VersionHistory({ contentItemId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const result = await getContentVersions(contentItemId);
      if (result.data) setVersions(result.data as ContentVersion[]);
    });
  }, [open, contentItemId]);

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <History className="mr-1 h-4 w-4" /> {open ? "Hide" : "Show"} History
      </Button>
      {open && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border divide-y">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-2 text-sm">
              <div>
                <span className="font-medium">v{v.version_number}</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(v.created_at).toLocaleString()}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRestore(v)}>
                Restore
              </Button>
            </div>
          ))}
          {versions.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">No version history.</p>
          )}
        </div>
      )}
    </div>
  );
}
