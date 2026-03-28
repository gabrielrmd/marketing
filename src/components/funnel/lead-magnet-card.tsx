"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteLeadMagnet } from "@/lib/funnel/actions";
import type { LeadMagnet } from "@/lib/funnel/types";

type LeadMagnetCardProps = {
  magnet: LeadMagnet;
  onDeleted: (id: string) => void;
};

export function LeadMagnetCard({ magnet, onDeleted }: LeadMagnetCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this lead magnet? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteLeadMagnet(magnet.id);
      if (!result.error) {
        onDeleted(magnet.id);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg leading-tight">
            {magnet.title}
          </CardTitle>
          {magnet.file_type && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {magnet.file_type}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {magnet.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {magnet.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground tabular-nums">
            {magnet.download_count.toLocaleString()} download
            {magnet.download_count !== 1 ? "s" : ""}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-7 px-2"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
