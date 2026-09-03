-- ==============================================================================
-- STATUS PLATFORM: SUPABASE POSTGRESQL SCHEMA
-- Designed for Project Managers: Meeting Summaries & Monthly Status Reports
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Mirrors auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'Project Manager',
  organization text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROJECTS TABLE
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  client_name text,
  color text default '#6366f1',
  status text default 'active' check (status in ('active', 'completed', 'on_hold', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MEETING SUMMARIES TABLE
create table if not exists public.meeting_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  meeting_date date not null default current_date,
  file_name text,
  raw_transcript text,
  summary_markdown text not null,
  executive_summary text,
  who_said_what jsonb default '[]'::jsonb,
  action_items jsonb default '[]'::jsonb,
  key_decisions jsonb default '[]'::jsonb,
  key_blockers jsonb default '[]'::jsonb,
  participants text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. MONTHLY STATUS REPORTS TABLE
create table if not exists public.monthly_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  month_year text not null, -- Format: YYYY-MM, e.g., '2026-09'
  source_type text not null check (source_type in ('uploaded_txts', 'meeting_summaries')),
  source_summary_ids uuid[] default array[]::uuid[],
  generated_report_markdown text not null,
  executive_summary text,
  health_status text default 'on_track' check (health_status in ('on_track', 'at_risk', 'delayed', 'completed')),
  milestones_achieved jsonb default '[]'::jsonb,
  in_progress_items jsonb default '[]'::jsonb,
  risks_blockers jsonb default '[]'::jsonb,
  decisions_log jsonb default '[]'::jsonb,
  contributor_highlights jsonb default '[]'::jsonb,
  next_month_goals jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.meeting_summaries enable row level security;
alter table public.monthly_reports enable row level security;

-- Profiles: Users can view & update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Projects: Users can full CRUD their own projects
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Meeting Summaries: Users can full CRUD their own meeting summaries
create policy "Users can view own meeting summaries" on public.meeting_summaries
  for select using (auth.uid() = user_id);

create policy "Users can create own meeting summaries" on public.meeting_summaries
  for insert with check (auth.uid() = user_id);

create policy "Users can update own meeting summaries" on public.meeting_summaries
  for update using (auth.uid() = user_id);

create policy "Users can delete own meeting summaries" on public.meeting_summaries
  for delete using (auth.uid() = user_id);

-- Monthly Reports: Users can full CRUD their own monthly reports
create policy "Users can view own monthly reports" on public.monthly_reports
  for select using (auth.uid() = user_id);

create policy "Users can create own monthly reports" on public.monthly_reports
  for insert with check (auth.uid() = user_id);

create policy "Users can update own monthly reports" on public.monthly_reports
  for update using (auth.uid() = user_id);

create policy "Users can delete own monthly reports" on public.monthly_reports
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Project Manager')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes for performance
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_meeting_summaries_user_id on public.meeting_summaries(user_id);
create index if not exists idx_meeting_summaries_project_id on public.meeting_summaries(project_id);
create index if not exists idx_meeting_summaries_date on public.meeting_summaries(meeting_date);
create index if not exists idx_monthly_reports_user_id on public.monthly_reports(user_id);
create index if not exists idx_monthly_reports_project_id on public.monthly_reports(project_id);
create index if not exists idx_monthly_reports_month_year on public.monthly_reports(month_year);
