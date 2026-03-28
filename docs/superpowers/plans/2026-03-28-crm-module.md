# CRM & Audience Management Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the CRM module — extended contact profiles, Kanban pipeline view, configurable lead scoring, dynamic segmentation with event-driven refresh, activity timeline, team notes/tasks, and contact management.

**Architecture:** Route-based module under `/dashboard/crm` following established patterns. The `contacts` table was created as a stub in `003_funnel.sql` — this migration extends it with `company` and `assigned_to` columns, then adds supporting tables. Server actions in `lib/crm/actions.ts`, queries in `lib/crm/queries.ts`, lead scoring logic in `lib/crm/scoring.ts` (pure), segmentation logic in `lib/crm/segments.ts` (pure), validation in `lib/crm/validation.ts`.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS + Edge Functions, @dnd-kit (Kanban), Vitest

**Prerequisites:** Foundation, Content, Funnel, and Campaigns modules complete. All migrations (001-004) applied. `contacts` table exists from 003_funnel.sql.

---

## File Structure

```
src/
├── app/(dashboard)/crm/
│   ├── page.tsx                          # CRM overview / pipeline (server)
│   ├── pipeline-client.tsx               # Kanban pipeline (client)
│   ├── contacts/
│   │   ├── page.tsx                      # Contact list with filters (server)
│   │   ├── contacts-client.tsx           # Client list with search/filter
│   │   ├── new/page.tsx                  # Manual contact creation
│   │   └── [id]/page.tsx                 # Contact detail page
│   └── segments/
│       ├── page.tsx                      # Segments list
│       └── [id]/page.tsx                 # Segment detail + members
├── components/crm/
│   ├── pipeline-board.tsx                # Kanban board with stage columns
│   ├── pipeline-card.tsx                 # Contact card in pipeline
│   ├── contact-profile.tsx               # Full contact profile view
│   ├── contact-form.tsx                  # Create/edit contact form
│   ├── activity-timeline.tsx             # Activity log + notes
│   ├── contact-tasks.tsx                 # Tasks list for a contact
│   ├── lead-score-badge.tsx              # Score with Cold/Warm/Hot/Customer label
│   ├── lead-score-config.tsx             # Configurable scoring rules UI
│   ├── segment-builder.tsx               # Dynamic segment filter builder
│   ├── segment-badge.tsx                 # Segment membership badge
│   └── contact-filters.tsx              # Reusable filter bar (stage, score, tags, source)
├── lib/crm/
│   ├── types.ts                          # TypeScript types
│   ├── validation.ts                     # Pure validation functions
│   ├── actions.ts                        # Server actions (mutations)
│   ├── queries.ts                        # Read-only queries (contacts, segments, activities)
│   ├── scoring.ts                        # Lead scoring calculation (pure)
│   └── segments.ts                       # Segment filter evaluation (pure)
supabase/
├── migrations/
│   └── 005_crm.sql                       # Extend contacts + CRM tables + triggers
└── functions/
    └── refresh-segments/index.ts         # Edge Function for daily segment refresh
tests/
├── lib/crm/
│   ├── validation.test.ts
│   ├── scoring.test.ts
│   └── segments.test.ts
```

---

### Task 1: CRM Database Migration

**Files:**
- Create: `supabase/migrations/005_crm.sql`

- [ ] **Step 1: Write the migration**

Extends the existing `contacts` table and adds CRM-specific tables:

```sql
-- Extend contacts table (created in 003_funnel.sql)
alter table public.contacts add column if not exists company text;
alter table public.contacts add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists idx_contacts_assigned on public.contacts(assigned_to);

-- Contact tags (many-to-many, supplements the tags[] array for structured queries)
create table public.contact_tags (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  tag text not null,
  created_at timestamptz default now(),
  unique(contact_id, tag)
);

-- Contact activities (timestamped log)
create table public.contact_activities (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  activity_type text not null,
  metadata jsonb default '{}',
  content_item_id uuid references public.content_items(id) on delete set null,
  email_send_id uuid references public.email_sends(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Contact notes (team notes)
create table public.contact_notes (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  content text not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contact tasks (follow-up tasks)
create table public.contact_tasks (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dynamic segments
create table public.segments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  filter_rules jsonb not null default '{}',
  is_preset boolean default false,
  contact_count int default 0,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Materialized segment membership
create table public.segment_contacts (
  id uuid default gen_random_uuid() primary key,
  segment_id uuid references public.segments(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  added_at timestamptz default now(),
  unique(segment_id, contact_id)
);

-- Configurable lead scoring rules
create table public.lead_score_rules (
  id uuid default gen_random_uuid() primary key,
  action text not null unique,
  points int not null,
  description text,
  created_at timestamptz default now()
);

-- Insert default scoring rules
insert into public.lead_score_rules (action, points, description) values
  ('download_lead_magnet', 5, 'Downloads a lead magnet'),
  ('join_challenge', 10, 'Joins the 90-Day Challenge'),
  ('attend_event', 15, 'Attends a live event or webinar'),
  ('subscribe_circle', 20, 'Subscribes to Unplugged Circle'),
  ('purchase_strategy', 50, 'Purchases AI Strategy Builder'),
  ('inactive_30_days', -5, 'Inactive for 30 days');

-- Indexes
create index idx_contact_tags_contact on public.contact_tags(contact_id);
create index idx_contact_tags_tag on public.contact_tags(tag);
create index idx_contact_activities_contact on public.contact_activities(contact_id, created_at desc);
create index idx_contact_activities_type on public.contact_activities(activity_type);
create index idx_contact_notes_contact on public.contact_notes(contact_id);
create index idx_contact_tasks_contact on public.contact_tasks(contact_id);
create index idx_contact_tasks_assigned on public.contact_tasks(assigned_to) where status != 'completed';
create index idx_segment_contacts_segment on public.segment_contacts(segment_id);
create index idx_segment_contacts_contact on public.segment_contacts(contact_id);

-- RLS
alter table public.contact_tags enable row level security;
alter table public.contact_activities enable row level security;
alter table public.contact_notes enable row level security;
alter table public.contact_tasks enable row level security;
alter table public.segments enable row level security;
alter table public.segment_contacts enable row level security;
alter table public.lead_score_rules enable row level security;

-- Owner full access (unique policy names)
create policy "Contact_tags owner full access" on public.contact_tags for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Contact_activities owner full access" on public.contact_activities for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Contact_notes owner full access" on public.contact_notes for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Contact_tasks owner full access" on public.contact_tasks for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Segments owner full access" on public.segments for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Segment_contacts owner full access" on public.segment_contacts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Lead_score_rules owner full access" on public.lead_score_rules for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));

-- Team: read all CRM data, manage own tasks
create policy "Contact_tags team read" on public.contact_tags for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Contact_activities team read" on public.contact_activities for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Contact_notes team read" on public.contact_notes for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Contact_notes team write own" on public.contact_notes for insert
  with check (created_by = auth.uid());
create policy "Contact_tasks team read" on public.contact_tasks for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Contact_tasks team write own" on public.contact_tasks for insert
  with check (created_by = auth.uid());
create policy "Contact_tasks team update assigned" on public.contact_tasks for update
  using (assigned_to = auth.uid());
create policy "Segments team read" on public.segments for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Segment_contacts team read" on public.segment_contacts for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Lead_score_rules team read" on public.lead_score_rules for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

-- Team: update contacts assigned to them
create policy "Contacts team update assigned" on public.contacts for update
  using (assigned_to = auth.uid());

-- Timestamps
create trigger contact_notes_updated_at before update on public.contact_notes
  for each row execute procedure public.update_updated_at();
create trigger contact_tasks_updated_at before update on public.contact_tasks
  for each row execute procedure public.update_updated_at();
create trigger segments_updated_at before update on public.segments
  for each row execute procedure public.update_updated_at();

-- Auto-log activity on form submission (enriches the funnel trigger)
create or replace function public.log_form_activity()
returns trigger as $$
begin
  if new.contact_id is not null then
    insert into public.contact_activities (contact_id, activity_type, metadata)
    values (new.contact_id, 'form_submit', jsonb_build_object('form_id', new.form_id, 'email', new.email));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_form_submission_activity
  after insert on public.form_submissions
  for each row execute procedure public.log_form_activity();

-- Auto-log activity on email events
create or replace function public.log_email_activity()
returns trigger as $$
begin
  if new.status in ('opened', 'clicked') and
     (old.status is null or old.status != new.status) then
    insert into public.contact_activities (contact_id, activity_type, metadata, email_send_id)
    values (new.contact_id, 'email_' || new.status, jsonb_build_object('subject', new.subject), new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_email_status_change
  after update on public.email_sends
  for each row execute procedure public.log_email_activity();

-- Event-driven segment refresh: re-evaluate segments for a contact
-- when their stage, tags, or score change (spec requirement for immediate membership)
create or replace function public.refresh_contact_segments()
returns trigger as $$
declare
  seg record;
  rules jsonb;
  matches boolean;
begin
  -- For each segment, check if this contact matches the filter rules
  for seg in select id, filter_rules from public.segments loop
    rules := seg.filter_rules;
    matches := true;

    -- Evaluate basic filter rules
    if rules->>'stage_equals' is not null and new.stage != rules->>'stage_equals' then
      matches := false;
    end if;
    if rules->>'score_above' is not null and new.lead_score <= (rules->>'score_above')::int then
      matches := false;
    end if;
    if rules->>'score_below' is not null and new.lead_score >= (rules->>'score_below')::int then
      matches := false;
    end if;
    if rules->>'has_tag' is not null and not (new.tags @> array[rules->>'has_tag']) then
      matches := false;
    end if;
    if rules->>'source_equals' is not null and coalesce(new.source, '') != rules->>'source_equals' then
      matches := false;
    end if;

    if matches then
      insert into public.segment_contacts (segment_id, contact_id)
      values (seg.id, new.id)
      on conflict (segment_id, contact_id) do nothing;
    else
      delete from public.segment_contacts
      where segment_id = seg.id and contact_id = new.id;
    end if;
  end loop;

  -- Update segment counts
  update public.segments s set contact_count = (
    select count(*) from public.segment_contacts sc where sc.segment_id = s.id
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on contact stage/score/tag changes
create trigger on_contact_change_refresh_segments
  after update of stage, lead_score, tags on public.contacts
  for each row execute procedure public.refresh_contact_segments();

-- Also refresh segments when a new contact is created (e.g., from form submission)
create trigger on_contact_insert_refresh_segments
  after insert on public.contacts
  for each row execute procedure public.refresh_contact_segments();
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/migrations/005_crm.sql
git commit -m "feat: add CRM migration extending contacts, adding tags, activities, notes, tasks, segments, scoring rules"
```

---

### Task 2: CRM Types

**Files:**
- Create: `src/lib/crm/types.ts`

- [ ] **Step 1: Write types**

Include: ContactTag, ContactActivity, ContactNote, ContactTask (with TaskStatus union), Segment, SegmentContact, LeadScoreRule. Also ContactWithDetails (extends Contact from funnel types with relations). LeadScoreLevel union: 'cold' | 'warm' | 'hot' | 'customer'. SegmentFilterRule type for the JSON filter structure.

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/crm/types.ts
git commit -m "feat: add CRM types"
```

---

### Task 3: Scoring & Segmentation Logic (TDD)

**Files:**
- Create: `src/lib/crm/scoring.ts`
- Create: `src/lib/crm/segments.ts`
- Create: `src/lib/crm/validation.ts`
- Create: `tests/lib/crm/scoring.test.ts`
- Create: `tests/lib/crm/segments.test.ts`
- Create: `tests/lib/crm/validation.test.ts`

- [ ] **Step 1: Write scoring tests**

Tests for:
- `calculateLeadScore(activities, rules)` — sums points for matching activities
- `getScoreLevel(score)` — Cold (<20), Warm (20-50), Hot (50+), Customer (purchased)
- `applyInactivityPenalty(lastActivityDate, currentScore, rules)` — deducts if 30+ days inactive

- [ ] **Step 2: Write segment tests**

Tests for:
- `evaluateSegmentFilter(contact, filterRules)` — evaluates filter rules against contact data
  - stage_equals, score_above, score_below, has_tag, source_equals, inactive_days
- `matchesFilter(contact, rule)` — single rule evaluation
- Pre-built segment filters: "Challenge-ready" (warm + not challenge_participant), "Upgrade candidates" (circle_member + score > 50), "At-risk" (inactive 14+ days)

- [ ] **Step 3: Write validation tests**

Tests for `validateContact({ email })`, `validateNote({ content })`, `validateTask({ title })`

- [ ] **Step 4: Run tests — verify fail**
- [ ] **Step 5: Write scoring.ts, segments.ts, validation.ts** (all pure, no "use server")
- [ ] **Step 6: Run tests — verify pass**
- [ ] **Step 7: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/crm/scoring.ts src/lib/crm/segments.ts src/lib/crm/validation.ts tests/lib/crm/
git commit -m "feat: add lead scoring, segment evaluation, and CRM validation with tests"
```

---

### Task 4: CRM Server Actions & Queries

**Files:**
- Create: `src/lib/crm/actions.ts`
- Create: `src/lib/crm/queries.ts`

- [ ] **Step 1: Write actions (mutations)**

- Contacts: `createContact` (validate), `updateContact`, `deleteContact`, `assignContact`, `updateContactStage`
- Tags: `addTag`, `removeTag`
- Notes: `addNote`, `updateNote`, `deleteNote`
- Tasks: `createTask` (validate), `updateTask`, `completeTask`, `deleteTask`
- Segments: `createSegment`, `updateSegment`, `deleteSegment`, `refreshSegmentMembers` (evaluates filter rules against all contacts, upserts segment_contacts)
- Lead score rules: `getScoreRules`, `updateScoreRule`
- Scoring: `recalculateContactScore(contactId)` — queries activities, applies rules, updates contact.lead_score

- [ ] **Step 2: Write queries (reads)**

- `getContacts(filters)` — filter by stage, score range, tags, source, assigned_to, search text. Paginated.
- `getContact(id)` — full profile with tags, recent activities, notes, tasks, segment memberships
- `getContactActivities(contactId, limit)` — activity timeline
- `getContactsByStage()` — grouped by stage for pipeline
- `getSegments()` — all segments with member counts
- `getSegmentMembers(segmentId)` — contacts in segment
- `getTeamTasks(userId)` — tasks assigned to a team member
- `getContactStats()` — total contacts, per-stage counts, avg score, new this month

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/crm/actions.ts src/lib/crm/queries.ts
git commit -m "feat: add CRM server actions and queries for contacts, tags, notes, tasks, segments, scoring"
```

---

### Task 5: Pipeline Board Components

**Files:**
- Create: `src/components/crm/pipeline-board.tsx`
- Create: `src/components/crm/pipeline-card.tsx`
- Create: `src/components/crm/lead-score-badge.tsx`

- [ ] **Step 1: Write lead score badge**

Color-coded badge: Cold (blue/gray), Warm (yellow/orange), Hot (red), Customer (green). Shows score number + label.

- [ ] **Step 2: Write pipeline card**

Contact card for Kanban column: name, email, score badge, tags, source. Draggable via @dnd-kit.

- [ ] **Step 3: Write pipeline board**

Kanban board with one column per `FUNNEL_STAGES`. Each column shows contacts in that stage. Drag contact between columns to change stage (calls `updateContactStage`). Column headers show count. Uses @dnd-kit DndContext.

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/crm/pipeline-board.tsx src/components/crm/pipeline-card.tsx src/components/crm/lead-score-badge.tsx
git commit -m "feat: add CRM pipeline Kanban board with drag-to-change-stage"
```

---

### Task 6: Contact Profile Components

**Files:**
- Create: `src/components/crm/contact-profile.tsx`
- Create: `src/components/crm/contact-form.tsx`
- Create: `src/components/crm/activity-timeline.tsx`
- Create: `src/components/crm/contact-tasks.tsx`

- [ ] **Step 1: Write contact form**

Form: name, email, company, source, stage (select), tags (multi-input), assigned_to (team member select). Used for create + edit.

- [ ] **Step 2: Write activity timeline**

Vertical timeline showing activities in reverse chronological order. Each entry: icon by type (email opened, form submitted, stage changed, note added), description, timestamp, linked content/campaign if applicable. Includes "Add Note" form at top.

- [ ] **Step 3: Write contact tasks**

Task list: title, due date, status badge, assigned to. Add task form. Complete/delete buttons. Overdue tasks highlighted red.

- [ ] **Step 4: Write contact profile**

Full profile view: header (name, email, company, score badge), tabs (Activity, Notes, Tasks, Segments), contact form for editing. Shows all segment memberships.

- [ ] **Step 5: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/crm/contact-profile.tsx src/components/crm/contact-form.tsx src/components/crm/activity-timeline.tsx src/components/crm/contact-tasks.tsx
git commit -m "feat: add contact profile with activity timeline, tasks, and edit form"
```

---

### Task 7: Segment & Filter Components

**Files:**
- Create: `src/components/crm/segment-builder.tsx`
- Create: `src/components/crm/segment-badge.tsx`
- Create: `src/components/crm/contact-filters.tsx`
- Create: `src/components/crm/lead-score-config.tsx`

- [ ] **Step 1: Write segment builder**

Filter rule builder: add rules (stage_equals, score_above, score_below, has_tag, source_equals, inactive_days). Each rule has type dropdown + value input. AND logic between rules. Live preview of matching count.

- [ ] **Step 2: Write segment badge** — small colored badge showing segment name
- [ ] **Step 3: Write contact filters** — filter bar: stage dropdown, score range, tag search, source input, assigned_to select. Used on contacts list and pipeline.
- [ ] **Step 4: Write lead score config** — table of scoring rules with editable points column. Save via `updateScoreRule`.
- [ ] **Step 5: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/crm/segment-builder.tsx src/components/crm/segment-badge.tsx src/components/crm/contact-filters.tsx src/components/crm/lead-score-config.tsx
git commit -m "feat: add segment builder, contact filters, and lead score configuration"
```

---

### Task 8: CRM Pages — Pipeline & Contacts

**Files:**
- Create: `src/app/(dashboard)/crm/page.tsx`
- Create: `src/app/(dashboard)/crm/pipeline-client.tsx`
- Create: `src/app/(dashboard)/crm/contacts/page.tsx`
- Create: `src/app/(dashboard)/crm/contacts/contacts-client.tsx`
- Create: `src/app/(dashboard)/crm/contacts/new/page.tsx`
- Create: `src/app/(dashboard)/crm/contacts/[id]/page.tsx`

- [ ] **Step 1: Write pipeline page** (server + client split)

Server: calls `getContactsByStage()`, passes to client. Client: renders PipelineBoard + ContactFilters. Drag-to-change-stage wired to `updateContactStage`.

- [ ] **Step 2: Write contacts list page** (server + client split)

Server: calls `getContacts()` with default filters. Client: searchable, filterable table of contacts. Click to view detail. Pagination.

- [ ] **Step 3: Write new contact page**

"use client". ContactForm + save via `createContact`. Redirect to detail.

- [ ] **Step 4: Write contact detail page**

"use client" using `use(params)`. Loads full contact via `getContact`. Renders ContactProfile with all tabs (activity, notes, tasks, segments).

- [ ] **Step 5: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/crm/
git commit -m "feat: add CRM pipeline, contacts list, create, and detail pages"
```

---

### Task 9: Segments Pages

**Files:**
- Create: `src/app/(dashboard)/crm/segments/page.tsx`
- Create: `src/app/(dashboard)/crm/segments/[id]/page.tsx`

- [ ] **Step 1: Write segments list page**

Server component. Shows all segments with: name, description, member count, preset badge. "Create Segment" button. "Refresh All" button calls `refreshSegmentMembers` for all segments.

- [ ] **Step 2: Write segment detail page**

"use client". Shows: segment name/description (editable), SegmentBuilder for filter rules, member list (table of contacts), "Refresh Members" button.

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/crm/segments/
git commit -m "feat: add segments list and detail pages with filter builder"
```

---

### Task 10: Segment Refresh Edge Function

**Files:**
- Create: `supabase/functions/refresh-segments/index.ts`

- [ ] **Step 1: Write Edge Function**

Deno Edge Function that:
1. Loads all segments and their filter_rules
2. For each segment, queries contacts matching the rules
3. Upserts into segment_contacts (delete removed, insert new)
4. Updates segment.contact_count
5. Include pg_cron comment for daily schedule

Follow `supabase/functions/process-sequences/index.ts` pattern.

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/functions/refresh-segments/
git commit -m "feat: add segment refresh Edge Function for daily pg_cron execution"
```

---

### Task 11: Verify CRM Module

- [ ] **Step 1: Run linter** — `npm run lint`
- [ ] **Step 2: Run all tests** — `npx vitest run`
- [ ] **Step 3: Build check** — `npm run build`
- [ ] **Step 4: Fix issues and commit specific files**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add [specific files]
git commit -m "fix: resolve lint and build issues in CRM module"
```
