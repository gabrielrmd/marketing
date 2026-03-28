"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/content/content-editor";
import { ChannelSelector } from "@/components/content/channel-selector";
import { PillarSelector } from "@/components/content/pillar-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createContentItem } from "@/lib/content/actions";
import { CONTENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ChannelId, PillarId, ContentTypeId } from "@/lib/content/types";

export default function NewContentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      const result = await createContentItem({
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
          : {}),
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/content");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          New Content
        </h1>
        <p className="text-muted-foreground">Create a new piece of content for your calendar.</p>
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

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
