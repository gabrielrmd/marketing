import { getLandingPages } from "@/lib/funnel/actions";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { LandingPage, PageBlock } from "@/lib/funnel/types";

type FormPage = {
  id: string;
  title: string;
  submissionCount: number;
  createdAt: string;
  formBlock: PageBlock | null;
};

export default async function FormsPage() {
  const result = await getLandingPages();
  const allPages = (result.data as LandingPage[]) ?? [];

  // Forms are landing pages that contain a form block
  const formPages: FormPage[] = allPages
    .filter((page) => {
      const blocks = (page.blocks as PageBlock[]) ?? [];
      return blocks.some((b) => b.type === "form");
    })
    .map((page) => {
      const blocks = (page.blocks as PageBlock[]) ?? [];
      const formBlock = blocks.find((b) => b.type === "form") ?? null;
      return {
        id: page.id,
        title: page.title,
        submissionCount: page.conversions_a + page.conversions_b,
        createdAt: page.created_at,
        formBlock,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Forms
          </h1>
          <p className="text-muted-foreground">
            Embeddable opt-in forms with submission tracking.
          </p>
        </div>
        <Link
          href="/funnel/forms/new"
          className={buttonVariants({ size: "sm" })}
        >
          New Form
        </Link>
      </div>

      {formPages.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No forms yet.</p>
          <Link
            href="/funnel/forms/new"
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
          >
            Create your first form
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Heading</th>
                <th className="px-4 py-3 text-right font-medium tabular-nums">Submissions</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {formPages.map((form) => {
                const heading =
                  (form.formBlock?.content?.heading as string) ?? "—";
                const created = new Date(form.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/funnel/forms/${form.id}`}
                        className="hover:underline"
                      >
                        {form.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{heading}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {form.submissionCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{created}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/funnel/forms/${form.id}`}
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
