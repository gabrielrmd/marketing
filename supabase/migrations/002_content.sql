-- Content items: posts, articles, episodes
create table public.content_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique,
  body jsonb default '{}',
  body_text text default '',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  content_type text not null default 'educational' check (content_type in ('educational', 'promotional', 'community', 'storytelling')),
  channel text not null check (channel in ('linkedin', 'email', 'youtube', 'instagram', 'blog', 'podcast')),
  pillar text check (pillar in ('library', 'challenge', 'circle', 'stage', 'summit', 'stories')),
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

create table public.content_versions (
  id uuid default gen_random_uuid() primary key,
  content_item_id uuid references public.content_items(id) on delete cascade not null,
  title text not null,
  body jsonb not null,
  metadata jsonb default '{}',
  version_number int not null,
  created_at timestamptz default now()
);

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
