"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LandingPageEditor } from "@/components/funnel/landing-page-editor";
import { LandingPagePreview } from "@/components/funnel/landing-page-preview";
import { ABTestPanel } from "@/components/funnel/ab-test-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLandingPage, updateLandingPage, deleteLandingPage } from "@/lib/funnel/actions";
import type { LandingPage, PageBlock } from "@/lib/funnel/types";

export default function EditLandingPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [variantBBlocks, setVariantBBlocks] = useState<PageBlock[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getLandingPage(id).then((result) => {
      setLoading(false);
      if (result.error || !result.data) {
        setNotFound(true);
        return;
      }
      const lp = result.data as LandingPage;
      setPage(lp);
      setTitle(lp.title);
      setBlocks((lp.blocks as PageBlock[]) ?? []);
      setVariantBBlocks((lp.variant_b_blocks as PageBlock[]) ?? []);
    });
  }, [id]);

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateLandingPage(id, {
        title: title.trim(),
        blocks: blocks as Record<string, unknown>[],
        variant_b_blocks: variantBBlocks.length > 0
          ? (variantBBlocks as Record<string, unknown>[])
          : null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data as LandingPage);
        setSuccess(true);
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await updateLandingPage(id, { status: "published" });
      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data as LandingPage);
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await updateLandingPage(id, { status: "archived" });
      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data as LandingPage);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this landing page? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteLandingPage(id);
      if (result.error) {
        setError(result.error as string);
      } else {
        router.push("/funnel/landing-pages");
      }
    });
  }

  function handleToggleTest(active: boolean) {
    startTransition(async () => {
      const result = await updateLandingPage(id, { ab_test_active: active });
      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data as LandingPage);
      }
    });
  }

  function handleSelectWinner(winner: "a" | "b") {
    if (!confirm(`Select Variant ${winner.toUpperCase()} as the winner? This will end the A/B test.`)) return;
    startTransition(async () => {
      const result = await updateLandingPage(id, {
        winner,
        ab_test_active: false,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setPage(result.data as LandingPage);
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
        <p className="text-muted-foreground">Landing page not found.</p>
        <Button variant="outline" onClick={() => router.push("/funnel/landing-pages")}>
          Back to Landing Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Edit Landing Page
          </h1>
          <p className="text-muted-foreground">
            <a
              href={`/lp/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs hover:underline"
            >
              /lp/{page.slug}
            </a>
            {" "}
            &mdash;{" "}
            <span className="capitalize">{page.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {page.status !== "published" && (
            <Button size="sm" onClick={handlePublish} disabled={isPending}>
              Publish
            </Button>
          )}
          {page.status === "published" && (
            <Button size="sm" variant="outline" onClick={handleArchive} disabled={isPending}>
              Archive
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Changes saved successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor + Preview side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
              Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LandingPageEditor blocks={blocks} onChange={setBlocks} />
          </CardContent>
        </Card>

        <div className="space-y-2 pt-1">
          <LandingPagePreview blocks={blocks} />
        </div>
      </div>

      {/* A/B Test Panel */}
      <ABTestPanel
        page={page}
        variantBBlocks={variantBBlocks}
        onVariantBChange={setVariantBBlocks}
        onToggleTest={handleToggleTest}
        onSelectWinner={handleSelectWinner}
      />

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/funnel/landing-pages")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
