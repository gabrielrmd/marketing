import { getSequences } from "@/lib/funnel/actions";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { EmailSequence, SequenceStatus, SequenceTriggerType } from "@/lib/funnel/types";

const STATUS_STYLES: Record<SequenceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const TRIGGER_LABELS: Record<SequenceTriggerType, string> = {
  manual: "Manual",
  form_submission: "Form Submission",
  tag_added: "Tag Added",
  stage_change: "Stage Change",
};

function StatusBadge({ status }: { status: SequenceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default async function SequencesPage() {
  const result = await getSequences();
  const sequences = (result.data as EmailSequence[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Email Sequences
          </h1>
          <p className="text-muted-foreground">
            Build automated email sequences triggered by contact actions.
          </p>
        </div>
        <Link
          href="/funnel/sequences/new"
          className={buttonVariants({ size: "sm" })}
        >
          New Sequence
        </Link>
      </div>

      {sequences.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No email sequences yet.</p>
          <Link
            href="/funnel/sequences/new"
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
          >
            Create your first sequence
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Trigger</th>
                <th className="px-4 py-3 text-left font-medium">Trigger Value</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sequences.map((seq) => (
                <tr key={seq.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/funnel/sequences/${seq.id}`}
                      className="hover:underline"
                    >
                      {seq.name}
                    </Link>
                    {seq.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {seq.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={seq.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TRIGGER_LABELS[seq.trigger_type]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {seq.trigger_value ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/funnel/sequences/${seq.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
