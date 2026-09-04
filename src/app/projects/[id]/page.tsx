'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  FolderKanban, 
  Plus, 
  FileText, 
  FileSpreadsheet, 
  Briefcase, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Trash2, 
  CheckSquare, 
  ChevronRight,
  ListTodo,
  Scale
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { 
    projects, 
    meetingSummaries, 
    monthlyReports, 
    loading, 
    updateProject, 
    deleteProject, 
    deleteMeetingSummary,
    setActiveProject 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'meetings' | 'reports' | 'actions' | 'decisions'>('meetings');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Find the target project
  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  // Filter meeting summaries belonging to this project
  const projectMeetings = useMemo(() => {
    return meetingSummaries
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => new Date(b.meeting_date || 0).getTime() - new Date(a.meeting_date || 0).getTime());
  }, [meetingSummaries, projectId]);

  // Filter monthly reports belonging to this project
  const projectReports = useMemo(() => {
    return monthlyReports
      .filter((r) => r.project_id === projectId)
      .sort((a, b) => (b.month_year || '').localeCompare(a.month_year || ''));
  }, [monthlyReports, projectId]);

  // Consolidated action items across all meetings in this project
  const allActionItems = useMemo(() => {
    return projectMeetings.flatMap((m) => 
      (m.action_items || []).map((item: any, idx: number) => ({
        ...item,
        id: `${m.id}-${idx}`,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.meeting_date,
      }))
    );
  }, [projectMeetings]);

  // Consolidated decisions across all meetings in this project
  const allDecisions = useMemo(() => {
    return projectMeetings.flatMap((m) =>
      (m.key_decisions || []).map((decision: string, idx: number) => ({
        decision,
        id: `${m.id}-dec-${idx}`,
        meetingId: m.id,
        meetingTitle: m.title,
        meetingDate: m.meeting_date,
      }))
    );
  }, [projectMeetings]);

  // Filtered meetings by search query
  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return projectMeetings;
    const q = searchQuery.toLowerCase();
    return projectMeetings.filter((m) => {
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchExec = (m.executive_summary || '').toLowerCase().includes(q);
      const matchDate = (m.meeting_date || '').toLowerCase().includes(q);
      const matchParticipant = (m.participants || []).some((p) => p.toLowerCase().includes(q));
      return matchTitle || matchExec || matchDate || matchParticipant;
    });
  }, [projectMeetings, searchQuery]);

  const handleStatusChange = async (newStatus: 'active' | 'completed' | 'on_hold' | 'archived') => {
    if (!project) return;
    setIsUpdatingStatus(true);
    try {
      await updateProject(project.id, { status: newStatus });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
      await deleteProject(project.id);
      router.push('/projects');
    }
  };

  const handleDeleteMeeting = async (meetingId: string, title: string) => {
    if (window.confirm(`Delete meeting summary "${title}" from project records?`)) {
      await deleteMeetingSummary(meetingId);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-36 bg-slate-200 rounded"></div>
          <div className="h-36 bg-white border border-slate-200 rounded-2xl p-6"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-20 bg-slate-200 rounded-xl"></div>
            <div className="h-20 bg-slate-200 rounded-xl"></div>
            <div className="h-20 bg-slate-200 rounded-xl"></div>
            <div className="h-20 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mx-auto mb-4 border border-amber-100">
            <FolderKanban className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            The project you are looking for might have been deleted or does not exist in your workspace.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 mt-6 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Projects Hub</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/projects" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Projects Hub</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-900 truncate max-w-xs">{project.name}</span>
        </div>

        {/* Project Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: project.color || '#2563eb' }}
                />
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {project.name}
                </h1>

                {/* Status Dropdown */}
                <select
                  value={project.status || 'active'}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors ${
                    project.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : project.status === 'on_hold'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : project.status === 'completed'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {project.client_name && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>Client: <strong className="text-slate-800">{project.client_name}</strong></span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {project.description || 'No description provided for this project.'}
              </p>
            </div>

            {/* Quick PM Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <Link
                href={`/meeting-summary?projectId=${project.id}`}
                onClick={() => setActiveProject(project)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Record Meeting</span>
              </Link>

              <Link
                href={`/monthly-report?projectId=${project.id}`}
                onClick={() => setActiveProject(project)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all"
              >
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <span>Monthly Report</span>
              </Link>

              <button
                onClick={handleDeleteProject}
                className="rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 p-2 text-slate-400 hover:text-rose-600 transition-colors shadow-xs"
                title="Delete Project"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Project Metrics Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Meeting Records</span>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{projectMeetings.length}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Monthly Reports</span>
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{projectReports.length}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Action Items Tracked</span>
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{allActionItems.length}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Key Decisions</span>
                <Scale className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{allDecisions.length}</p>
            </div>
          </div>
        </div>

        {/* Workspace Record Navigation Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-bold transition-all ${
                activeTab === 'meetings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Meeting Summaries & Records</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === 'meetings' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {projectMeetings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Monthly Status Reports</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === 'reports' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {projectReports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-bold transition-all ${
                activeTab === 'actions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ListTodo className="h-4 w-4" />
              <span>Action Items Matrix</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === 'actions' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {allActionItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('decisions')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-bold transition-all ${
                activeTab === 'decisions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Scale className="h-4 w-4" />
              <span>Decisions Log</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === 'decisions' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {allDecisions.length}
              </span>
            </button>
          </nav>
        </div>

        {/* TAB 1: MEETING SUMMARIES & RECORDS */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            {projectMeetings.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search meetings by title, date, or attendee..."
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Showing <strong>{filteredMeetings.length}</strong> of {projectMeetings.length} meeting records</span>
                </div>
              </div>
            )}

            {/* Meetings List */}
            {projectMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Meeting Summaries Recorded Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">
                  Keep a complete, audit-proof history of this project. Upload your Zoom meeting transcripts (.TXT) to automatically generate &lsquo;Who Said What&rsquo; breakdowns, action items, and decisions.
                </p>
                <Link
                  href={`/meeting-summary?projectId=${project.id}`}
                  onClick={() => setActiveProject(project)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record First Meeting for {project.name}</span>
                </Link>
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-xs text-slate-500">No meeting summaries matched &ldquo;{searchQuery}&rdquo;</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {meeting.title}
                          </h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 flex items-center gap-1 border border-slate-200">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {meeting.meeting_date}
                          </span>
                          {meeting.file_name && (
                            <span className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200">
                              {meeting.file_name}
                            </span>
                          )}
                        </div>

                        {/* Executive Summary Snippet */}
                        {meeting.executive_summary && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                            {meeting.executive_summary}
                          </p>
                        )}
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-start">
                        <Link
                          href={`/meeting-summary?id=${meeting.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 text-xs font-semibold transition-all shadow-xs"
                        >
                          <span>Open Full Summary</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete meeting summary"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges & Attendees */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      {/* Attendees */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">Attendees:</span>
                        {meeting.participants && meeting.participants.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {meeting.participants.map((p, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Extracted from dialog</span>
                        )}
                      </div>

                      {/* Counts / Metrics */}
                      <div className="flex items-center gap-2">
                        {meeting.action_items && meeting.action_items.length > 0 && (
                          <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                            <CheckSquare className="h-3 w-3 text-emerald-600" />
                            {meeting.action_items.length} Actions
                          </span>
                        )}
                        {meeting.key_decisions && meeting.key_decisions.length > 0 && (
                          <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                            <Scale className="h-3 w-3 text-blue-600" />
                            {meeting.key_decisions.length} Decisions
                          </span>
                        )}
                        {meeting.key_blockers && meeting.key_blockers.length > 0 && (
                          <span className="rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                            {meeting.key_blockers.length} Blockers
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview of Action Items if available */}
                    {meeting.action_items && meeting.action_items.length > 0 && (
                      <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Key Deliverables from this meeting:
                        </span>
                        {meeting.action_items.slice(0, 3).map((act: any, actIdx: number) => (
                          <div key={actIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium text-slate-800">{act.task || act.item || JSON.stringify(act)}</span>
                              {act.owner && (
                                <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                                  Owner: {act.owner}
                                </span>
                              )}
                              {act.deadline && (
                                <span className="ml-1 text-[10px] text-slate-400">
                                  Due: {act.deadline}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {meeting.action_items.length > 3 && (
                          <p className="text-[10px] font-semibold text-blue-600 pt-1">
                            +{meeting.action_items.length - 3} more action items in full summary
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MONTHLY STATUS REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {projectReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                  <FileSpreadsheet className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Monthly Reports Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">
                  Synthesize an executive report summarizing milestones, contributor highlights, risk matrices, and next month goals for {project.name}.
                </p>
                <Link
                  href={`/monthly-report?projectId=${project.id}`}
                  onClick={() => setActiveProject(project)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Generate First Monthly Report</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 font-mono">
                            {report.month_year}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {report.title}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            report.health_status === 'on_track'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : report.health_status === 'at_risk'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : report.health_status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {report.health_status?.replace('_', ' ') || 'On Track'}
                        </span>
                      </div>

                      {report.executive_summary && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {report.executive_summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        {report.source_type === 'meeting_summaries' ? 'Aggregated from meetings' : 'Synthesized from TXTs'}
                      </div>
                      <Link
                        href={`/monthly-report?id=${report.id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <span>View Report</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTION ITEMS MATRIX */}
        {activeTab === 'actions' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Project Action Items Register</h3>
                <p className="text-xs text-slate-500">All deliverables and commitments extracted across all meetings</p>
              </div>
              <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-xs font-bold">
                {allActionItems.length} Total Deliverables
              </span>
            </div>

            {allActionItems.length === 0 ? (
              <div className="py-12 text-center">
                <ListTodo className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No action items recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload a meeting transcript to extract action items automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Deliverable / Task</th>
                      <th className="py-2.5 px-3">Owner / Assignee</th>
                      <th className="py-2.5 px-3">Deadline</th>
                      <th className="py-2.5 px-3">Source Meeting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allActionItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {item.task || item.item || JSON.stringify(item)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.owner ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {item.owner}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {item.deadline || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="py-3 px-3">
                          <Link
                            href={`/meeting-summary?id=${item.meetingId}`}
                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                          >
                            <span className="truncate max-w-[150px]">{item.meetingTitle}</span>
                            <span className="text-[10px] text-slate-400">({item.meetingDate})</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DECISIONS LOG */}
        {activeTab === 'decisions' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Project Decisions Log</h3>
                <p className="text-xs text-slate-500">Key architectural, scope, and process decisions agreed upon</p>
              </div>
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-bold">
                {allDecisions.length} Decisions
              </span>
            </div>

            {allDecisions.length === 0 ? (
              <div className="py-12 text-center">
                <Scale className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No decisions recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Key decisions will appear here as you process meeting transcripts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allDecisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-slate-900">{dec.decision}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Logged from:</span>
                        <Link
                          href={`/meeting-summary?id=${dec.meetingId}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {dec.meetingTitle} ({dec.meetingDate})
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
