'use client';

import React, { useState, useEffect } from 'react';
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
  Sliders,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Globe
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copiedSql, setCopiedSql] = useState(false);
  const isDbConnected = isSupabaseConfigured();

  const [recallInfo, setRecallInfo] = useState<{
    configured: boolean;
    region: string;
    checking: boolean;
    totalBots?: number;
    error?: string;
  }>({
    configured: false,
    region: 'us-west-2',
    checking: true,
  });

  const [testApiKey, setTestApiKey] = useState('');
  const [testRegion, setTestRegion] = useState('us-west-2');
  const [isTestingRecall, setIsTestingRecall] = useState(false);
  const [testRecallResult, setTestRecallResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const checkRecallStatus = async () => {
    setRecallInfo((prev) => ({ ...prev, checking: true }));
    try {
      const res = await fetch('/api/bot/test-connection');
      const data = await res.json();
      setRecallInfo({
        configured: Boolean(data.configured),
        region: data.region || 'us-west-2',
        checking: false,
        totalBots: data.totalBots,
      });
      if (data.region) setTestRegion(data.region);
    } catch {
      setRecallInfo({ configured: false, region: 'us-west-2', checking: false });
    }
  };

  useEffect(() => {
    checkRecallStatus();
  }, []);

  const handleTestRecallKey = async () => {
    setIsTestingRecall(true);
    setTestRecallResult(null);
    try {
      const res = await fetch('/api/bot/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: testApiKey.trim() || undefined,
          region: testRegion,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestRecallResult({
          ok: true,
          message: `Connection Verified! Successfully authenticated with Recall.ai (${data.region}). Found ${data.totalBots ?? 0} existing bot recordings.`,
        });
        checkRecallStatus();
      } else {
        setTestRecallResult({
          ok: false,
          message: data.error || 'Failed to authenticate with Recall.ai. Please verify API key and region.',
        });
      }
    } catch (err: any) {
      setTestRecallResult({
        ok: false,
        message: err.message || 'Network error testing Recall.ai API key.',
      });
    } finally {
      setIsTestingRecall(false);
    }
  };

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
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Recall.ai Meeting Notetaker Integration</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    Autonomous Bot
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Send real AI notetaker bots into Google Meet, Zoom, MS Teams, and Webex calls
                </p>
              </div>
            </div>

            <div>
              {recallInfo.checking ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Checking Recall.ai...</span>
                </span>
              ) : recallInfo.configured ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Recall.ai Live Connected ({recallInfo.region})</span>
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Interactive Simulation Mode</span>
                </span>
              )}
            </div>
          </div>

          {/* Section: Default Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
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
                Display name shown in Google Meet, Zoom, and MS Teams participant roster.
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
                Notifies attendees: &ldquo;Hello! I am Hexavia Notetaker recording for PM notes.&rdquo;
              </p>
            </div>
          </div>

          {/* Section: Recall.ai API Key & Connection Tester */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recall.ai API Key & Region Tester
                </h4>
              </div>
              <a
                href="https://recall.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Get Recall.ai API Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  API Key (Optional if set in .env.local)
                </label>
                <input
                  type="password"
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  placeholder={recallInfo.configured ? 'Using RECALL_AI_API_KEY from .env.local' : 'Paste Recall.ai API token...'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Recall.ai Region
                </label>
                <select
                  value={testRegion}
                  onChange={(e) => setTestRegion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="eu-central-1">Europe (Frankfurt)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestRecallKey}
                disabled={isTestingRecall}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTestingRecall ? 'animate-spin' : ''}`} />
                <span>{isTestingRecall ? 'Testing Connection...' : 'Test Recall.ai Connection'}</span>
              </button>
              
              <button
                type="button"
                onClick={checkRecallStatus}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Re-check Environment
              </button>
            </div>

            {testRecallResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 animate-in fade-in ${
                  testRecallResult.ok
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                {testRecallResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>{testRecallResult.message}</div>
              </div>
            )}
          </div>

          {/* Section: Webhook Configuration */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                Webhook Receiver URL (Optional for Asynchronous Updates)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Svix Compatible</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Paste this URL into your Recall.ai Webhooks Dashboard if you wish to receive real-time webhook callbacks:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/bot/recall/webhook` : 'https://your-domain.com/api/bot/recall/webhook'}
              </code>
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/api/bot/recall/webhook` : 'https://your-domain.com/api/bot/recall/webhook';
                  navigator.clipboard.writeText(url);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section: What to Add instructions */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-blue-900">What You Need to Add for Live Meetings</h4>
            </div>
            <div className="text-xs text-blue-900 space-y-1.5 leading-relaxed">
              <p>
                To enable the bot to join real Google Meet, Zoom, MS Teams, or Webex calls:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 pl-1">
                <li>Create an account at <a href="https://www.recall.ai" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-950">recall.ai</a>.</li>
                <li>Copy your API key from the Recall.ai dashboard.</li>
                <li>Add the following environment variables to your <code>.env.local</code> file:
                  <div className="my-1.5 p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] select-all">
                    RECALL_AI_API_KEY=your_recall_api_key_here<br />
                    RECALL_AI_REGION=us-west-2
                  </div>
                </li>
                <li>Restart your Next.js dev server or deploy with the new environment variables.</li>
              </ol>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
