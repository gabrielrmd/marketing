"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingPageEditor } from "@/components/funnel/landing-page-editor";
import { LandingPagePreview } from "@/components/funnel/landing-page-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLandingPage, getLeadMagnets } from "@/lib/funnel/actions";
import type { PageBlock, LeadMagnet } from "@/lib/funnel/types";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewLandingPagePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [leadMagnetId, setLeadMagnetId] = useState<string>("");
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [magnets, setMagnets] = useState<LeadMagnet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeadMagnets().then((result) => {
      if (result.data) setMagnets(result.data as LeadMagnet[]);
    });
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value);
  }

  function handleSave() {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!slug.trim()) {
      setError("Please enter a slug.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createLandingPage({
        title: title.trim(),
        slug: slug.trim(),
        blocks: blocks as Record<string, unknown>[],
        lead_magnet_id: leadMagnetId || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/funnel/landing-pages");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          New Landing Page
        </h1>
        <p className="text-muted-foreground">Create a new funnel landing page.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="My Landing Page"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">/lp/</span>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-landing-page"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generated from title. Edit to customise.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lead Magnet</label>
            <select
              value={leadMagnetId}
              onChange={(e) => setLeadMagnetId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {magnets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

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

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
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
