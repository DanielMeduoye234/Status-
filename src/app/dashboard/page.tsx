'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  FileText, 
  FileSpreadsheet, 
  ArrowRight, 
  Calendar, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Plus, 
  Users, 
  ChevronRight,
  BarChart3
} from 'lucide-react';
import ProjectModal from '@/components/ProjectModal';

export default function DashboardPage() {
  const { user, projects, activeProject, meetingSummaries, monthlyReports } = useAuth();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Calculate action item counts
  const totalActionItems = meetingSummaries.reduce((acc, curr) => {
    return acc + (curr.action_items?.length || 0);
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                  Project Manager Workspace
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {activeProject ? `Project: ${activeProject.name}` : 'All Projects'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome, {user?.email ? user.email.split('@')[0] : 'Project Lead'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Upload your Zoom meeting transcripts to generate instant meeting summaries, speaker breakdowns, and consolidated monthly status reports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Active Projects</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Meeting Summaries</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{meetingSummaries.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Monthly Reports</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{monthlyReports.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Action Items Extracted</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalActionItems}</p>
            </div>
          </div>
        </div>

        {/* THE 2 CORE PM ACTION BOXES */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Status Generation Workflows</h2>
              <p className="text-xs text-slate-500">Choose what report you want to generate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BOX 1: MEETING SUMMARIES */}
            <Link
              href="/meeting-summary"
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    Single Meeting
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Meeting Summary & Who Said What
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Upload a single Zoom TXT meeting transcript. Automatically extract speaker breakdown (&ldquo;Who Said What&rdquo;), commitments, key decisions, and actionable task matrix.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100">
                    👥 Speaker Attribution
                  </span>
                  <span className="rounded bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100">
                    ✅ Action Items & Deadlines
                  </span>
                  <span className="rounded bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100">
                    📋 Decisions Log
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  Upload Zoom Transcript (.TXT)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* BOX 2: MONTHLY STATUS REPORT */}
            <Link
              href="/monthly-report"
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    Monthly Synthesis
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Monthly Status Report
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Synthesize an executive monthly status report. Supports two generation modes: upload all TXT files for the month, or aggregate from saved meeting summaries for a project.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100">
                    📂 Batch TXT Upload
                  </span>
                  <span className="rounded bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100">
                    🔄 Aggregate from Meetings
                  </span>
                  <span className="rounded bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-100">
                    🏆 Milestones & Risk Matrix
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  Generate Monthly Report
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Meeting Summaries */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Meeting Summaries</h3>
              </div>
              <Link
                href="/meeting-summary"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {meetingSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Upload className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No meeting summaries yet.</p>
                <Link
                  href="/meeting-summary"
                  className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Upload First Meeting TXT
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {meetingSummaries.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:border-slate-300 transition-colors flex items-center justify-between"
                  >
                    <div className="truncate pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {item.meeting_date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-slate-400" />
                          {item.participants?.length || 2} attendees
                        </span>
                        {item.action_items && item.action_items.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-semibold">
                              {item.action_items.length} actions
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/meeting-summary?id=${item.id}`}
                      className="flex-shrink-0 rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Monthly Reports */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Monthly Status Reports</h3>
              </div>
              <Link
                href="/monthly-report"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {monthlyReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileSpreadsheet className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No monthly reports compiled yet.</p>
                <Link
                  href="/monthly-report"
                  className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Compile Monthly Report
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {monthlyReports.slice(0, 4).map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:border-slate-300 transition-colors flex items-center justify-between"
                  >
                    <div className="truncate pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">{report.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-emerald-700 border border-emerald-200 uppercase text-[10px] font-bold">
                          {report.health_status.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span>Period: {report.month_year}</span>
                      </div>
                    </div>
                    <Link
                      href={`/monthly-report?id=${report.id}`}
                      className="flex-shrink-0 rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Modal */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
