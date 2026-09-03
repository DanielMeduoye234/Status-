'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Clock, 
  FileSpreadsheet, 
  BarChart3, 
  FolderKanban,
  Check,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              S
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Status</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#meeting-summaries" className="hover:text-blue-600 transition-colors">Meeting Summaries</a>
            <a href="#monthly-reports" className="hover:text-blue-600 transition-colors">Monthly Reports</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            Built Specifically for Project Managers
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            No more manual meeting notes or monthly reporting stress.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload raw Zoom TXT transcripts to instantly extract &ldquo;who said what&rdquo;, track action item deadlines, and generate executive monthly status reports.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/meeting-summary"
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Try Meeting Summarizer</span>
            </Link>
          </div>

          {/* Interactive Hero Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-200/50 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <span className="ml-2 text-xs font-semibold text-slate-500">Status Platform Dashboard</span>
              </div>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Ready for Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Meeting Summaries</h3>
                    <p className="text-xs text-slate-500">Zoom TXT Transcript Processor</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-slate-900 font-semibold">
                    <span>Sprint 24 Engineering Sync</span>
                    <span className="text-[11px] text-slate-400 font-normal">00:45:10 Duration</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    &bull; Sarah (Frontend Lead): Finished PM dashboard, PDF export pending tomorrow.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    &bull; David (Backend): RLS policies deployed, adding composite index for latency.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] text-blue-700 font-medium">
                    <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">3 Action Items</span>
                    <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-emerald-700">2 Decisions Logged</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Monthly Status Report</h3>
                    <p className="text-xs text-slate-500">Batch TXT & Summary Synthesis</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-slate-900 font-semibold">
                    <span>Hexavia Core Platform 2.0</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">ON TRACK</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    &bull; Milestones: Core database migration & UI redesign completed ahead of schedule.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    &bull; Next Month: Staging QA sign-off and stakeholder presentation on the 28th.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] text-blue-700 font-medium">
                    <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">5 Meetings Synthesized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 2 Core Pillars Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Core Capabilities</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Two powerful workflows to handle all your reporting needs
            </p>
            <p className="mt-4 text-base text-slate-600">
              Designed to solve the daily and monthly reporting workload for technical and executive Project Managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div id="meeting-summaries" className="rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 shadow-sm transition-all space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Workflow 01</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Meeting Summaries & Who Said What</h3>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  Simply upload your Zoom meeting transcript (.TXT). The platform automatically identifies attendees, maps their dialogue, and extracts clear commitments.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-700 border-t border-slate-100 pt-5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Speaker Attribution:</strong> Detailed breakdown of arguments and points made by each participant.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Action Items Matrix:</strong> Tracks assignees, deadlines, and urgency rankings (High/Medium/Low).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Decision & Blocker Log:</strong> Clear log of what was agreed upon and what risks need attention.</span>
                </div>
              </div>

              <Link
                href="/meeting-summary"
                className="inline-flex items-center gap-2 font-semibold text-sm text-blue-600 hover:text-blue-700 pt-2"
              >
                <span>Upload Zoom Meeting TXT</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div id="monthly-reports" className="rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 shadow-sm transition-all space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Workflow 02</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Monthly Status Report Generator</h3>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  Generate comprehensive executive monthly reports. Choose between two effortless generation methods based on your preference.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-700 border-t border-slate-100 pt-5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Method A (Batch TXT Upload):</strong> Upload all raw Zoom TXT files recorded throughout the month.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Method B (Project Meeting Aggregator):</strong> 1-click synthesis from saved meeting summaries for that project.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Executive Format:</strong> Milestones, In-Progress items, Risk Matrix, Decisions, and Next Month Roadmap.</span>
                </div>
              </div>

              <Link
                href="/monthly-report"
                className="inline-flex items-center gap-2 font-semibold text-sm text-blue-600 hover:text-blue-700 pt-2"
              >
                <span>Generate Monthly Report</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple 3-Step Process</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
              From raw Zoom file to finished executive report
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Upload or Select Project</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Provide your Zoom meeting TXT file or choose a project workspace with dates to aggregate existing meetings.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Automated Synthesis</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The engine cleans dialogue, identifies who said what, structures action items with deadlines, and logs decisions.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Export & Share</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Copy formatted Markdown with one click, print or save to PDF, and store safely in your Supabase database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 sm:p-12 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to streamline your project reporting?
            </h2>
            <p className="mt-3 text-slate-300 text-sm max-w-xl mx-auto">
              Join project managers saving hours each week on meeting minutes and executive stakeholder decks.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Status Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                Sign In with Supabase
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-slate-50 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white text-[10px] font-bold">
              S
            </div>
            <span>Status Platform</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Status. Project Management Reporting System.</p>
        </div>
      </footer>
    </div>
  );
}
