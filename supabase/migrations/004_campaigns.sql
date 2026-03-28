-- Campaigns
create table public.campaigns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  campaign_type text not null check (campaign_type in ('product_launch', 'seasonal', 'evergreen', 'event')),
  objective text,
  audience_segment text,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  start_date date,
  end_date date,
  total_budget decimal(10,2),
  kpis jsonb default '{}',
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_created_by on public.campaigns(created_by);
create index idx_campaigns_dates on public.campaigns(start_date, end_date);

alter table public.campaigns enable row level security;

create policy "Campaigns owner full access" on public.campaigns for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Campaigns team read" on public.campaigns for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

create trigger campaigns_updated_at before update on public.campaigns
  for each row execute procedure public.update_updated_at();

-- Campaign channels
create table public.campaign_channels (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  channel text not null,
  planned_budget decimal(10,2),
  actual_spend decimal(10,2),
  target_impressions int,
  target_clicks int,
  target_conversions int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_campaign_channels_campaign on public.campaign_channels(campaign_id);

alter table public.campaign_channels enable row level security;

create policy "Campaign channels owner full access" on public.campaign_channels for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Campaign channels team read" on public.campaign_channels for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

create trigger campaign_channels_updated_at before update on public.campaign_channels
  for each row execute procedure public.update_updated_at();

-- Campaign content
create table public.campaign_content (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  content_item_id uuid references public.content_items(id) on delete cascade,
  sequence_id uuid references public.email_sequences(id) on delete cascade,
  created_at timestamptz default now(),
  constraint campaign_content_one_non_null check (
    content_item_id is not null or sequence_id is not null
  )
);

create index idx_campaign_content_campaign on public.campaign_content(campaign_id);
create index idx_campaign_content_item on public.campaign_content(content_item_id);
create index idx_campaign_content_sequence on public.campaign_content(sequence_id);

alter table public.campaign_content enable row level security;

create policy "Campaign content owner full access" on public.campaign_content for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Campaign content team read" on public.campaign_content for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

-- Budget entries
create table public.budget_entries (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  channel text,
  description text not null,
  entry_type text not null check (entry_type in ('planned', 'actual')),
  amount decimal(10,2) not null,
  date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_budget_entries_campaign on public.budget_entries(campaign_id);
create index idx_budget_entries_type on public.budget_entries(entry_type);

alter table public.budget_entries enable row level security;

create policy "Budget entries owner full access" on public.budget_entries for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Budget entries team read" on public.budget_entries for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

create trigger budget_entries_updated_at before update on public.budget_entries
  for each row execute procedure public.update_updated_at();

-- Analytics events
create table public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,
  event_data jsonb default '{}',
  contact_id uuid references public.contacts(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  channel text,
  source text,
  revenue decimal(10,2),
  created_at timestamptz default now()
);

create index idx_analytics_events_type on public.analytics_events(event_type, created_at);
create index idx_analytics_events_contact on public.analytics_events(contact_id);
create index idx_analytics_events_campaign on public.analytics_events(campaign_id);
create index idx_analytics_events_channel on public.analytics_events(channel);
create index idx_analytics_events_created_at on public.analytics_events(created_at);

alter table public.analytics_events enable row level security;

create policy "Analytics events owner full access" on public.analytics_events for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Analytics events team read" on public.analytics_events for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));
create policy "Analytics events public insert" on public.analytics_events for insert
  with check (true);

-- Dashboard widgets
create table public.dashboard_widgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  widget_type text not null,
  config jsonb default '{}',
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_dashboard_widgets_user on public.dashboard_widgets(user_id);

alter table public.dashboard_widgets enable row level security;

create policy "Dashboard widgets owner full access" on public.dashboard_widgets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Dashboard widgets team read" on public.dashboard_widgets for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

create trigger dashboard_widgets_updated_at before update on public.dashboard_widgets
  for each row execute procedure public.update_updated_at();

-- Reports
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  report_type text not null check (report_type in ('weekly', 'monthly', 'campaign', 'custom')),
  date_from date,
  date_to date,
  data jsonb default '{}',
  pdf_path text,
  status text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_reports_created_by on public.reports(created_by);
create index idx_reports_type on public.reports(report_type);
create index idx_reports_status on public.reports(status);

alter table public.reports enable row level security;

create policy "Reports owner full access" on public.reports for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Reports team read" on public.reports for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

create trigger reports_updated_at before update on public.reports
  for each row execute procedure public.update_updated_at();

-- Report schedules
create table public.report_schedules (
  id uuid default gen_random_uuid() primary key,
  report_type text not null check (report_type in ('weekly', 'monthly', 'campaign', 'custom')),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  recipients text[] not null default '{}',
  next_run_at timestamptz,
  enabled boolean not null default true,
  config jsonb default '{}',
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_report_schedules_created_by on public.report_schedules(created_by);
create index idx_report_schedules_next_run on public.report_schedules(next_run_at) where enabled = true;

alter table public.report_schedules enable row level security;

create policy "Report schedules owner full access" on public.report_schedules for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Report schedules team read" on public.report_schedules for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'team'));

create trigger report_schedules_updated_at before update on public.report_schedules
  for each row execute procedure public.update_updated_at();
