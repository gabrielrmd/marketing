# Lead Generation & Funnel Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Lead Generation & Funnel module — landing pages with A/B testing, lead magnets, email sequences with execution engine, embeddable forms with rate limiting + Turnstile CAPTCHA, and conversion tracking.

**Architecture:** Route-based module under `/dashboard/funnel` following the same server/client component split established in the Content module. Server actions in `lib/funnel/actions.ts`, validation in `lib/funnel/validation.ts`, types in `lib/funnel/types.ts`. Public-facing routes for landing pages (`/lp/[slug]`) and form endpoints (`/api/forms/[id]/submit`). Email sequence execution via a pg_cron-triggered Supabase Edge Function.

**Tech Stack:** Next.js 15, Supabase Postgres + RLS + Edge Functions, Resend (email delivery + svix webhook verification), @dnd-kit (landing page builder), Cloudflare Turnstile (CAPTCHA), Vitest (tests)

**Prerequisites:** Foundation and Content Module must be complete. `001_profiles.sql` and `002_content.sql` must be applied. The `contacts` table from the CRM module does NOT exist yet — this migration creates a lightweight `contacts` stub that the CRM module will extend later.

**Route note:** The `(dashboard)` route group is parenthetical — URLs are `/dashboard/funnel/*` as configured in the existing sidebar. This is confirmed working by the Content module at `/dashboard/content/*`.

---

## File Structure

```
src/
├── app/(dashboard)/funnel/
│   ├── page.tsx                          # Funnel overview (server component)
│   ├── overview-client.tsx               # Client interactivity for overview
│   ├── landing-pages/
│   │   ├── page.tsx                      # Landing pages list
│   │   ├── new/page.tsx                  # Create landing page
│   │   └── [id]/page.tsx                 # Edit landing page
│   ├── lead-magnets/
│   │   ├── page.tsx                      # Lead magnets list
│   │   └── new/page.tsx                  # Create lead magnet
│   ├── sequences/
│   │   ├── page.tsx                      # Email sequences list
│   │   ├── new/page.tsx                  # Create sequence
│   │   └── [id]/page.tsx                 # Edit sequence (visual builder)
│   └── forms/
│       ├── page.tsx                      # Forms list
│       ├── new/page.tsx                  # Create form
│       └── [id]/page.tsx                 # Edit form + embed code
├── app/lp/
│   └── [slug]/
│       ├── page.tsx                      # Public landing page (server)
│       └── lp-client.tsx                 # Client form handling + Turnstile
├── app/api/forms/
│   └── [id]/submit/route.ts             # Public form submission endpoint
├── app/api/webhooks/
│   └── resend/route.ts                   # Resend webhook (open/click/bounce)
├── components/funnel/
│   ├── landing-page-editor.tsx           # Block-based landing page editor
│   ├── landing-page-block.tsx            # Single block renderer (hero, text, CTA, form)
│   ├── landing-page-preview.tsx          # Live preview of landing page
│   ├── ab-test-panel.tsx                 # A/B test setup and results
│   ├── sequence-builder.tsx              # Visual email sequence builder
│   ├── sequence-step.tsx                 # Single step in sequence
│   ├── sequence-analytics.tsx            # Per-step open/click metrics
│   ├── form-builder.tsx                  # Form field editor
│   ├── form-embed-code.tsx               # Embed code generator
│   ├── lead-magnet-card.tsx              # Lead magnet display card
│   ├── funnel-chart.tsx                  # Funnel stage visualization
│   └── conversion-stats.tsx              # Conversion rate cards
├── lib/funnel/
│   ├── types.ts                          # TypeScript types
│   ├── validation.ts                     # Pure validation functions
│   ├── actions.ts                        # Server actions (CRUD)
│   ├── sequence-engine.ts               # Sequence execution logic (pure)
│   └── stats.ts                          # Conversion rate calculations (pure)
supabase/
├── migrations/
│   └── 003_funnel.sql                    # Funnel tables + RLS + contacts stub + increment_field RPC
└── functions/
    └── process-sequences/index.ts        # Edge Function for sequence execution (pg_cron)
tests/
├── lib/funnel/
│   ├── validation.test.ts                # Validation tests
│   ├── stats.test.ts                     # Conversion calculation tests
│   └── sequence-engine.test.ts           # Sequence step evaluation tests
```

---

### Task 1: Funnel Database Migration

**Files:**
- Create: `supabase/migrations/003_funnel.sql`

- [ ] **Step 1: Write the migration**

Write `supabase/migrations/003_funnel.sql`. Note: `lead_magnets` is created BEFORE `landing_pages` to avoid forward-reference FK error. Includes `increment_field` RPC for atomic counter updates.

```sql
-- Contacts stub (CRM module will extend this later)
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  source text,
  tags text[] default '{}',
  stage text default 'visitor' check (stage in ('visitor', 'subscriber', 'engaged', 'challenge_participant', 'circle_member', 'strategy_customer', 'advocate')),
  lead_score int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_stage on public.contacts(stage);
alter table public.contacts enable row level security;

create policy "Owner full access" on public.contacts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Team read contacts" on public.contacts for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Public insert contacts" on public.contacts for insert
  with check (true);

-- Lead magnets (created first — referenced by landing_pages)
create table public.lead_magnets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  file_path text,
  file_type text,
  download_count int default 0,
  delivery_email_subject text,
  delivery_email_body text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Landing pages (references lead_magnets)
create table public.landing_pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  blocks jsonb not null default '[]',
  variant_b_blocks jsonb,
  ab_test_active boolean default false,
  visitors_a int default 0,
  visitors_b int default 0,
  conversions_a int default 0,
  conversions_b int default 0,
  winner text check (winner in ('a', 'b')),
  lead_magnet_id uuid references public.lead_magnets(id) on delete set null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email sequences
create table public.email_sequences (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  trigger_type text not null default 'manual' check (trigger_type in ('manual', 'form_submission', 'tag_added', 'stage_change')),
  trigger_value text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email sequence steps
create table public.email_sequence_steps (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid references public.email_sequences(id) on delete cascade not null,
  step_index int not null,
  step_type text not null check (step_type in ('email', 'delay', 'condition')),
  subject text,
  body_html text,
  delay_minutes int,
  condition_type text check (condition_type in ('tag_exists', 'email_opened', 'email_clicked', 'score_above')),
  condition_value text,
  true_next_index int,
  false_next_index int,
  created_at timestamptz default now()
);

-- Sequence enrollments
create table public.sequence_enrollments (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  sequence_id uuid references public.email_sequences(id) on delete cascade not null,
  current_step_index int not null default 0,
  next_send_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'exited', 'paused')),
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  unique(contact_id, sequence_id)
);

-- Email sends
create table public.email_sends (
  id uuid default gen_random_uuid() primary key,
  sequence_enrollment_id uuid references public.sequence_enrollments(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  subject text not null,
  resend_id text,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at timestamptz default now(),
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Form submissions
create table public.form_submissions (
  id uuid default gen_random_uuid() primary key,
  form_id uuid not null,
  contact_id uuid references public.contacts(id),
  email text not null,
  name text,
  data jsonb default '{}',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ip_address text,
  created_at timestamptz default now()
);

-- Funnel events
create table public.funnel_events (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade,
  event_type text not null,
  event_data jsonb default '{}',
  source text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_landing_pages_slug on public.landing_pages(slug);
create index idx_landing_pages_status on public.landing_pages(status);
create index idx_lead_magnets_created_by on public.lead_magnets(created_by);
create index idx_email_sequences_status on public.email_sequences(status);
create index idx_sequence_steps_seq on public.email_sequence_steps(sequence_id, step_index);
create index idx_enrollments_next_send on public.sequence_enrollments(next_send_at) where status = 'active';
create index idx_enrollments_contact on public.sequence_enrollments(contact_id);
create index idx_email_sends_contact on public.email_sends(contact_id);
create index idx_email_sends_resend_id on public.email_sends(resend_id);
create index idx_form_submissions_form on public.form_submissions(form_id);
create index idx_form_submissions_contact on public.form_submissions(contact_id);
create index idx_funnel_events_contact on public.funnel_events(contact_id);
create index idx_funnel_events_type on public.funnel_events(event_type, created_at);

-- RLS
alter table public.landing_pages enable row level security;
alter table public.lead_magnets enable row level security;
alter table public.email_sequences enable row level security;
alter table public.email_sequence_steps enable row level security;
alter table public.sequence_enrollments enable row level security;
alter table public.email_sends enable row level security;
alter table public.form_submissions enable row level security;
alter table public.funnel_events enable row level security;

-- Owner full access
create policy "Owner full access" on public.landing_pages for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.lead_magnets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.email_sequences for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.email_sequence_steps for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.sequence_enrollments for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.email_sends for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.form_submissions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owner full access" on public.funnel_events for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));

-- Team read access
create policy "Team read" on public.landing_pages for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.lead_magnets for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.email_sequences for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.email_sequence_steps for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.sequence_enrollments for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.email_sends for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.form_submissions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Team read" on public.funnel_events for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

-- Public access for forms and landing pages
create policy "Public insert submissions" on public.form_submissions for insert with check (true);
create policy "Public insert funnel events" on public.funnel_events for insert with check (true);
create policy "Public read published pages" on public.landing_pages for select using (status = 'published');

-- Atomic counter increment RPC (used for landing page visitors/conversions and lead magnet downloads)
create or replace function public.increment_field(
  p_table text,
  p_id uuid,
  p_field text,
  p_amount int default 1
) returns void as $$
begin
  execute format('update public.%I set %I = %I + $1 where id = $2', p_table, p_field, p_field)
  using p_amount, p_id;
end;
$$ language plpgsql security definer;

-- Timestamps
create trigger landing_pages_updated_at before update on public.landing_pages
  for each row execute procedure public.update_updated_at();
create trigger lead_magnets_updated_at before update on public.lead_magnets
  for each row execute procedure public.update_updated_at();
create trigger email_sequences_updated_at before update on public.email_sequences
  for each row execute procedure public.update_updated_at();
create trigger contacts_updated_at before update on public.contacts
  for each row execute procedure public.update_updated_at();

-- Auto-create or link contact on form submission
create or replace function public.handle_form_submission()
returns trigger as $$
declare
  existing_contact_id uuid;
begin
  select id into existing_contact_id from public.contacts where email = new.email;
  if existing_contact_id is not null then
    new.contact_id := existing_contact_id;
    update public.contacts set stage = 'subscriber', updated_at = now()
      where id = existing_contact_id and stage = 'visitor';
  else
    insert into public.contacts (email, name, source, stage)
    values (new.email, new.name, new.utm_source, 'subscriber')
    returning id into new.contact_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_form_submission
  before insert on public.form_submissions
  for each row execute procedure public.handle_form_submission();
```

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/migrations/003_funnel.sql
git commit -m "feat: add funnel migration with contacts stub, landing pages, sequences, forms, increment_field RPC"
```

---

### Task 2: Funnel Types & Install Turnstile

**Files:**
- Create: `src/lib/funnel/types.ts`

- [ ] **Step 1: Install Turnstile React component**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm install @marsidev/react-turnstile
```

- [ ] **Step 2: Write types**

Write `src/lib/funnel/types.ts` with all type definitions for LandingPage, LeadMagnet, EmailSequence, EmailSequenceStep, SequenceEnrollment, EmailSend, FormSubmission, FunnelEvent, Contact, and PageBlock. Follow the exact pattern of `src/lib/content/types.ts`.

Include these union types at the top:
```ts
export type LandingPageStatus = "draft" | "published" | "archived";
export type SequenceStatus = "draft" | "active" | "paused" | "archived";
export type TriggerType = "manual" | "form_submission" | "tag_added" | "stage_change";
export type StepType = "email" | "delay" | "condition";
export type ConditionType = "tag_exists" | "email_opened" | "email_clicked" | "score_above";
export type EnrollmentStatus = "active" | "completed" | "exited" | "paused";
export type EmailSendStatus = "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed";

export type PageBlock = {
  id: string;
  type: "hero" | "text" | "cta" | "form" | "image" | "testimonial";
  content: Record<string, unknown>;
};
```

And full type definitions for each table matching the migration schema.

- [ ] **Step 3: Add Turnstile site key to .env.local.example**

Append to `.env.local.example`:
```
# Cloudflare Turnstile (CAPTCHA for public forms)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/funnel/types.ts package.json package-lock.json .env.local.example
git commit -m "feat: add funnel types, install Turnstile, add env vars"
```

---

### Task 3: Validation & Stats with Tests (TDD)

**Files:**
- Create: `src/lib/funnel/validation.ts`
- Create: `src/lib/funnel/stats.ts`
- Create: `tests/lib/funnel/validation.test.ts`
- Create: `tests/lib/funnel/stats.test.ts`

- [ ] **Step 1: Write validation tests**

Tests for `validateLandingPage`, `validateSequenceStep`, `validateFormSubmission`, `validateLeadMagnet`, and `validateSequence`.

- [ ] **Step 2: Write stats tests**

Tests for `calculateConversionRate`, `calculateABTestSignificance`, `shouldAutoSelectWinner`.

- [ ] **Step 3: Run tests — verify fail**
- [ ] **Step 4: Write validation.ts**

Include all validators:
- `validateLandingPage({ title, slug })` — requires title, URL-safe slug
- `validateLeadMagnet({ title })` — requires title
- `validateSequence({ name })` — requires name
- `validateSequenceStep({ step_type, subject, delay_minutes })` — email needs subject, delay needs positive minutes
- `validateFormSubmission({ email })` — requires valid email

- [ ] **Step 5: Write stats.ts**

Include `calculateConversionRate`, `calculateABTestSignificance` (z-test for two proportions), `shouldAutoSelectWinner` (100+ visitors per variant + significance).

- [ ] **Step 6: Run tests — verify pass**
- [ ] **Step 7: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/funnel/validation.ts src/lib/funnel/stats.ts tests/lib/funnel/
git commit -m "feat: add funnel validation (all entities), A/B test statistics with tests"
```

---

### Task 4: Sequence Engine with Tests (TDD)

**Files:**
- Create: `src/lib/funnel/sequence-engine.ts`
- Create: `tests/lib/funnel/sequence-engine.test.ts`

- [ ] **Step 1: Write tests**

Tests for `evaluateCondition` (tag_exists, score_above), `getNextStepIndex` (linear, branch true/false, past-end), `calculateNextSendAt` (email=now, delay=now+minutes).

- [ ] **Step 2: Run tests — verify fail**
- [ ] **Step 3: Write sequence-engine.ts**

Pure functions (no "use server", no Supabase imports) that evaluate conditions, determine next step, and calculate timing.

- [ ] **Step 4: Run tests — verify pass**
- [ ] **Step 5: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/funnel/sequence-engine.ts tests/lib/funnel/sequence-engine.test.ts
git commit -m "feat: add sequence execution engine with condition evaluation and step navigation"
```

---

### Task 5: Funnel Server Actions

**Files:**
- Create: `src/lib/funnel/actions.ts`

- [ ] **Step 1: Write server actions**

Follow `lib/content/actions.ts` pattern exactly. Include CRUD for:
- Landing pages (create, update, get, getAll, delete) — create/update call `validateLandingPage`
- Lead magnets (create, getAll, delete) — create calls `validateLeadMagnet`
- Email sequences (create, update, getAll, getWithSteps, saveSteps, delete) — create calls `validateSequence`
- Enrollments (enrollContact, getSequenceAnalytics)
- Form submissions (getFormSubmissions)
- Funnel overview stats (getFunnelOverview)

All create functions validate before inserting. All return `{ data }` or `{ error }`.

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/lib/funnel/actions.ts
git commit -m "feat: add funnel server actions with validation for all entities"
```

---

### Task 6: Form Submission API with Turnstile + Rate Limiting

**Files:**
- Create: `src/app/api/forms/[id]/submit/route.ts`

- [ ] **Step 1: Write the API route**

The POST handler must:
1. Rate limit: 10 submissions per IP per hour (in-memory map)
2. Validate Turnstile token by calling `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `TURNSTILE_SECRET_KEY`. Skip verification if env var not set (dev mode).
3. Validate email via `validateFormSubmission`
4. Insert form submission (trigger auto-creates/links contact)
5. Log funnel event
6. Increment landing page conversion using `supabase.rpc('increment_field', { p_table: 'landing_pages', p_id: pageId, p_field: variant === 'b' ? 'conversions_b' : 'conversions_a' })`
7. Auto-enroll in triggered sequences
8. Auto-deliver lead magnet (increment download_count atomically via `supabase.rpc('increment_field', { p_table: 'lead_magnets', p_id: magnetId, p_field: 'download_count' })`)

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/api/forms/
git commit -m "feat: add form submission API with Turnstile CAPTCHA, rate limiting, sequence enrollment, lead magnet delivery"
```

---

### Task 7: Resend Webhook with Signature Verification

**Files:**
- Create: `src/app/api/webhooks/resend/route.ts`

- [ ] **Step 1: Install svix**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
npm install svix
```

- [ ] **Step 2: Write webhook handler**

Verify webhook signature using svix `Webhook.verify()` with `RESEND_WEBHOOK_SECRET` env var. If secret not configured, log warning and process anyway (dev mode). Handle events: email.delivered, email.opened, email.clicked, email.bounced, email.complained.

- [ ] **Step 3: Add webhook secret to .env.local.example**

Append: `RESEND_WEBHOOK_SECRET=`

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/api/webhooks/ package.json package-lock.json .env.local.example
git commit -m "feat: add Resend webhook with svix signature verification for email tracking"
```

---

### Task 8: Landing Page Block Renderer

**Files:**
- Create: `src/components/funnel/landing-page-block.tsx`

- [ ] **Step 1: Write block renderer**

Server-compatible component (no "use client", no event handlers). Renders each block type: hero (gradient bg with heading/subheading), text (prose HTML), cta (styled link), form (static form markup — client handles submission), image, testimonial. No `onSubmit` — form handling is done by the client wrapper in Task 9.

- [ ] **Step 2: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/components/funnel/landing-page-block.tsx
git commit -m "feat: add landing page block renderer (hero, text, CTA, form, image, testimonial)"
```

---

### Task 9: Public Landing Page with Sticky A/B Testing

**Files:**
- Create: `src/app/lp/[slug]/page.tsx`
- Create: `src/app/lp/[slug]/lp-client.tsx`
- Modify: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Write server page**

Server component that:
1. Loads landing page by slug
2. Reads `ab_variant` cookie — if exists, use it; if not, assign randomly and set cookie
3. Selects blocks based on variant
4. Increments visitor count via `increment_field` RPC
5. Renders blocks via `LandingPageBlock`
6. Wraps in `LPClient` for form interactivity

- [ ] **Step 2: Write client wrapper**

`lp-client.tsx` — "use client" component that:
1. Renders Turnstile widget (using `@marsidev/react-turnstile`)
2. Handles form submission via fetch to `/api/forms/[id]/submit`
3. Includes variant and UTM params in submission
4. Shows success message on completion

- [ ] **Step 3: Add /lp to middleware exclusion**

Update `src/lib/supabase/middleware.ts` to allow `/lp` routes without auth (alongside `/blog`, `/login`, `/callback`).

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/lp/ src/lib/supabase/middleware.ts
git commit -m "feat: add public landing page with sticky A/B testing via cookie and Turnstile CAPTCHA"
```

---

### Task 10: Funnel Overview Dashboard

**Files:**
- Create: `src/app/(dashboard)/funnel/page.tsx`
- Create: `src/app/(dashboard)/funnel/overview-client.tsx`
- Create: `src/components/funnel/funnel-chart.tsx`
- Create: `src/components/funnel/conversion-stats.tsx`

- [ ] **Step 1: Write funnel chart**

`funnel-chart.tsx` — "use client" component. Renders funnel stages as horizontal bars using `FUNNEL_STAGES` from constants. Bar width proportional to count. AU brand colors per stage. Shows count and percentage next to each bar.

- [ ] **Step 2: Write conversion stats**

`conversion-stats.tsx` — Renders a grid of Card components showing: total landing pages, published pages, total lead magnets, total downloads, active sequences, total form submissions. Each with a number and label.

- [ ] **Step 3: Write server page + client wrapper**

`page.tsx` (server): calls `getFunnelOverview()`, passes data to `overview-client.tsx`.
`overview-client.tsx` (client): renders FunnelChart and ConversionStats.

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/funnel/page.tsx src/app/\(dashboard\)/funnel/overview-client.tsx src/components/funnel/funnel-chart.tsx src/components/funnel/conversion-stats.tsx
git commit -m "feat: add funnel overview dashboard with funnel chart and conversion stats"
```

---

### Task 11: Landing Pages List + Editor

**Files:**
- Create: `src/app/(dashboard)/funnel/landing-pages/page.tsx`
- Create: `src/app/(dashboard)/funnel/landing-pages/new/page.tsx`
- Create: `src/app/(dashboard)/funnel/landing-pages/[id]/page.tsx`
- Create: `src/components/funnel/landing-page-editor.tsx`
- Create: `src/components/funnel/landing-page-preview.tsx`
- Create: `src/components/funnel/ab-test-panel.tsx`

- [ ] **Step 1: Write landing pages list**

Shows all landing pages in a table/grid with: title, slug (as link to /lp/slug), status badge, visitor/conversion counts, A/B test indicator. Link to create new.

- [ ] **Step 2: Write landing page editor**

Block-based editor: add blocks (hero, text, CTA, form, image, testimonial) from a toolbar. Each block has editable fields (inputs for heading, subheading, URL, etc.). @dnd-kit for reordering blocks. Outputs `PageBlock[]`.

- [ ] **Step 3: Write landing page preview**

Renders the current blocks using `LandingPageBlock` in a preview iframe or bordered container.

- [ ] **Step 4: Write A/B test panel**

Shows: enable/disable toggle, variant B editor (same block editor), live stats table (variant A vs B: visitors, conversions, rate), significance indicator from `calculateABTestSignificance`, manual "Select Winner" button.

- [ ] **Step 5: Write new page**

Title input, slug input, block editor, lead magnet selector, save button.

- [ ] **Step 6: Write edit page**

Loads landing page by ID. Shows editor + preview side by side. A/B test panel below. Publish/archive buttons.

- [ ] **Step 7: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/funnel/landing-pages/ src/components/funnel/landing-page-editor.tsx src/components/funnel/landing-page-preview.tsx src/components/funnel/ab-test-panel.tsx
git commit -m "feat: add landing page editor with block builder, preview, and A/B testing panel"
```

---

### Task 12: Lead Magnets Pages

**Files:**
- Create: `src/app/(dashboard)/funnel/lead-magnets/page.tsx`
- Create: `src/app/(dashboard)/funnel/lead-magnets/new/page.tsx`
- Create: `src/components/funnel/lead-magnet-card.tsx`

- [ ] **Step 1: Write lead magnet card**

Card showing title, description, file type badge, download count. Delete button.

- [ ] **Step 2: Write list page**

Grid of LeadMagnetCards. "Create New" button.

- [ ] **Step 3: Write create page**

Form with: title, description, file upload (Supabase Storage), file type, delivery email subject, delivery email body (textarea). Save via `createLeadMagnet`.

- [ ] **Step 4: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/funnel/lead-magnets/ src/components/funnel/lead-magnet-card.tsx
git commit -m "feat: add lead magnets list and create pages with file upload and delivery email"
```

---

### Task 13: Email Sequence Builder

**Files:**
- Create: `src/app/(dashboard)/funnel/sequences/page.tsx`
- Create: `src/app/(dashboard)/funnel/sequences/new/page.tsx`
- Create: `src/app/(dashboard)/funnel/sequences/[id]/page.tsx`
- Create: `src/components/funnel/sequence-builder.tsx`
- Create: `src/components/funnel/sequence-step.tsx`
- Create: `src/components/funnel/sequence-analytics.tsx`

- [ ] **Step 1: Write sequence step component**

Renders one step card. Email: subject input + body textarea. Delay: minutes input with helper text. Condition: type dropdown + value input + true/false next-step selectors. Delete button.

- [ ] **Step 2: Write sequence builder**

Vertical chain of SequenceStep components. "Add Step" buttons between steps (dropdown: Email, Delay, Condition). Saves all steps via `saveSequenceSteps`. Drag handle on each step for reordering via @dnd-kit.

- [ ] **Step 3: Write sequence analytics**

Shows enrollment stats (total, active, completed) and email stats (open rate, click rate) from `getSequenceAnalytics`.

- [ ] **Step 4: Write list page**

Table of sequences with: name, status badge, trigger type, "Edit" link.

- [ ] **Step 5: Write new page**

Form: name, description, trigger type (dropdown), trigger value (conditional input). Save via `createSequence`, redirect to edit page.

- [ ] **Step 6: Write edit page**

Loads sequence + steps. Shows: name/description/trigger config at top, sequence builder in middle, analytics at bottom. Status toggle (draft/active/paused).

- [ ] **Step 7: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/funnel/sequences/ src/components/funnel/sequence-builder.tsx src/components/funnel/sequence-step.tsx src/components/funnel/sequence-analytics.tsx
git commit -m "feat: add email sequence visual builder with step types, analytics, and trigger config"
```

---

### Task 14: Forms Pages

**Files:**
- Create: `src/app/(dashboard)/funnel/forms/page.tsx`
- Create: `src/app/(dashboard)/funnel/forms/new/page.tsx`
- Create: `src/app/(dashboard)/funnel/forms/[id]/page.tsx`
- Create: `src/components/funnel/form-builder.tsx`
- Create: `src/components/funnel/form-embed-code.tsx`

- [ ] **Step 1: Write form builder**

Configure form: title, fields (name + email are always present, add custom fields), style variant (inline/popup/slide-in), auto-tag contacts on submission.

- [ ] **Step 2: Write embed code generator**

Generates HTML snippet: `<div>` with form fields + `<script>` tag that POSTs to `/api/forms/[id]/submit`. Includes Turnstile widget. Copy-to-clipboard button.

- [ ] **Step 3: Write list page**

Table with: form title, submission count, created date, "Edit" link.

- [ ] **Step 4: Write new page**

Form builder + save. Creates a landing_page entry with `blocks: [{ type: "form", ... }]` to reuse the same infrastructure.

- [ ] **Step 5: Write edit page**

Form builder + embed code + submissions table showing recent entries.

- [ ] **Step 6: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add src/app/\(dashboard\)/funnel/forms/ src/components/funnel/form-builder.tsx src/components/funnel/form-embed-code.tsx
git commit -m "feat: add form builder with embed code generator and submission tracking"
```

---

### Task 15: Sequence Execution Edge Function

**Files:**
- Create: `supabase/functions/process-sequences/index.ts`

- [ ] **Step 1: Write the Edge Function**

This function is called by pg_cron every 5 minutes. It:
1. Queries `sequence_enrollments` where `status = 'active'` and `next_send_at <= now()`
2. For each enrollment, loads the current step
3. If step is `email`: sends via Resend, logs to `email_sends`, advances to next step
4. If step is `delay`: calculates next_send_at, updates enrollment
5. If step is `condition`: evaluates against contact data, follows true/false branch
6. If no next step: marks enrollment as `completed`

Uses the sequence engine logic from `sequence-engine.ts` (copy the pure functions since Edge Functions run in Deno).

- [ ] **Step 2: Write pg_cron setup SQL comment**

Add a comment in the migration or a separate file documenting the pg_cron setup:
```sql
-- Run in Supabase Dashboard > SQL Editor:
-- select cron.schedule('process-sequences', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-sequences',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
--   );
-- $$);
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eremiagabriel/Desktop/Projects/marketing
git add supabase/functions/
git commit -m "feat: add sequence execution Edge Function for pg_cron processing"
```

---

### Task 16: Verify Funnel Module

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

Expected: All tests pass (existing 22 + new funnel tests).

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
git commit -m "fix: resolve lint and build issues in funnel module"
```
