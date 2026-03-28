import { getFunnelOverview } from "@/lib/funnel/actions";
import { OverviewClient } from "./overview-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function FunnelPage() {
  const result = await getFunnelOverview();

  const data = result.data ?? {
    landingPages: { total: 0, published: 0 },
    leadMagnets: { total: 0, totalDownloads: 0 },
    sequences: { active: 0 },
    formSubmissions: { total: 0 },
    contactsByStage: {},
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Funnel
          </h1>
          <p className="text-muted-foreground">
            Overview of your marketing funnel performance.
          </p>
        </div>
        <Link href="/funnel/landing-pages" className={buttonVariants({ size: "sm" })}>
          Landing Pages
        </Link>
      </div>

      <OverviewClient data={data} />
    </div>
  );
}
