# Hexavia Status 🚀

> **AI-Powered Meeting Summaries & Monthly Executive Status Reports for Project Managers**

Hexavia Status simplifies PM workflows by transforming raw Zoom transcripts into structured meeting minutes, actionable next steps, speaker breakdowns, and consolidated monthly executive reports powered by **Google Gemini** and backed by **Supabase PostgreSQL**.

---

## ✨ Features

- **Zoom Transcript Parsing**: Robust parser supporting WebVTT, Zoom in-meeting chat exports, bracketed timestamps, and parenthesized timestamps.
- **AI Executive Summaries**: Powered by Google Gemini with an automatic multi-model failover cascade (`gemini-3.7-flash` ➔ `gemini-3.5-flash` ➔ `gemini-flash-lite-latest`) for 100% uptime.
- **Structured Meeting Artifacts**: Automatically extracts:
  - Executive Overview
  - Who-Said-What Speaker Attribution
  - Action Items (with priority, owner, and deadlines)
  - Key Decisions Log
  - Key Blockers & Risks
- **Monthly Status Report Synthesis**: Synthesize multiple meeting summaries or bulk transcript uploads across a project into a publication-ready monthly executive report.
- **Cloud Database & Multi-Tenant Security**: Built on Supabase PostgreSQL with strict Row Level Security (RLS) policies isolating user data.
- **Local Fallback Mode**: Gracefully operates even when offline or testing without cloud credentials.
- **Export Capabilities**: 1-click Markdown copy and print/PDF formatting.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **AI Engine**: [Google Generative AI SDK](https://ai.google.dev/) (Gemini 3.x Flash)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/DanielMeduoye234/Status-.git
cd Status-
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider Key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Initialize the Database Schema

Run the SQL statements from [`supabase/schema.sql`](./supabase/schema.sql) in your **Supabase Dashboard ➔ SQL Editor** to create the required tables (`profiles`, `projects`, `meeting_summaries`, `monthly_reports`) and RLS policies.

### 4. Run Development Server

```bash
npm run dev
# On Windows PowerShell if script execution is restricted:
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security

- `.env.local` is git-ignored and never committed.
- Row Level Security (RLS) enforces tenant-level data isolation via `auth.uid() = user_id`.
