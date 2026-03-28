import { getSegments } from "@/lib/crm/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { PlusIcon, RefreshCwIcon, UsersIcon } from "lucide-react";
import { refreshSegmentMembers } from "@/lib/crm/actions";

export default async function SegmentsPage() {
  const result = await getSegments();
  const segments = result.data ?? [];

  async function handleRefreshAll() {
    "use server";
    await Promise.all(segments.map((s) => refreshSegmentMembers(s.id)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Segments
          </h1>
          <p className="text-muted-foreground">
            Dynamic contact segments based on filter rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={handleRefreshAll}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <RefreshCwIcon className="h-4 w-4" />
              Refresh All
            </Button>
          </form>
          <Link
            href="/crm/segments/new"
            className={buttonVariants({ size: "sm" })}
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Create Segment
          </Link>
        </div>
      </div>

      {segments.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No segments yet.</p>
          <Link
            href="/crm/segments/new"
            className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-4 inline-flex"}
          >
            Create your first segment
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {segments.map((segment) => (
            <Link
              key={segment.id}
              href={`/crm/segments/${segment.id}`}
              className="block rounded-xl border bg-card px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-[family-name:var(--font-oswald)] text-lg font-medium tracking-wide">
                      {segment.name}
                    </h2>
                    {segment.is_preset && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400"
                      >
                        Preset
                      </Badge>
                    )}
                  </div>
                  {segment.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {segment.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium shrink-0">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{segment.contact_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
