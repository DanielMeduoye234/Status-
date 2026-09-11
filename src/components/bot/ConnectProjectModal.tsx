'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  FolderKanban, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Calendar, 
  Users, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export interface MeetingSummaryPreview {
  id?: string;
  title: string;
  meeting_date?: string;
  executive_summary?: string;
  action_items?: any[];
  key_decisions?: string[];
  key_blockers?: string[];
  participants?: string[];
  durationSeconds?: number;
  platform?: string;
  summary_markdown?: string;
}

interface ConnectProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MeetingSummaryPreview;
  currentProjectId?: string | null;
  onConnect: (projectId: string | null) => Promise<void>;
}

export default function ConnectProjectModal({
  isOpen,
  onClose,
  summary,
  currentProjectId,
  onConnect,
}: ConnectProjectModalProps) {
  const router = useRouter();
  const { projects, createProject } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProjectId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    connectedProjectId: string | null;
    projectName: string;
  } | null>(null);

  // Inline new project creation state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  if (!isOpen) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Full Session';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const created = await createProject({
        name: newProjectName.trim(),
        client_name: newClientName.trim() || undefined,
        color: newProjectColor,
      });

      setSelectedProjectId(created.id);
      setIsCreatingNew(false);
      setNewProjectName('');
      setNewClientName('');
    } catch (err) {
      console.error('Failed to create new project:', err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleConfirmConnection = async () => {
    setIsSubmitting(true);
    try {
      const targetId = selectedProjectId ? selectedProjectId : null;
      await onConnect(targetId);

      const proj = projects.find((p) => p.id === targetId);
      setSuccessResult({
        connectedProjectId: targetId,
        projectName: proj?.name || 'General (Unassigned)',
      });
    } catch (err) {
      console.error('Failed to connect summary to project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="border-b border-slate-100 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                  Meeting Concluded • AI Summary Ready
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Connect Meeting Summary to a Project
                </h2>
              </div>
            </div>

            {!successResult && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successResult ? (
            /* Success View */
            <div className="py-8 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {successResult.connectedProjectId 
                    ? `Connected to "${successResult.projectName}"!`
                    : 'Saved to Unassigned Meetings'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  {successResult.connectedProjectId 
                    ? 'All action items, key decisions, and speaker breakdowns have been linked to this project.'
                    : 'The summary has been preserved in your unassigned inbox. You can connect it to a project at any time.'}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {successResult.connectedProjectId && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/projects/${successResult.connectedProjectId}`);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    <FolderKanban className="h-4 w-4" />
                    <span>View in Project Timeline</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Done / Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Highlights Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {summary.title || 'Meeting Summary'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {summary.meeting_date || new Date().toLocaleDateString()}
                      </span>
                      {summary.durationSeconds ? (
                        <>
                          <span>•</span>
                          <span>{formatDuration(summary.durationSeconds)}</span>
                        </>
                      ) : null}
                      {summary.participants && summary.participants.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {summary.participants.length} attendees
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-100/70 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {summary.action_items?.length || 0} Action Items
                    </span>
                    <span className="rounded-md bg-indigo-100/70 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {summary.key_decisions?.length || 0} Decisions
                    </span>
                  </div>
                </div>

                {summary.executive_summary && (
                  <div className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    <strong className="text-slate-800">Executive Summary: </strong>
                    {summary.executive_summary}
                  </div>
                )}
              </div>

              {/* Project Selection Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                    Select Project Destination
                  </label>
                  {!isCreatingNew && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create New Project</span>
                    </button>
                  )}
                </div>

                {/* Inline New Project Form */}
                {isCreatingNew ? (
                  <form onSubmit={handleCreateNewProject} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-900">Create & Connect New Project</h4>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="e.g. Acme Mobile App v2"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Client / Organization (Optional)
                        </label>
                        <input
                          type="text"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Color:</span>
                        {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewProjectColor(c)}
                            className={`h-5 w-5 rounded-full ring-2 transition-all ${
                              newProjectColor === c ? 'ring-slate-900 scale-110' : 'ring-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingNew(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingProject || !newProjectName.trim()}
                          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isCreatingProject ? 'Creating...' : 'Create & Select'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Existing Projects List */
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {projects.map((proj) => {
                      const isSelected = selectedProjectId === proj.id;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedProjectId(proj.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: proj.color || '#3b82f6' }}
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span>{proj.name}</span>
                                {proj.client_name && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({proj.client_name})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 capitalize">
                                Status: {proj.status || 'Active'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Unassigned / Inbox Option */}
                    <div
                      onClick={() => setSelectedProjectId('')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedProjectId === ''
                          ? 'border-slate-600 bg-slate-100 ring-2 ring-slate-400/10'
                          : 'border-dashed border-slate-200 bg-slate-50/40 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-full bg-slate-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            Keep Unassigned (Review Later)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Save in unassigned inbox without associating to a specific project yet
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {selectedProjectId === '' ? (
                          <CheckCircle2 className="h-4 w-4 text-slate-700" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!successResult && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmConnection}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <FolderKanban className="h-4 w-4" />
                  <span>
                    {selectedProjectId
                      ? `Connect to ${projects.find((p) => p.id === selectedProjectId)?.name || 'Project'}`
                      : 'Save as Unassigned'}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
