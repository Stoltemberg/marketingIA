-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  url text not null,
  target_audience text,
  country text,
  daily_budget numeric,
  conversion_goal text,
  brand_voice text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Campaigns table
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  meta_campaign_id text,
  status text default 'PAUSED',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ad Sets table
create table ad_sets (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  meta_adset_id text,
  budget numeric,
  audience jsonb,
  status text default 'PAUSED'
);

-- Ads table
create table ads (
  id uuid primary key default uuid_generate_v4(),
  ad_set_id uuid references ad_sets(id) on delete cascade not null,
  meta_ad_id text,
  copy text,
  headline text,
  creative_url text,
  status text default 'PAUSED'
);

-- Metrics Daily table
create table metrics_daily (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  impressions integer default 0,
  clicks integer default 0,
  ctr numeric default 0.0,
  cpc numeric default 0.0,
  conversions integer default 0,
  cpa numeric default 0.0,
  spend numeric default 0.0,
  date date not null
);

-- AI Recommendations table
create table ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  recommendation jsonb not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table projects enable row level security;
alter table campaigns enable row level security;
alter table ad_sets enable row level security;
alter table ads enable row level security;
alter table metrics_daily enable row level security;
alter table ai_recommendations enable row level security;

-- Policies for projects
create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can create own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

-- Policies for campaigns
create policy "Users can view own campaigns" on campaigns for select using (
  exists (select 1 from projects where projects.id = campaigns.project_id and projects.user_id = auth.uid())
);
create policy "Users can insert own campaigns" on campaigns for insert with check (
  exists (select 1 from projects where projects.id = campaigns.project_id and projects.user_id = auth.uid())
);
create policy "Users can update own campaigns" on campaigns for update using (
  exists (select 1 from projects where projects.id = campaigns.project_id and projects.user_id = auth.uid())
);
create policy "Users can delete own campaigns" on campaigns for delete using (
  exists (select 1 from projects where projects.id = campaigns.project_id and projects.user_id = auth.uid())
);
