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
