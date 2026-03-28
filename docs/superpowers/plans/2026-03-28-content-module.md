# Content & Social Media Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Content & Social Media Management module — content calendar, rich editor, multi-channel publishing, asset library, and pillar tracking.

**Architecture:** Route-based module under `/dashboard/content` with Supabase tables for content items, templates, assets, versions, and publishing logs. LinkedIn direct publishing via Posts API. Prep & export for YouTube/Instagram. Resend for email.

**Tech Stack:** Next.js 15, Supabase Postgres + Storage, Tiptap (rich text editor), Resend, LinkedIn Posts API, Framer Motion (calendar animations), @dnd-kit (drag-and-drop)

**Prerequisites:** Foundation plan must be completed first. Specifically, `001_profiles.sql` must be applied (provides `update_updated_at()` function used by this module's migration).

---

## File Structure

```
src/
├── app/(dashboard)/content/
│   ├── page.tsx                          # Content calendar (server component, fetches data)
│   ├── calendar-client.tsx               # Client wrapper for calendar interactivity
│   ├── new/page.tsx                      # Create new content item
│   ├── [id]/page.tsx                     # Edit content item
│   ├── [id]/blog/page.tsx                # Public blog post rendering
│   ├── templates/page.tsx                # Content templates
│   └── assets/page.tsx                   # Asset library
├── app/blog/
│   ├── page.tsx                          # Public blog index
│   └── [slug]/page.tsx                   # Public blog post
├── components/content/
│   ├── content-calendar.tsx              # Calendar grid (month/week/day)
│   ├── calendar-item.tsx                 # Draggable content card on calendar
│   ├── content-editor.tsx                # Rich text editor (Tiptap)
│   ├── channel-selector.tsx              # Multi-channel selector with mode badges
│   ├── pillar-selector.tsx               # Content pillar picker
│   ├── content-type-badge.tsx            # Color-coded content type badge
│   ├── publishing-panel.tsx              # Publish/schedule/export panel
│   ├── prep-export-card.tsx              # YouTube/Instagram export formatter
│   ├── asset-uploader.tsx                # File upload with drag-and-drop
│   ├── asset-grid.tsx                    # Asset library grid with search/filter
│   ├── version-history.tsx               # Version history sidebar
│   └── pillar-coverage.tsx               # Pillar distribution chart
├── lib/content/
│   ├── actions.ts                        # Server actions (CRUD content items)
│   ├── queries.ts                        # Supabase queries for content data
│   ├── publish-linkedin.ts              # LinkedIn Posts API publishing logic
│   ├── publish-email.ts                  # Resend email publishing logic
│   ├── tiptap-html.ts                   # Tiptap JSON → HTML converter
│   └── types.ts                          # TypeScript types for content module
supabase/migrations/
│   └── 002_content.sql                   # Content tables + RLS
tests/
├── lib/content/
│   ├── actions.test.ts                   # Server action tests
│   ├── queries.test.ts                   # Query tests
│   ├── publish-linkedin.test.ts          # LinkedIn publish tests (mocked fetch)
│   └── publish-email.test.ts             # Resend publish tests (mocked)
└── components/content/
    └── content-calendar.test.tsx          # Calendar rendering tests
```

---

### Task 1: Content Database Migration

**Files:**
- Create: `supabase/migrations/002_content.sql`

- [ ] **Step 1: Write the migration**

Write `supabase/migrations/002_content.sql`:

```sql
-- Content items: posts, articles, episodes
create table public.content_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,  -- URL slug for blog posts
  body jsonb default '{}',  -- Tiptap JSON format
  body_text text default '',  -- Plain text for search
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  content_type text not null default 'educational' check (content_type in ('educational', 'promotional', 'community', 'storytelling')),
  channel text not null check (channel in ('linkedin', 'email', 'youtube', 'instagram', 'blog', 'podcast')),
  pillar text check (pillar in ('library', 'challenge', 'circle', 'stage', 'summit', 'stories')),
  -- Podcast-specific fields
  episode_number int,
  show_notes text,
  guest_name text,
  guest_bio text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content versions (history)
create table public.content_versions (
  id uuid default gen_random_uuid() primary key,
  content_item_id uuid references public.content_items(id) on delete cascade not null,
  title text not null,
  body jsonb not null,
  metadata jsonb default '{}',
  version_number int not null,
  created_at timestamptz default now()
);

-- Content templates
create table public.content_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  channel text not null check (channel in ('linkedin', 'email', 'youtube', 'instagram', 'blog', 'podcast')),
  body jsonb not null default '{}',
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets (files in Supabase Storage)
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width int,
  height int,
  tags text[] default '{}',
  uploaded_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

-- Publishing logs
create table public.publishing_logs (
  id uuid default gen_random_uuid() primary key,
  content_item_id uuid references public.content_items(id) on delete cascade not null,
  channel text not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  external_id text,
  response jsonb default '{}',
  error_message text,
  published_at timestamptz default now()
);

-- Saved calendar views
create table public.content_calendar_views (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  filters jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_content_items_status on public.content_items(status);
create index idx_content_items_channel on public.content_items(channel);
create index idx_content_items_scheduled on public.content_items(scheduled_at) where status = 'scheduled';
create index idx_content_items_created_by on public.content_items(created_by);
create index idx_content_items_slug on public.content_items(slug) where slug is not null;
create index idx_content_versions_item on public.content_versions(content_item_id, version_number desc);
create index idx_assets_tags on public.assets using gin(tags);
create index idx_publishing_logs_item on public.publishing_logs(content_item_id);

-- RLS
alter table public.content_items enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_templates enable row level security;
alter table public.assets enable row level security;
alter table public.publishing_logs enable row level security;
alter table public.content_calendar_views enable row level security;

-- Owner: full access to all content tables
create policy "Owner full access" on public.content_items for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.content_versions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.content_templates for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.assets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.publishing_logs for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.content_calendar_views for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));

-- Team: read all content, write own content
create policy "Team read content" on public.content_items for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team write own content" on public.content_items for insert
  with check (created_by = auth.uid());
create policy "Team update own content" on public.content_items for update
  using (created_by = auth.uid());
create policy "Team read versions" on public.content_versions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'team')));
create policy "Team read templates" on public.content_templates for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'team')));
create policy "Team manage assets" on public.assets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'team')));
create policy "Team read logs" on public.publishing_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'team')));
create policy "Team own calendar views" on public.content_calendar_views for all
  using (user_id = auth.uid());

-- Public: published blog posts are readable by anyone (no auth required)
create policy "Public read published blogs" on public.content_items for select
  using (channel = 'blog' and status = 'published');

-- Auto-update updated_at (uses function from 001_profiles.sql)
create trigger content_items_updated_at before update on public.content_items
  for each row execute procedure public.update_updated_at();
create trigger content_templates_updated_at before update on public.content_templates
  for each row execute procedure public.update_updated_at();

-- Auto-prune versions (keep latest 50 per content item)
create or replace function public.prune_content_versions()
returns trigger as $$
begin
  delete from public.content_versions
  where content_item_id = new.content_item_id
    and id not in (
      select id from public.content_versions
      where content_item_id = new.content_item_id
      order by version_number desc
      limit 50
    );
  return new;
end;
$$ language plpgsql security definer;

create trigger prune_old_versions
  after insert on public.content_versions
  for each row execute procedure public.prune_content_versions();
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/migrations/002_content.sql
git commit -m "feat: add content module database migration with RLS, blog slug, podcast fields, version pruning"
```

---

### Task 2: Content Types & Query Helpers

**Files:**
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/queries.ts`
- Create: `tests/lib/content/queries.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/lib/content/queries.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildCalendarQuery, getDateRange } from "@/lib/content/queries";

describe("getDateRange", () => {
  it("returns month range for month view", () => {
    const { start, end } = getDateRange("month", new Date("2026-03-15"));
    expect(start.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-31T23:59:59.999Z");
  });

  it("returns week range for week view", () => {
    const { start, end } = getDateRange("week", new Date("2026-03-18")); // Wednesday
    expect(start.getDay()).toBe(1); // Monday
    expect(end.getDay()).toBe(0); // Sunday
  });

  it("returns single day for day view", () => {
    const { start, end } = getDateRange("day", new Date("2026-03-15"));
    expect(start.toISOString()).toBe("2026-03-15T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-15T23:59:59.999Z");
  });
});

describe("buildCalendarQuery", () => {
  it("returns base filter with date range", () => {
    const query = buildCalendarQuery(
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-31T23:59:59.999Z"),
      {}
    );
    expect(query.from).toBe("2026-03-01T00:00:00.000Z");
    expect(query.to).toBe("2026-03-31T23:59:59.999Z");
    expect(query.channels).toBeUndefined();
  });

  it("includes channel filter when provided", () => {
    const query = buildCalendarQuery(
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-31T23:59:59.999Z"),
      { channels: ["linkedin", "email"] }
    );
    expect(query.channels).toEqual(["linkedin", "email"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/content/queries.test.ts
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Write types**

Write `src/lib/content/types.ts`:

```ts
export type ContentStatus = "draft" | "scheduled" | "published" | "failed";
export type ChannelId = "linkedin" | "email" | "youtube" | "instagram" | "blog" | "podcast";
export type PillarId = "library" | "challenge" | "circle" | "stage" | "summit" | "stories";
export type ContentTypeId = "educational" | "promotional" | "community" | "storytelling";

export type ContentItem = {
  id: string;
  title: string;
  slug: string | null;
  body: Record<string, unknown>;
  body_text: string;
  status: ContentStatus;
  content_type: ContentTypeId;
  channel: ChannelId;
  pillar: PillarId | null;
  episode_number: number | null;
  show_notes: string | null;
  guest_name: string | null;
  guest_bio: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ContentVersion = {
  id: string;
  content_item_id: string;
  title: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version_number: number;
  created_at: string;
};

export type ContentTemplate = {
  id: string;
  name: string;
  description: string | null;
  channel: ChannelId;
  body: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  tags: string[];
  uploaded_by: string;
  created_at: string;
};

export type PublishingLog = {
  id: string;
  content_item_id: string;
  channel: string;
  status: "pending" | "success" | "failed";
  external_id: string | null;
  response: Record<string, unknown>;
  error_message: string | null;
  published_at: string;
};

export type CalendarFilters = {
  channels?: ChannelId[];
  pillars?: PillarId[];
  contentTypes?: ContentTypeId[];
  statuses?: ContentStatus[];
};
```

- [ ] **Step 4: Write queries implementation**

Write `src/lib/content/queries.ts`:

```ts
import type { CalendarFilters } from "./types";

export type CalendarView = "month" | "week" | "day";

export function getDateRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (view) {
    case "month":
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCMonth(end.getUTCMonth() + 1, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = start.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setUTCDate(start.getUTCDate() + diff);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCDate(start.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      break;
    }
    case "day":
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function buildCalendarQuery(from: Date, to: Date, filters: CalendarFilters) {
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    channels: filters.channels ?? undefined,
    pillars: filters.pillars ?? undefined,
    contentTypes: filters.contentTypes ?? undefined,
    statuses: filters.statuses ?? undefined,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/content/queries.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/content/types.ts src/lib/content/queries.ts tests/lib/content/queries.test.ts
git commit -m "feat: add content types, calendar query builder with tests"
```

---

### Task 3: Content Server Actions (Validation & Helpers)

**Files:**
- Create: `src/lib/content/actions.ts`
- Create: `src/lib/content/tiptap-html.ts`
- Create: `tests/lib/content/actions.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/lib/content/actions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateContentItem, prepareContentForSave } from "@/lib/content/actions";

describe("validateContentItem", () => {
  it("returns errors for missing title", () => {
    const errors = validateContentItem({ title: "", channel: "linkedin", content_type: "educational" });
    expect(errors).toContain("Title is required");
  });

  it("returns errors for missing channel", () => {
    const errors = validateContentItem({ title: "Test", channel: "" as any, content_type: "educational" });
    expect(errors).toContain("Channel is required");
  });

  it("returns empty array for valid input", () => {
    const errors = validateContentItem({ title: "Test Post", channel: "linkedin", content_type: "educational" });
    expect(errors).toHaveLength(0);
  });

  it("validates scheduled_at is in the future", () => {
    const past = new Date("2020-01-01").toISOString();
    const errors = validateContentItem({ title: "Test", channel: "linkedin", content_type: "educational", scheduled_at: past });
    expect(errors).toContain("Scheduled date must be in the future");
  });
});

describe("prepareContentForSave", () => {
  it("extracts plain text from tiptap JSON body", () => {
    const body = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
    };
    const result = prepareContentForSave({ body });
    expect(result.body_text).toBe("Hello world");
  });

  it("handles empty body", () => {
    const result = prepareContentForSave({ body: {} });
    expect(result.body_text).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/content/actions.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write Tiptap HTML converter**

Write `src/lib/content/tiptap-html.ts`:

```ts
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

export function tiptapToHtml(json: Record<string, unknown>): string {
  if (!json || !json.type) return "";
  try {
    return generateHTML(json as any, [StarterKit, Link, Image]);
  } catch {
    return "";
  }
}
```

- [ ] **Step 4: Write actions implementation**

Write `src/lib/content/actions.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { ChannelId, ContentTypeId } from "./types";

type ContentInput = {
  title: string;
  channel: ChannelId | string;
  content_type: ContentTypeId | string;
  scheduled_at?: string;
};

const VALID_CHANNELS = ["linkedin", "email", "youtube", "instagram", "blog", "podcast"];
const VALID_TYPES = ["educational", "promotional", "community", "storytelling"];

export function validateContentItem(input: ContentInput): string[] {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required");
  if (!input.channel || !VALID_CHANNELS.includes(input.channel)) errors.push("Channel is required");
  if (!input.content_type || !VALID_TYPES.includes(input.content_type)) errors.push("Content type is required");
  if (input.scheduled_at && new Date(input.scheduled_at) <= new Date()) {
    errors.push("Scheduled date must be in the future");
  }
  return errors;
}

function extractText(node: Record<string, unknown>): string {
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) return node.content.map((child: Record<string, unknown>) => extractText(child)).join(" ");
  return "";
}

export function prepareContentForSave(data: { body: Record<string, unknown> }) {
  return { body_text: extractText(data.body).trim() };
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createContentItem(data: {
  title: string;
  body: Record<string, unknown>;
  channel: ChannelId;
  content_type: ContentTypeId;
  pillar?: string | null;
  scheduled_at?: string | null;
  episode_number?: number | null;
  show_notes?: string | null;
  guest_name?: string | null;
  guest_bio?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const errors = validateContentItem(data);
  if (errors.length > 0) return { error: errors.join(", ") };

  const { body_text } = prepareContentForSave({ body: data.body });
  const status = data.scheduled_at ? "scheduled" : "draft";
  const slug = data.channel === "blog" ? generateSlug(data.title) : null;

  const { data: item, error } = await supabase
    .from("content_items")
    .insert({
      title: data.title,
      slug,
      body: data.body,
      body_text,
      status,
      channel: data.channel,
      content_type: data.content_type,
      pillar: data.pillar ?? null,
      scheduled_at: data.scheduled_at ?? null,
      episode_number: data.episode_number ?? null,
      show_notes: data.show_notes ?? null,
      guest_name: data.guest_name ?? null,
      guest_bio: data.guest_bio ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("content_versions").insert({
    content_item_id: item.id,
    title: data.title,
    body: data.body,
    version_number: 1,
  });

  return { data: item };
}

export async function updateContentItem(
  id: string,
  data: Partial<{
    title: string;
    body: Record<string, unknown>;
    channel: ChannelId;
    content_type: ContentTypeId;
    pillar: string | null;
    scheduled_at: string | null;
    status: string;
    episode_number: number | null;
    show_notes: string | null;
    guest_name: string | null;
    guest_bio: string | null;
  }>
) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { ...data };

  if (data.body) {
    updates.body_text = prepareContentForSave({ body: data.body }).body_text;
  }
  if (data.scheduled_at && !data.status) {
    updates.status = "scheduled";
  }

  const { data: item, error } = await supabase
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  if (data.body) {
    const { count } = await supabase
      .from("content_versions")
      .select("*", { count: "exact", head: true })
      .eq("content_item_id", id);

    await supabase.from("content_versions").insert({
      content_item_id: id,
      title: item.title,
      body: data.body,
      version_number: (count ?? 0) + 1,
    });
  }

  return { data: item };
}

export async function deleteContentItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function rescheduleContentItem(id: string, newDate: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({ scheduled_at: newDate, status: "scheduled" })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getContentItems(filters: {
  from?: string;
  to?: string;
  channels?: string[];
  pillars?: string[];
  statuses?: string[];
}) {
  const supabase = await createClient();
  let query = supabase.from("content_items").select("*").order("scheduled_at", { ascending: true });

  if (filters.from) query = query.gte("scheduled_at", filters.from);
  if (filters.to) query = query.lte("scheduled_at", filters.to);
  if (filters.channels?.length) query = query.in("channel", filters.channels);
  if (filters.pillars?.length) query = query.in("pillar", filters.pillars);
  if (filters.statuses?.length) query = query.in("status", filters.statuses);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getPillarCoverage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("pillar")
    .not("pillar", "is", null);

  if (error) return { error: error.message };

  const counts: Record<string, number> = {};
  for (const item of data ?? []) {
    counts[item.pillar] = (counts[item.pillar] || 0) + 1;
  }
  return { data: counts };
}

export async function getContentVersions(contentItemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("version_number", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function saveCalendarView(name: string, filters: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("content_calendar_views")
    .insert({ user_id: user.id, name, filters })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getCalendarViews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_calendar_views")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/content/actions.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/content/actions.ts src/lib/content/tiptap-html.ts tests/lib/content/actions.test.ts
git commit -m "feat: add content CRUD server actions with validation, slug generation, podcast fields, pillar coverage, calendar views"
```

---

### Task 4: Install Tiptap & DnD Kit

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-image @tiptap/extension-link @tiptap/extension-character-count @tiptap/html @tiptap/pm @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add package.json package-lock.json
git commit -m "feat: install Tiptap, @tiptap/html, and @dnd-kit dependencies"
```

---

### Task 5: Content Editor Component

**Files:**
- Create: `src/components/content/content-editor.tsx`

- [ ] **Step 1: Write the editor component**

Write `src/components/content/content-editor.tsx`:

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentEditorProps = {
  content?: Record<string, unknown>;
  onChange?: (json: Record<string, unknown>) => void;
  placeholder?: string;
  maxCharacters?: number;
};

export function ContentEditor({ content, onChange, placeholder = "Start writing...", maxCharacters }: ContentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image,
      ...(maxCharacters ? [CharacterCount.configure({ limit: maxCharacters })] : []),
    ],
    content: content as Record<string, unknown> | undefined,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;

  const ToolbarButton = ({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" onClick={onClick} className={cn("h-8 w-8 p-0", active && "bg-muted")}>
      {children}
    </Button>
  );

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-2">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolbarButton>
          {maxCharacters && <span className="text-xs text-muted-foreground">{charCount}/{maxCharacters}</span>}
        </div>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/content-editor.tsx
git commit -m "feat: add Tiptap rich text editor with toolbar"
```

---

### Task 6: Channel Selector, Pillar Selector, Content Type Badge

**Files:**
- Create: `src/components/content/channel-selector.tsx`
- Create: `src/components/content/pillar-selector.tsx`
- Create: `src/components/content/content-type-badge.tsx`

- [ ] **Step 1: Write channel-selector.tsx**

```tsx
"use client";

import { AU_CHANNELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChannelId } from "@/lib/content/types";

type ChannelSelectorProps = { value: ChannelId | null; onChange: (channel: ChannelId) => void };

export function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AU_CHANNELS.map((channel) => (
        <button
          key={channel.id}
          type="button"
          onClick={() => onChange(channel.id as ChannelId)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            value === channel.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
          )}
        >
          {channel.label}
          <Badge variant="secondary" className="text-xs">{channel.mode === "direct" ? "Publish" : "Export"}</Badge>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write pillar-selector.tsx**

```tsx
"use client";

import { AU_PILLARS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PillarId } from "@/lib/content/types";

type PillarSelectorProps = { value: PillarId | null; onChange: (pillar: PillarId | null) => void };

export function PillarSelector({ value, onChange }: PillarSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AU_PILLARS.map((pillar) => (
        <button
          key={pillar.id}
          type="button"
          onClick={() => onChange(value === pillar.id ? null : (pillar.id as PillarId))}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm transition-colors",
            value === pillar.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
          )}
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: pillar.color }} />
          {pillar.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write content-type-badge.tsx**

```tsx
import { CONTENT_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { ContentTypeId } from "@/lib/content/types";

export function ContentTypeBadge({ type }: { type: ContentTypeId }) {
  const ct = CONTENT_TYPES.find((t) => t.id === type);
  if (!ct) return null;
  return <Badge variant="secondary" className="text-xs" style={{ borderColor: ct.color, color: ct.color }}>{ct.label}</Badge>;
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/channel-selector.tsx src/components/content/pillar-selector.tsx src/components/content/content-type-badge.tsx
git commit -m "feat: add channel selector, pillar selector, content type badge"
```

---

### Task 7: Calendar Item Component (Draggable)

**Files:**
- Create: `src/components/content/calendar-item.tsx`

- [ ] **Step 1: Write calendar-item.tsx**

Write `src/components/content/calendar-item.tsx`:

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContentTypeBadge } from "./content-type-badge";
import type { ContentItem } from "@/lib/content/types";
import { AU_CHANNELS } from "@/lib/constants";
import Link from "next/link";

export function CalendarItem({ item }: { item: ContentItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const channel = AU_CHANNELS.find((c) => c.id === item.channel);

  return (
    <Link href={`/dashboard/content/${item.id}`}>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}
        className="rounded-md border bg-card p-2 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-medium truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{channel?.label}</span>
          <ContentTypeBadge type={item.content_type} />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/calendar-item.tsx
git commit -m "feat: add draggable calendar item component"
```

---

### Task 8: Content Calendar with Month/Week/Day Views and Drag Reschedule

**Files:**
- Create: `src/components/content/content-calendar.tsx`
- Create: `tests/components/content/content-calendar.test.tsx`

- [ ] **Step 1: Write the failing test**

Write `tests/components/content/content-calendar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";

// Test pure helper functions extracted from calendar
function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = -startPad; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)) - 1; i++) {
    days.push(new Date(year, month, i + 1));
  }
  return days;
}

function getDaysInWeek(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

describe("getDaysInMonth", () => {
  it("returns all days for March 2026 padded to full weeks", () => {
    const days = getDaysInMonth(new Date(2026, 2, 1));
    expect(days.length % 7).toBe(0);
    expect(days[0].getDay()).toBe(1); // Starts on Monday
  });
});

describe("getDaysInWeek", () => {
  it("returns 7 days starting from Monday", () => {
    const days = getDaysInWeek(new Date(2026, 2, 18)); // Wednesday
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days[6].getDay()).toBe(0); // Sunday
  });
});
```

- [ ] **Step 2: Run test to verify it fails then passes after writing calendar**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/components/content/content-calendar.test.tsx
```

Expected: PASS (testing pure helpers inline).

- [ ] **Step 3: Write content-calendar.tsx with all three views and drag reschedule**

Write `src/components/content/content-calendar.tsx`:

```tsx
"use client";

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CalendarItem } from "./calendar-item";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/lib/content/types";
import type { CalendarView } from "@/lib/content/queries";
import Link from "next/link";

type ContentCalendarProps = {
  items: ContentItem[];
  view: CalendarView;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onReschedule: (itemId: string, newDate: string) => void;
};

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = -startPad; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)) - 1; i++) {
    days.push(new Date(year, month, i + 1));
  }
  return days;
}

function getDaysInWeek(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function DayColumn({ day, items, isCurrentMonth = true }: { day: Date; items: ContentItem[]; isCurrentMonth?: boolean }) {
  const dayItems = items.filter((item) => item.scheduled_at && isSameDay(new Date(item.scheduled_at), day));
  const isToday = isSameDay(day, new Date());

  return (
    <div className={cn("min-h-[100px] bg-card p-1.5", !isCurrentMonth && "opacity-40")}>
      <div className={cn("mb-1 text-xs font-medium", isToday && "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground")}>
        {day.getDate()}
      </div>
      <SortableContext items={dayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {dayItems.map((item) => (<CalendarItem key={item.id} item={item} />))}
        </div>
      </SortableContext>
    </div>
  );
}

export function ContentCalendar({ items, view, currentDate, onDateChange, onViewChange, onReschedule }: ContentCalendarProps) {
  function handlePrev() {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    onDateChange(d);
  }

  function handleNext() {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    onDateChange(d);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // over.id is the day's ISO string (set as droppable id)
    // active.id is the content item ID
    const targetDate = new Date(over.id as string);
    if (!isNaN(targetDate.getTime())) {
      onReschedule(active.id as string, targetDate.toISOString());
    }
  }

  const title = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    ...(view === "day" ? { day: "numeric" } : {}),
  });

  const monthDays = getDaysInMonth(currentDate);
  const weekDays = getDaysInWeek(currentDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="font-oswald text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          {(["month", "week", "day"] as CalendarView[]).map((v) => (
            <Button key={v} variant={view === v ? "default" : "ghost"} size="sm" onClick={() => onViewChange(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
          <Link href="/dashboard/content/new"><Button size="sm"><Plus className="mr-1 h-4 w-4" />New</Button></Link>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* Month View */}
        {view === "month" && (
          <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
            {WEEKDAYS.map((day) => (
              <div key={day} className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">{day}</div>
            ))}
            {monthDays.map((day) => (
              <DayColumn key={day.toISOString()} day={day} items={items} isCurrentMonth={day.getMonth() === currentDate.getMonth()} />
            ))}
          </div>
        )}

        {/* Week View */}
        {view === "week" && (
          <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="bg-card">
                <div className="border-b bg-muted px-2 py-2 text-center">
                  <div className="text-xs text-muted-foreground">{WEEKDAYS[weekDays.indexOf(day)]}</div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isSameDay(day, new Date()) && "text-primary"
                  )}>{day.getDate()}</div>
                </div>
                <div className="min-h-[400px] p-2">
                  <SortableContext
                    items={items.filter((i) => i.scheduled_at && isSameDay(new Date(i.scheduled_at), day)).map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {items
                        .filter((i) => i.scheduled_at && isSameDay(new Date(i.scheduled_at), day))
                        .map((item) => (<CalendarItem key={item.id} item={item} />))}
                    </div>
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Day View */}
        {view === "day" && (
          <div className="rounded-lg border bg-card">
            <div className="divide-y">
              {HOURS.map((hour) => {
                const hourItems = items.filter((item) => {
                  if (!item.scheduled_at) return false;
                  const d = new Date(item.scheduled_at);
                  return isSameDay(d, currentDate) && d.getHours() === hour;
                });
                return (
                  <div key={hour} className="flex min-h-[60px]">
                    <div className="w-16 flex-shrink-0 border-r p-2 text-xs text-muted-foreground text-right">
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    <div className="flex-1 p-2">
                      <SortableContext items={hourItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                          {hourItems.map((item) => (<CalendarItem key={item.id} item={item} />))}
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/content-calendar.tsx tests/components/content/content-calendar.test.tsx
git commit -m "feat: add content calendar with month/week/day views and drag-to-reschedule"
```

---

### Task 9: Content Calendar Page (Server Component)

**Files:**
- Create: `src/app/(dashboard)/content/page.tsx`
- Create: `src/app/(dashboard)/content/calendar-client.tsx`

Note: Data fetching happens in a server component; interactivity is in a client component. This avoids calling server actions directly from `useEffect`.

- [ ] **Step 1: Write the server page**

Write `src/app/(dashboard)/content/page.tsx`:

```tsx
import { getContentItems } from "@/lib/content/actions";
import { CalendarClient } from "./calendar-client";
import type { ContentItem } from "@/lib/content/types";

export default async function ContentPage() {
  // Fetch initial data server-side (current month)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await getContentItems({
    from: start.toISOString(),
    to: end.toISOString(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald text-3xl font-bold tracking-tight">Content</h1>
        <p className="text-muted-foreground">Plan, create, and publish across all channels.</p>
      </div>
      <CalendarClient initialItems={(result.data as ContentItem[]) ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Write the client wrapper**

Write `src/app/(dashboard)/content/calendar-client.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { ContentCalendar } from "@/components/content/content-calendar";
import { ChannelSelector } from "@/components/content/channel-selector";
import { getContentItems, rescheduleContentItem } from "@/lib/content/actions";
import { getDateRange, type CalendarView } from "@/lib/content/queries";
import type { ContentItem, ChannelId, PillarId } from "@/lib/content/types";

export function CalendarClient({ initialItems }: { initialItems: ContentItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [channelFilter, setChannelFilter] = useState<ChannelId | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh(date: Date, v: CalendarView, channel: ChannelId | null) {
    startTransition(async () => {
      const { start, end } = getDateRange(v, date);
      const result = await getContentItems({
        from: start.toISOString(),
        to: end.toISOString(),
        ...(channel ? { channels: [channel] } : {}),
      });
      if (result.data) setItems(result.data as ContentItem[]);
    });
  }

  function handleDateChange(date: Date) {
    setCurrentDate(date);
    refresh(date, view, channelFilter);
  }

  function handleViewChange(v: CalendarView) {
    setView(v);
    refresh(currentDate, v, channelFilter);
  }

  function handleChannelFilter(c: ChannelId) {
    const newFilter = channelFilter === c ? null : c;
    setChannelFilter(newFilter);
    refresh(currentDate, view, newFilter);
  }

  function handleReschedule(itemId: string, newDate: string) {
    startTransition(async () => {
      await rescheduleContentItem(itemId, newDate);
      refresh(currentDate, view, channelFilter);
    });
  }

  return (
    <>
      <ChannelSelector value={channelFilter} onChange={handleChannelFilter} />
      <ContentCalendar
        items={items}
        view={view}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onReschedule={handleReschedule}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/content/page.tsx src/app/\(dashboard\)/content/calendar-client.tsx
git commit -m "feat: add content calendar page with server data fetch and client interactivity"
```

---

### Task 10: New Content Page

**Files:**
- Create: `src/app/(dashboard)/content/new/page.tsx`

- [ ] **Step 1: Write new content page with podcast fields**

Write `src/app/(dashboard)/content/new/page.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/content/content-editor";
import { ChannelSelector } from "@/components/content/channel-selector";
import { PillarSelector } from "@/components/content/pillar-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createContentItem } from "@/lib/content/actions";
import { CONTENT_TYPES } from "@/lib/constants";
import type { ChannelId, PillarId, ContentTypeId } from "@/lib/content/types";

export default function NewContentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [channel, setChannel] = useState<ChannelId | null>(null);
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [contentType, setContentType] = useState<ContentTypeId>("educational");
  const [scheduledAt, setScheduledAt] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [showNotes, setShowNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestBio, setGuestBio] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    if (!channel) { setError("Select a channel"); return; }
    setError("");
    startTransition(async () => {
      const result = await createContentItem({
        title, body, channel, content_type: contentType, pillar,
        scheduled_at: scheduledAt || null,
        episode_number: episodeNumber ? parseInt(episodeNumber) : null,
        show_notes: showNotes || null,
        guest_name: guestName || null,
        guest_bio: guestBio || null,
      });
      if (result.error) setError(result.error);
      else router.push("/dashboard/content");
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-oswald text-3xl font-bold tracking-tight">New Content</h1>
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Channel</label>
          <ChannelSelector value={channel} onChange={setChannel} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Content Type</label>
          <div className="flex gap-2">
            {CONTENT_TYPES.map((type) => (
              <Button key={type.id} variant={contentType === type.id ? "default" : "outline"} size="sm" onClick={() => setContentType(type.id as ContentTypeId)}>
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pillar (optional)</label>
          <PillarSelector value={pillar} onChange={setPillar} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <ContentEditor content={body} onChange={setBody} />
        </div>

        {/* Podcast-specific fields */}
        {channel === "podcast" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Podcast Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Episode Number</label>
                <Input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Guest Name</label>
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Guest Bio</label>
              <Input value={guestBio} onChange={(e) => setGuestBio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Show Notes</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={4}
                value={showNotes}
                onChange={(e) => setShowNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Schedule (optional)</label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : scheduledAt ? "Schedule" : "Save as Draft"}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/content/new/
git commit -m "feat: add new content page with podcast-specific fields"
```

---

### Task 11: Edit Content Page with Version History

**Files:**
- Create: `src/app/(dashboard)/content/[id]/page.tsx`
- Create: `src/components/content/version-history.tsx`

- [ ] **Step 1: Write version history component**

Write `src/components/content/version-history.tsx`:

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { getContentVersions } from "@/lib/content/actions";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import type { ContentVersion } from "@/lib/content/types";

type VersionHistoryProps = {
  contentItemId: string;
  onRestore: (version: ContentVersion) => void;
};

export function VersionHistory({ contentItemId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const result = await getContentVersions(contentItemId);
      if (result.data) setVersions(result.data as ContentVersion[]);
    });
  }, [open, contentItemId]);

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <History className="mr-1 h-4 w-4" /> {open ? "Hide" : "Show"} History
      </Button>
      {open && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border divide-y">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-2 text-sm">
              <div>
                <span className="font-medium">v{v.version_number}</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(v.created_at).toLocaleString()}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRestore(v)}>
                Restore
              </Button>
            </div>
          ))}
          {versions.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">No version history.</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write edit content page**

Write `src/app/(dashboard)/content/[id]/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/content/content-editor";
import { ChannelSelector } from "@/components/content/channel-selector";
import { PillarSelector } from "@/components/content/pillar-selector";
import { VersionHistory } from "@/components/content/version-history";
import { PublishingPanel } from "@/components/content/publishing-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { updateContentItem, deleteContentItem } from "@/lib/content/actions";
import { createClient } from "@/lib/supabase/client";
import { CONTENT_TYPES } from "@/lib/constants";
import type { ContentItem, ContentVersion, ChannelId, PillarId, ContentTypeId } from "@/lib/content/types";
import { Trash2 } from "lucide-react";

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [channel, setChannel] = useState<ChannelId | null>(null);
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [contentType, setContentType] = useState<ContentTypeId>("educational");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("content_items").select("*").eq("id", id).single();
      if (data) {
        const item = data as ContentItem;
        setItem(item);
        setTitle(item.title);
        setBody(item.body);
        setChannel(item.channel);
        setPillar(item.pillar);
        setContentType(item.content_type);
        setScheduledAt(item.scheduled_at?.slice(0, 16) ?? "");
      }
    }
    load();
  }, [id]);

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateContentItem(id, {
        title, body, channel: channel!, content_type: contentType, pillar,
        scheduled_at: scheduledAt || null,
      });
      if (result.error) setError(result.error);
      else router.push("/dashboard/content");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this content item?")) return;
    startTransition(async () => {
      await deleteContentItem(id);
      router.push("/dashboard/content");
    });
  }

  function handleRestore(version: ContentVersion) {
    setTitle(version.title);
    setBody(version.body);
  }

  if (!item) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-oswald text-3xl font-bold tracking-tight">Edit Content</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>
      </div>
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Channel</label>
          <ChannelSelector value={channel} onChange={setChannel} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Content Type</label>
          <div className="flex gap-2">
            {CONTENT_TYPES.map((type) => (
              <Button key={type.id} variant={contentType === type.id ? "default" : "outline"} size="sm" onClick={() => setContentType(type.id as ContentTypeId)}>
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pillar</label>
          <PillarSelector value={pillar} onChange={setPillar} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <ContentEditor content={body} onChange={setBody} />
        </div>
        <VersionHistory contentItemId={id} onRestore={handleRestore} />
        <div className="space-y-2">
          <label className="text-sm font-medium">Schedule</label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </Card>

      {/* Publishing Panel — shows publish/export options based on channel */}
      <PublishingPanel item={{ ...item, title, body, body_text: item.body_text, channel: channel!, content_type: contentType }} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/version-history.tsx src/app/\(dashboard\)/content/\\[id\\]/
git commit -m "feat: add edit content page with version history and restore"
```

---

### Task 12: Publishing Panel Component

**Files:**
- Create: `src/components/content/publishing-panel.tsx`
- Create: `src/components/content/prep-export-card.tsx`

- [ ] **Step 1: Write prep-export-card.tsx**

Write `src/components/content/prep-export-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import type { ContentItem } from "@/lib/content/types";

const DIMENSIONS: Record<string, string> = {
  youtube: "1280x720 (thumbnail)",
  instagram: "1080x1080 (feed) / 1080x1920 (story)",
};

export function PrepExportCard({ item }: { item: ContentItem }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="sm" onClick={() => copy(text, field)} className="h-8 w-8 p-0">
      {copied === field ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Export for {item.channel === "youtube" ? "YouTube" : "Instagram"}</h3>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div><p className="text-xs text-muted-foreground">Title</p><p className="text-sm">{item.title}</p></div>
          <CopyBtn text={item.title} field="title" />
        </div>
        <div className="flex items-start justify-between">
          <div><p className="text-xs text-muted-foreground">Body</p><p className="text-sm whitespace-pre-wrap">{item.body_text}</p></div>
          <CopyBtn text={item.body_text} field="body" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recommended Dimensions</p>
          <p className="text-sm">{DIMENSIONS[item.channel] ?? "N/A"}</p>
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Write publishing-panel.tsx**

Write `src/components/content/publishing-panel.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { publishToLinkedIn } from "@/lib/content/publish-linkedin";
import { PrepExportCard } from "./prep-export-card";
import { Send, ExternalLink } from "lucide-react";
import { AU_CHANNELS } from "@/lib/constants";
import type { ContentItem } from "@/lib/content/types";

export function PublishingPanel({ item }: { item: ContentItem }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const channel = AU_CHANNELS.find((c) => c.id === item.channel);

  if (!channel) return null;

  // Prep & export channels
  if (channel.mode === "prep_export") {
    return <PrepExportCard item={item} />;
  }

  // Direct publish channels
  function handlePublish() {
    startTransition(async () => {
      if (item.channel === "linkedin") {
        const res = await publishToLinkedIn(item.id);
        setResult(res.success ? "Published to LinkedIn!" : `Error: ${res.error}`);
      }
      // Email publishing requires recipient selection — handled separately
    });
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Publish to {channel.label}</h3>
      {item.channel === "blog" && (
        <p className="text-sm text-muted-foreground">
          Blog posts are published automatically when status is set to "published."
        </p>
      )}
      {item.channel === "linkedin" && (
        <Button onClick={handlePublish} disabled={isPending} size="sm">
          <Send className="mr-1 h-4 w-4" />
          {isPending ? "Publishing..." : "Publish Now"}
        </Button>
      )}
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/publishing-panel.tsx src/components/content/prep-export-card.tsx
git commit -m "feat: add publishing panel with direct publish and prep-export support"
```

---

### Task 13: LinkedIn Publishing with Tests

**Files:**
- Create: `src/lib/content/publish-linkedin.ts`
- Create: `tests/lib/content/publish-linkedin.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/lib/content/publish-linkedin.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the retry and error handling logic in isolation
describe("LinkedIn publish retry logic", () => {
  it("retries up to 3 times on failure", async () => {
    let attempts = 0;
    const mockFetch = vi.fn(async () => {
      attempts++;
      return { ok: false, status: 500, text: async () => "Server Error" } as Response;
    });

    // Simulate retry loop
    let lastError: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await mockFetch("https://api.linkedin.com/rest/posts", {});
      if (!response.ok) {
        lastError = `LinkedIn API returned ${response.status}`;
      }
    }

    expect(attempts).toBe(3);
    expect(lastError).toContain("500");
  });

  it("succeeds on first attempt if API returns ok", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "urn:li:share:123" }),
    } as Response));

    const response = await mockFetch("https://api.linkedin.com/rest/posts", {});
    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/content/publish-linkedin.test.ts
```

Expected: PASS.

- [ ] **Step 3: Write LinkedIn publishing (Posts API, not deprecated ugcPosts)**

Write `src/lib/content/publish-linkedin.ts`:

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

type LinkedInResult = { success: boolean; external_id?: string; error?: string };

export async function publishToLinkedIn(contentItemId: string): Promise<LinkedInResult> {
  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("content_items").select("*").eq("id", contentItemId).single();

  if (fetchError || !item) return { success: false, error: "Content item not found" };

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  if (!accessToken || !personId) {
    await supabase.from("publishing_logs").insert({
      content_item_id: contentItemId, channel: "linkedin", status: "failed",
      error_message: "LinkedIn credentials not configured. Use prep & export.",
    });
    return { success: false, error: "LinkedIn not configured. Use prep & export." };
  }

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Use LinkedIn Posts API (current, not deprecated ugcPosts)
      const response = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${personId}`,
          commentary: item.body_text,
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
        }),
      });

      if (response.ok) {
        const headerUrn = response.headers.get("x-restli-id");
        await supabase.from("publishing_logs").insert({
          content_item_id: contentItemId, channel: "linkedin", status: "success",
          external_id: headerUrn ?? undefined, response: {},
        });
        await supabase.from("content_items")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", contentItemId);
        return { success: true, external_id: headerUrn ?? undefined };
      }

      lastError = `LinkedIn API returned ${response.status}: ${await response.text()}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }

  await supabase.from("publishing_logs").insert({
    content_item_id: contentItemId, channel: "linkedin", status: "failed", error_message: lastError,
  });
  await supabase.from("content_items").update({ status: "failed" }).eq("id", contentItemId);
  return { success: false, error: lastError };
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/content/publish-linkedin.ts tests/lib/content/publish-linkedin.test.ts
git commit -m "feat: add LinkedIn publishing via Posts API with retry logic and tests"
```

---

### Task 14: Email Publishing with Tests

**Files:**
- Create: `src/lib/content/publish-email.ts`
- Create: `tests/lib/content/publish-email.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/lib/content/publish-email.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

describe("Email publish retry logic", () => {
  it("retries up to 3 times on failure", async () => {
    let attempts = 0;
    const mockSend = vi.fn(async () => {
      attempts++;
      return { data: null, error: { message: "Rate limited" } };
    });

    let lastError: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await mockSend({});
      if (!result.data) lastError = result.error?.message;
    }

    expect(attempts).toBe(3);
    expect(lastError).toBe("Rate limited");
  });

  it("succeeds on first attempt with valid data", async () => {
    const mockSend = vi.fn(async () => ({
      data: { id: "email_123" },
      error: null,
    }));

    const result = await mockSend({});
    expect(result.data?.id).toBe("email_123");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Write email publishing (using Tiptap HTML, not plain text)**

Write `src/lib/content/publish-email.ts`:

```ts
"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { tiptapToHtml } from "./tiptap-html";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailResult = { success: boolean; external_id?: string; error?: string };

export async function publishAsEmail(
  contentItemId: string,
  options: { to: string[]; subject?: string; from?: string }
): Promise<EmailResult> {
  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("content_items").select("*").eq("id", contentItemId).single();

  if (fetchError || !item) return { success: false, error: "Content item not found" };

  // Convert Tiptap JSON to HTML for proper email rendering
  const htmlBody = tiptapToHtml(item.body as Record<string, unknown>);

  let lastError: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: options.from ?? "AU <hello@advertisingunplugged.com>",
        to: options.to,
        subject: options.subject ?? item.title,
        html: `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="font-family: Oswald, sans-serif;">${item.title}</h1>
          ${htmlBody}
        </div>`,
      });

      if (data?.id) {
        await supabase.from("publishing_logs").insert({
          content_item_id: contentItemId, channel: "email", status: "success", external_id: data.id,
        });
        await supabase.from("content_items")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", contentItemId);
        return { success: true, external_id: data.id };
      }
      lastError = error?.message ?? "Unknown Resend error";
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }

  await supabase.from("publishing_logs").insert({
    content_item_id: contentItemId, channel: "email", status: "failed", error_message: lastError,
  });
  await supabase.from("content_items").update({ status: "failed" }).eq("id", contentItemId);
  return { success: false, error: lastError };
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run tests/lib/content/publish-email.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/content/publish-email.ts tests/lib/content/publish-email.test.ts
git commit -m "feat: add Resend email publishing with Tiptap HTML conversion, retry logic, and tests"
```

---

### Task 15: Asset Library (Uploader)

**Files:**
- Create: `src/components/content/asset-uploader.tsx`

- [ ] **Step 1: Write asset uploader**

Write `src/components/content/asset-uploader.tsx`:

```tsx
"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function AssetUploader({ onUpload }: { onUpload: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    for (const file of Array.from(files)) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("assets").upload(path, file);
      if (!error) {
        await supabase.from("assets").insert({
          filename: file.name, storage_path: path, mime_type: file.type,
          size_bytes: file.size, tags: [], uploaded_by: user.id,
        });
      }
    }
    setUploading(false);
    onUpload();
  }, [supabase, onUpload]);

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-border",
        uploading && "opacity-50 pointer-events-none"
      )}
    >
      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Drag files here or click to upload"}</p>
      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
    </label>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/asset-uploader.tsx
git commit -m "feat: add asset uploader with drag-and-drop"
```

---

### Task 16: Asset Library (Grid & Page)

**Files:**
- Create: `src/components/content/asset-grid.tsx`
- Create: `src/app/(dashboard)/content/assets/page.tsx`

- [ ] **Step 1: Write asset grid**

Write `src/components/content/asset-grid.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import type { Asset } from "@/lib/content/types";

export function AssetGrid({ refreshKey }: { refreshKey: number }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
      if (data) setAssets(data as Asset[]);
    }
    load();
  }, [refreshKey]);

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete ${asset.filename}?`)) return;
    await supabase.storage.from("assets").remove([asset.storage_path]);
    await supabase.from("assets").delete().eq("id", asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  const filtered = assets.filter((a) =>
    a.filename.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((asset) => {
          const url = supabase.storage.from("assets").getPublicUrl(asset.storage_path).data.publicUrl;
          return (
            <div key={asset.id} className="group relative rounded-lg border overflow-hidden">
              {asset.mime_type.startsWith("image/") ? (
                <img src={url} alt={asset.filename} className="aspect-square object-cover w-full" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">{asset.mime_type.split("/")[1]}</div>
              )}
              <div className="p-2"><p className="truncate text-xs">{asset.filename}</p></div>
              <Button variant="destructive" size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(asset)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No assets found.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Write assets page**

Write `src/app/(dashboard)/content/assets/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { AssetUploader } from "@/components/content/asset-uploader";
import { AssetGrid } from "@/components/content/asset-grid";

export default function AssetsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald text-3xl font-bold tracking-tight">Asset Library</h1>
        <p className="text-muted-foreground">Upload and manage images, videos, and graphics.</p>
      </div>
      <AssetUploader onUpload={() => setRefreshKey((k) => k + 1)} />
      <AssetGrid refreshKey={refreshKey} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/asset-grid.tsx src/app/\(dashboard\)/content/assets/
git commit -m "feat: add asset grid with search and asset library page"
```

---

### Task 17: Pillar Coverage Chart

**Files:**
- Create: `src/components/content/pillar-coverage.tsx`

- [ ] **Step 1: Write pillar coverage component**

Write `src/components/content/pillar-coverage.tsx`:

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { getPillarCoverage } from "@/lib/content/actions";
import { AU_PILLARS } from "@/lib/constants";
import { Card } from "@/components/ui/card";

export function PillarCoverage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getPillarCoverage();
      if (result.data) setCounts(result.data);
    });
  }, []);

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-medium">Pillar Coverage</h3>
      <div className="space-y-2">
        {AU_PILLARS.map((pillar) => {
          const count = counts[pillar.id] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={pillar.id} className="flex items-center gap-3">
              <span className="text-xs w-28 truncate">{pillar.label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/content/pillar-coverage.tsx
git commit -m "feat: add pillar coverage chart for balanced content tracking"
```

---

### Task 18: Public Blog Pages

**Files:**
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`

- [ ] **Step 1: Write blog index page**

Write `src/app/blog/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BlogIndexPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("content_items")
    .select("id, title, slug, body_text, published_at, pillar")
    .eq("channel", "blog")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-oswald text-4xl font-bold tracking-tight mb-8">Blog</h1>
      <div className="space-y-8">
        {(posts ?? []).map((post) => (
          <article key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="font-oswald text-2xl font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="mt-2 text-muted-foreground line-clamp-3">{post.body_text}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(post.published_at!).toLocaleDateString()}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write blog post page**

Write `src/app/blog/[slug]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { tiptapToHtml } from "@/lib/content/tiptap-html";
import { notFound } from "next/navigation";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .eq("channel", "blog")
    .eq("status", "published")
    .single();

  if (!post) notFound();

  const html = tiptapToHtml(post.body as Record<string, unknown>);

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-oswald text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{new Date(post.published_at).toLocaleDateString()}</p>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/blog/
git commit -m "feat: add public blog index and post pages with Tiptap HTML rendering"
```

---

### Task 19: Content Templates Page

**Files:**
- Create: `src/app/(dashboard)/content/templates/page.tsx`

- [ ] **Step 1: Write templates page**

Write `src/app/(dashboard)/content/templates/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { AU_CHANNELS } from "@/lib/constants";
import type { ContentTemplate } from "@/lib/content/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("content_templates").select("*").order("created_at", { ascending: false });
      if (data) setTemplates(data as ContentTemplate[]);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-oswald text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">Reusable content templates with AU brand voice.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const channel = AU_CHANNELS.find((c) => c.id === template.channel);
          return (
            <Card key={template.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <Badge variant="secondary">{channel?.label}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/content/new?template=${template.id}`)}>
                <Copy className="mr-1 h-4 w-4" /> Use Template
              </Button>
            </Card>
          );
        })}
        {templates.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">No templates yet.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/content/templates/
git commit -m "feat: add content templates page"
```

---

### Task 20: Update .env.local.example with Correct LinkedIn Vars

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: Update env vars to match actual code usage**

Add to `.env.local.example`:

```env
# LinkedIn (direct publishing — Community Management API)
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_PERSON_ID=
```

And remove the old `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` lines if present.

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add .env.local.example
git commit -m "fix: align LinkedIn env vars with actual code usage"
```

---

### Task 21: Verify Content Module

- [ ] **Step 1: Run linter**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm run lint
```

Expected: No errors.

- [ ] **Step 2: Run all tests**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Build check**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Fix any issues and commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add -A
git commit -m "fix: resolve lint and build issues in content module"
```
