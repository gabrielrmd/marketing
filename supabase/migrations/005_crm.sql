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
