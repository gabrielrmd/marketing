import { getLandingPages } from "@/lib/funnel/actions";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LandingPage, LandingPageStatus } from "@/lib/funnel/types";

function StatusBadge({ status }: { status: LandingPageStatus }) {
  const variants: Record<LandingPageStatus, string> = {
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default async function LandingPagesPage() {
  const result = await getLandingPages();
  const pages = (result.data as LandingPage[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Landing Pages
          </h1>
          <p className="text-muted-foreground">
            Build and manage your funnel landing pages.
          </p>
        </div>
        <Link href="/funnel/landing-pages/new" className={buttonVariants({ size: "sm" })}>
          New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No landing pages yet.</p>
          <Link href="/funnel/landing-pages/new" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Create your first page
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium tabular-nums">Visitors</th>
                <th className="px-4 py-3 text-right font-medium tabular-nums">Conversions</th>
                <th className="px-4 py-3 text-left font-medium">A/B</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {pages.map((page) => {
                const totalVisitors = page.visitors_a + page.visitors_b;
                const totalConversions = page.conversions_a + page.conversions_b;
                return (
                  <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/funnel/landing-pages/${page.id}`}
                        className="hover:underline"
                      >
                        {page.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/lp/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground hover:underline font-mono text-xs"
                      >
                        /lp/{page.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={page.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {totalVisitors.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {totalConversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {page.ab_test_active && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">
                          A/B
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/funnel/landing-pages/${page.id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
