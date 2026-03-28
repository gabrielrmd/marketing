"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormBuilder, type FormConfig } from "@/components/funnel/form-builder";
import { FormEmbedCode } from "@/components/funnel/form-embed-code";
import { getLandingPage, updateLandingPage, getFormSubmissions } from "@/lib/funnel/actions";
import type { LandingPage, PageBlock, FormSubmission } from "@/lib/funnel/types";

const DEFAULT_CONFIG: FormConfig = {
  title: "",
  heading: "",
  buttonLabel: "Subscribe",
  autoTags: [],
  styleVariant: "inline",
};

function pageToConfig(page: LandingPage): FormConfig {
  const blocks = (page.blocks as PageBlock[]) ?? [];
  const formBlock = blocks.find((b) => b.type === "form");
  if (!formBlock) return { ...DEFAULT_CONFIG, title: page.title };

  const c = formBlock.content;
  return {
    title: page.title,
    heading: (c.heading as string) ?? "",
    buttonLabel: (c.buttonLabel as string) ?? "Subscribe",
    autoTags: (c.autoTags as string[]) ?? [],
    styleVariant: (c.styleVariant as FormConfig["styleVariant"]) ?? "inline",
  };
}

function configToBlocks(config: FormConfig): Record<string, unknown>[] {
  return [
    {
      id: crypto.randomUUID(),
      type: "form",
      content: {
        heading: config.heading.trim(),
        buttonLabel: config.buttonLabel.trim() || "Subscribe",
        autoTags: config.autoTags,
        styleVariant: config.styleVariant,
      },
    },
  ];
}

export default function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [page, setPage] = useState<LandingPage | null>(null);
  const [config, setConfig] = useState<FormConfig>(DEFAULT_CONFIG);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  useEffect(() => {
    Promise.all([getLandingPage(id), getFormSubmissions(id)]).then(
      ([pageResult, subsResult]) => {
        setLoading(false);

        if (pageResult.error || !pageResult.data) {
          setNotFound(true);
          return;
        }

        const lp = pageResult.data as LandingPage;
        setPage(lp);
        setConfig(pageToConfig(lp));

        if (subsResult.data) {
          setSubmissions(subsResult.data as FormSubmission[]);
        }
      }
    );
  }, [id]);

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateLandingPage(id, {
        title: config.title.trim() || page?.title,
        blocks: configToBlocks(config),
      });

      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data as LandingPage);
        setSuccess(true);
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Form not found.</p>
        <Button variant="outline" onClick={() => router.push("/funnel/forms")}>
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            {page.title}
          </h1>
          <p className="text-sm text-muted-foreground">Form ID: {id}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Form saved successfully.
        </div>
      )}

      {/* Form Builder */}
      <FormBuilder config={config} onChange={setConfig} />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Form"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/funnel/forms")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>

      {/* Embed Code */}
      <FormEmbedCode formId={id} siteUrl={siteUrl} />

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No submissions yet.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Source</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.slice(0, 50).map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs">{sub.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {sub.name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {sub.utm_source ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {new Date(sub.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {submissions.length > 50 && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                  Showing 50 of {submissions.length.toLocaleString()} submissions.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
