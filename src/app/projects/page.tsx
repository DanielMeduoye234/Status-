'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  FolderKanban, 
  Plus, 
  FileText, 
  FileSpreadsheet, 
  Briefcase,
  Trash2
} from 'lucide-react';
import ProjectModal from '@/components/ProjectModal';

export default function ProjectsPage() {
  const { projects, meetingSummaries, monthlyReports, setActiveProject, deleteProject } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Management Hub</h1>
            <p className="text-xs text-slate-500 mt-1">
              Organize meeting transcripts, track timelines, and connect monthly reports per project
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const projectMeetings = meetingSummaries.filter((m) => m.project_id === proj.id);
            const projectReports = monthlyReports.filter((r) => r.project_id === proj.id);

            return (
              <div
                key={proj.id}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: proj.color || '#2563eb' }}
                      />
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {proj.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          proj.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : proj.status === 'on_hold'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {proj.status || 'active'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete project "${proj.name}"? This will remove it from your workspace.`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {proj.client_name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      <span>{proj.client_name}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                    {proj.description || 'No description provided.'}
                  </p>

                  {/* Counts Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mb-4">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-slate-700 font-semibold">
                        {projectMeetings.length} Meetings
                      </span>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-slate-700 font-semibold">
                        {projectReports.length} Reports
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href="/meeting-summary"
                    onClick={() => setActiveProject(proj)}
                    className="flex-1 rounded-lg bg-slate-100 hover:bg-slate-200 py-2 text-center text-xs font-semibold text-slate-700 transition-colors"
                  >
                    + Meeting
                  </Link>
                  <Link
                    href="/monthly-report"
                    onClick={() => setActiveProject(proj)}
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 py-2 text-center text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    + Monthly Report
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </AppLayout>
  );
}
