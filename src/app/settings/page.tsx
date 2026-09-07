'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  Settings, 
  Key, 
  Database, 
  Copy, 
  Check, 
  ShieldCheck, 
  Info, 
  AlertCircle,
  Bot,
  Video,
  Sparkles,
  Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copiedSql, setCopiedSql] = useState(false);
  const isDbConnected = isSupabaseConfigured();

  const supabaseSqlSchema = `-- Run this in your Supabase SQL Editor:
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
  month_year text not null,
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

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.meeting_summaries enable row level security;
alter table public.monthly_reports enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can manage own meeting summaries" on public.meeting_summaries for all using (auth.uid() = user_id);
create policy "Users can manage own monthly reports" on public.monthly_reports for all using (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION TRIGGER
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes for performance
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_meeting_summaries_user_id on public.meeting_summaries(user_id);
create index if not exists idx_meeting_summaries_project_id on public.meeting_summaries(project_id);
create index if not exists idx_monthly_reports_user_id on public.monthly_reports(user_id);
create index if not exists idx_monthly_reports_project_id on public.monthly_reports(project_id);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Configuration & Keys</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Supabase PostgreSQL database, Row Level Security, and LLM providers
          </p>
        </div>

        {/* Supabase Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supabase PostgreSQL Integration</h3>
                <p className="text-xs text-slate-500">
                  Multi-tenant PM data isolation using Row Level Security (RLS)
                </p>
              </div>
            </div>
            {isDbConnected ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Supabase Configured</span>
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>Waiting for Credentials (.env.local)</span>
              </span>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                1-Click Supabase SQL Setup Script
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="max-h-48 overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200">
              {supabaseSqlSchema}
            </pre>
          </div>
        </div>

        {/* Environment Variables Reference */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Environment Configuration (.env.local)</h3>
              <p className="text-xs text-slate-500">
                Add your credentials to `.env.local` to connect live production APIs
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <p className="text-slate-500 text-[11px]"># Supabase Credentials</p>
              <p className="text-blue-700 font-semibold">NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
              <p className="text-blue-700 font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <p className="text-slate-500 text-[11px]"># AI Provider Keys (Google Gemini or OpenAI)</p>
              <p className="text-slate-800 font-semibold">GEMINI_API_KEY=AIzaSy...</p>
              <p className="text-slate-800 font-semibold">OPENAI_API_KEY=sk-proj-...</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              The platform is equipped with an intelligent engine. You can upload Zoom TXTs, test speaker breakdowns, and generate monthly reports immediately.
            </p>
          </div>
        </div>

        {/* AI Meeting Notetaker Bot Settings Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Meeting Notetaker Bot Preferences</h3>
                <p className="text-xs text-slate-500">
                  Configure default bot persona, meeting announcements, and platform parameters
                </p>
              </div>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Interactive Engine Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Default Bot Call Name
              </label>
              <input
                type="text"
                defaultValue="Hexavia Notetaker"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Display name displayed in Google Meet, Zoom, and MS Teams participant roster.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                In-Meeting Greeting Announcement
              </label>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 font-medium">Post greeting in call chat upon joining</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Posts a polite notice informing participants that the bot is recording audio for PM notes.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-blue-900">Transcription & Engine Mode</h4>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Hexavia is running in <strong>Interactive Simulation & UI Mode</strong>. You can test meeting dispatch, host admission, live soundwaves, real-time transcription streaming, and 1-click executive summary generation. Future backend integrations will support direct <code>RECALL_AI_API_KEY</code> or <code>MEETING_BAAS_API_KEY</code> environment variables.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
