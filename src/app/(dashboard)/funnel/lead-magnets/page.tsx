import { getLeadMagnets } from "@/lib/funnel/actions";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { LeadMagnetsClient } from "./lead-magnets-client";
import type { LeadMagnet } from "@/lib/funnel/types";

export default async function LeadMagnetsPage() {
  const result = await getLeadMagnets();
  const magnets = (result.data as LeadMagnet[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Lead Magnets
          </h1>
          <p className="text-muted-foreground">
            Manage your downloadable resources and delivery emails.
          </p>
        </div>
        <Link
          href="/funnel/lead-magnets/new"
          className={buttonVariants({ size: "sm" })}
        >
          Create New
        </Link>
      </div>

      {magnets.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No lead magnets yet.</p>
          <Link
            href="/funnel/lead-magnets/new"
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
          >
            Create your first lead magnet
          </Link>
        </div>
      ) : (
        <LeadMagnetsClient initialMagnets={magnets} />
      )}
    </div>
  );
}
