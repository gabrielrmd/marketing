"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/content/content-editor";
import { ChannelSelector } from "@/components/content/channel-selector";
import { PillarSelector } from "@/components/content/pillar-selector";
import { VersionHistory } from "@/components/content/version-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateContentItem, deleteContentItem } from "@/lib/content/actions";
import { CONTENT_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ChannelId, PillarId, ContentTypeId, ContentItem, ContentVersion } from "@/lib/content/types";

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<ChannelId | null>(null);
  const [contentType, setContentType] = useState<ContentTypeId | null>(null);
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [scheduledAt, setScheduledAt] = useState("");

  // Podcast-specific fields
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestBio, setGuestBio] = useState("");
  const [showNotes, setShowNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("content_items")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          setNotFound(true);
          return;
        }
        const ci = data as ContentItem;
        setItem(ci);
        setTitle(ci.title);
        setChannel(ci.channel);
        setContentType(ci.content_type);
        setPillar(ci.pillar ?? null);
        setBody(ci.body ?? {});
        setScheduledAt(
          ci.scheduled_at ? ci.scheduled_at.slice(0, 16) : ""
        );
        setEpisodeNumber(ci.episode_number != null ? String(ci.episode_number) : "");
        setGuestName(ci.guest_name ?? "");
        setGuestBio(ci.guest_bio ?? "");
        setShowNotes(ci.show_notes ?? "");
      });
  }, [id]);

  function handleRestore(version: ContentVersion) {
    setTitle(version.title);
    setBody(version.body ?? {});
  }

  function handleSave() {
    if (!channel || !contentType) {
      setError("Please select a channel and content type.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateContentItem(id, {
        title: title.trim(),
        body,
        channel,
        content_type: contentType,
        pillar: pillar ?? null,
        scheduled_at: scheduledAt || null,
        ...(channel === "podcast"
          ? {
              episode_number: episodeNumber ? parseInt(episodeNumber, 10) : null,
              guest_name: guestName || null,
              guest_bio: guestBio || null,
              show_notes: showNotes || null,
            }
          : {
              episode_number: null,
              guest_name: null,
              guest_bio: null,
              show_notes: null,
            }),
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this content item? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteContentItem(id);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/content");
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

  if (notFound || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Content item not found.</p>
        <Button variant="outline" onClick={() => router.push("/content")}>Back to Calendar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Edit Content
          </h1>
          <p className="text-muted-foreground">Update your content item.</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
          Delete
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Content saved successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
            />
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Channel</label>
            <ChannelSelector
              value={channel}
              onChange={(c) => setChannel(channel === c ? null : c)}
            />
          </div>

          {/* Content Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setContentType(contentType === type.id ? null : (type.id as ContentTypeId))}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    contentType === type.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pillar */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pillar</label>
            <PillarSelector value={pillar} onChange={setPillar} />
          </div>
        </CardContent>
      </Card>

      {/* Podcast-specific fields */}
      {channel === "podcast" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Podcast Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Episode Number</label>
              <Input
                type="number"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                placeholder="e.g. 42"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Guest Name</label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest full name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Guest Bio</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
                value={guestBio}
                onChange={(e) => setGuestBio(e.target.value)}
                placeholder="Brief guest biography..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Show Notes</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-y"
                value={showNotes}
                onChange={(e) => setShowNotes(e.target.value)}
                placeholder="Episode show notes..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentEditor content={body} onChange={setBody} placeholder="Start writing your content..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Publish Date &amp; Time</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to save as draft.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <VersionHistory contentItemId={id} onRestore={handleRestore} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/content")} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
