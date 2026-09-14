'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Calendar, 
  Copy, 
  Check, 
  Download, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ListTodo, 
  Layers, 
  ArrowLeft,
  RefreshCw,
  Trash2,
  ShieldAlert,
  FolderKanban,
  ArrowRight,
  ExternalLink,
  Search,
  X,
  Eye,
  Bot,
  Video,
  Zap,
  Radio,
  Plus,
  Building2,
  Target,
  Award,
  CheckSquare
} from 'lucide-react';
import SampleTranscriptModal from '@/components/SampleTranscriptModal';
import Link from 'next/link';
import { exportMeetingSummaryPDF } from '@/lib/export/pdfExport';
import { ExecutiveReportModal } from '@/components/export/ExecutiveReportModal';
import InviteBotModal from '@/components/bot/InviteBotModal';
import LiveBotMonitor from '@/components/bot/LiveBotMonitor';
import BotSessionsDrawer from '@/components/bot/BotSessionsDrawer';
import ConnectProjectModal from '@/components/bot/ConnectProjectModal';
import { extractHexaviaMetadata } from '@/lib/ai/aiService';
import { 
  BotSession, 
  MeetingPlatform, 
  detectMeetingPlatform, 
  DEMO_MEETING_LINKS 
} from '@/lib/bot/mockBotService';

function MeetingSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const summaryId = searchParams.get('id');
  const urlProjectId = searchParams.get('projectId');
  const { user, projects, activeProject, saveMeetingSummary, updateMeetingSummary, deleteMeetingSummary, meetingSummaries } = useAuth();

  const [rawTranscript, setRawTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId || activeProject?.id || '');
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(summaryId || null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  
  // Input mode tab: upload file, paste text, or live AI bot
  const [inputMode, setInputMode] = useState<'bot' | 'upload' | 'paste'>('bot');
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isBotDrawerOpen, setIsBotDrawerOpen] = useState(false);
  const [botSessions, setBotSessions] = useState<BotSession[]>([]);
  const [activeBotSession, setActiveBotSession] = useState<BotSession | null>(null);
  const [quickBotUrl, setQuickBotUrl] = useState('');

  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hexavia_report' | 'overview' | 'who_said_what' | 'action_items' | 'decisions' | 'markdown'>('hexavia_report');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Result state
  const [summaryResult, setSummaryResult] = useState<any | null>(null);

  // Load existing summary if ?id= is in URL
  useEffect(() => {
    if (summaryId) {
      setActiveSummaryId(summaryId);
      const existing = meetingSummaries.find((s) => s.id === summaryId);
      if (existing) {
        setMeetingTitle(existing.title);
        setMeetingDate(existing.meeting_date);
        setSelectedProjectId(existing.project_id || '');
        const meta = extractHexaviaMetadata(existing.summary_markdown) || {};
        setSummaryResult({
          title: existing.title,
          executive_summary: existing.executive_summary,
          who_said_what: existing.who_said_what || [],
          action_items: existing.action_items || [],
          key_decisions: existing.key_decisions || [],
          key_blockers: existing.key_blockers || [],
          summary_markdown: existing.summary_markdown,
          participants: existing.participants || [],
          meeting_date: existing.meeting_date || meta.meeting_date,
          meeting_time: meta.meeting_time,
          in_attendance: meta.in_attendance,
          agenda: meta.agenda,
          meeting_objective: meta.meeting_objective,
          opening_and_context: meta.opening_and_context,
          review_of_previous_actions: meta.review_of_previous_actions,
          business_development_reviews: meta.business_development_reviews,
          action_points_by_person: meta.action_points_by_person,
          closing_remarks: meta.closing_remarks,
          minutes_prepared_by: meta.minutes_prepared_by,
        });
      }
    }
  }, [summaryId, meetingSummaries]);

  // Update selected project if urlProjectId or activeProject changes
  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
    } else if (activeProject && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [urlProjectId, activeProject, selectedProjectId]);

  const handleConnectProject = async (newProjectId: string | null) => {
    if (activeSummaryId) {
      await updateMeetingSummary(activeSummaryId, { project_id: newProjectId });
    }
    setSelectedProjectId(newProjectId || '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!meetingTitle) {
      setMeetingTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawTranscript(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!meetingTitle) {
      setMeetingTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawTranscript(content);
    };
    reader.readAsText(file);
  };

  const executeProcessing = async (
    textOverride?: string, 
    titleOverride?: string, 
    projOverride?: string,
    promptProjectAssignment = false
  ) => {
    const textToProcess = textOverride || rawTranscript;
    if (!textToProcess.trim()) return;

    const titleToUse = titleOverride || meetingTitle;
    const projToUse = projOverride !== undefined ? projOverride : selectedProjectId;

    setLoading(true);
    setSavedSuccess(false);

    try {
      const projectObj = projects.find((p) => p.id === projToUse);
      const res = await fetch('/api/ai/meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscript: textToProcess,
          projectName: projectObj?.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await res.json();
      setSummaryResult(data);
      if (!meetingTitle && (titleToUse || data.title)) {
        setMeetingTitle(titleToUse || data.title);
      }

      // Auto-save to Supabase & local state
      const saved = await saveMeetingSummary({
        title: titleToUse || data.title || 'Meeting Summary',
        meeting_date: meetingDate,
        project_id: projToUse || null,
        file_name: fileName || 'bot-transcript.txt',
        raw_transcript: textToProcess,
        summary_markdown: data.summary_markdown,
        executive_summary: data.executive_summary,
        who_said_what: data.who_said_what,
        action_items: data.action_items,
        key_decisions: data.key_decisions,
        key_blockers: data.key_blockers,
        participants: data.participants,
      });

      if (saved?.id) {
        setActiveSummaryId(saved.id);
      }

      setSavedSuccess(true);

      // Prompt PM with project connection modal
      if (promptProjectAssignment || !projToUse) {
        setIsConnectModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating summary. Please check your transcript.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTranscript = () => executeProcessing();

  const handleDispatchBot = async (config: {
    meetingUrl: string;
    platform: MeetingPlatform;
    title: string;
    projectId?: string;
    botName: string;
    joinMode: 'now' | 'scheduled';
    scheduledTime?: string;
    postGreeting: boolean;
    language: string;
  }) => {
    const proj = projects.find((p) => p.id === config.projectId);
    const sessionTitle = config.title || `${detectMeetingPlatform(config.meetingUrl).label} Sync Session`;

    try {
      const res = await fetch('/api/bot/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingUrl: config.meetingUrl,
          title: sessionTitle,
          projectId: config.projectId,
          projectName: proj?.name,
          botName: config.botName,
          joinMode: config.joinMode,
          scheduledTime: config.scheduledTime,
          postGreeting: config.postGreeting,
          language: config.language,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch meeting bot');
      }

      if (data.session) {
        setActiveBotSession(data.session);
        setBotSessions((prev) => [data.session, ...prev.filter((s) => s.id !== data.session.id)]);
        setInputMode('bot');
        if (!meetingTitle) {
          setMeetingTitle(data.session.title);
        }
        if (config.projectId && !selectedProjectId) {
          setSelectedProjectId(config.projectId);
        }

        // If it's a simulated session, auto-progress to waiting room
        if (!data.isRealBot) {
          setTimeout(() => {
            setActiveBotSession((prev) => {
              if (!prev || prev.id !== data.session.id) return prev;
              return { ...prev, status: 'waiting_room' };
            });
          }, 2000);
        }
        return;
      }
    } catch (dispatchErr: any) {
      console.error('Error dispatching bot via API:', dispatchErr);
      alert(`Bot dispatch failed: ${dispatchErr.message || 'Please check your connection or meeting link.'}`);
    }
  };

  const handleQuickDispatch = (urlToUse?: string) => {
    const url = urlToUse || quickBotUrl;
    if (!url.trim()) {
      setIsBotModalOpen(true);
      return;
    }
    const detected = detectMeetingPlatform(url);
    handleDispatchBot({
      meetingUrl: url.trim(),
      platform: detected.platform,
      title: meetingTitle || `${detected.label} Session`,
      projectId: selectedProjectId || undefined,
      botName: 'Hexavia Notetaker',
      joinMode: 'now',
      postGreeting: true,
      language: 'en-US',
    });
    setQuickBotUrl('');
  };

  const handleUpdateBotSession = (updated: BotSession) => {
    setActiveBotSession(updated);
    setBotSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleImportBotTranscript = (
    transcriptText: string, 
    title: string, 
    projId?: string,
    autoPromptProject = true
  ) => {
    setRawTranscript(transcriptText);
    if (title) setMeetingTitle(title);
    if (projId) setSelectedProjectId(projId);
    setFileName(`ai-bot-${new Date().toISOString().split('T')[0]}.txt`);

    // Execute processing immediately and prompt PM with project assignment
    executeProcessing(transcriptText, title, projId, autoPromptProject);
  };

  const handleCopyMarkdown = () => {
    if (summaryResult?.summary_markdown) {
      navigator.clipboard.writeText(summaryResult.summary_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    if (!summaryResult) return;
    setExportingPDF(true);
    try {
      const proj = projects.find((p) => p.id === selectedProjectId);
      await exportMeetingSummaryPDF({
        title: meetingTitle || summaryResult.title || 'Meeting Summary',
        meeting_date: meetingDate || summaryResult.meeting_date,
        meeting_time: summaryResult.meeting_time,
        projectName: proj?.name,
        file_name: fileName,
        executive_summary: summaryResult.executive_summary,
        participants: summaryResult.participants,
        in_attendance: summaryResult.in_attendance,
        agenda: summaryResult.agenda,
        meeting_objective: summaryResult.meeting_objective,
        opening_and_context: summaryResult.opening_and_context,
        review_of_previous_actions: summaryResult.review_of_previous_actions,
        business_development_reviews: summaryResult.business_development_reviews,
        action_points_by_person: summaryResult.action_points_by_person,
        closing_remarks: summaryResult.closing_remarks,
        minutes_prepared_by: summaryResult.minutes_prepared_by,
        action_items: summaryResult.action_items,
        key_decisions: summaryResult.key_decisions,
        key_blockers: summaryResult.key_blockers,
        who_said_what: summaryResult.who_said_what,
        summary_markdown: summaryResult.summary_markdown,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (!summaryId) return;
    if (window.confirm('Are you sure you want to delete this meeting summary?')) {
      await deleteMeetingSummary(summaryId);
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meeting Summary & Who Said What</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Extract speaker dialog breakdown, commitments, and action items from Zoom TXT files
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {botSessions.length > 0 && (
            <button
              onClick={() => setIsBotDrawerOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Bot className="h-4 w-4 text-blue-600" />
              <span>Bot Sessions ({botSessions.length})</span>
            </button>
          )}

          {meetingSummaries.length > 0 && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              <FolderKanban className="h-4 w-4 text-blue-600" />
              <span>Meeting Records ({meetingSummaries.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsSampleModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Load Sample Transcript</span>
          </button>

          <button
            onClick={() => setIsBotModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20 cursor-pointer"
          >
            <Bot className="h-4 w-4" />
            <span>Invite AI Bot</span>
            {activeBotSession && activeBotSession.status !== 'completed' && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INPUT / BOT LAUNCHER (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Input Source Selector */}
          <div className="flex rounded-xl bg-slate-100/90 p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setInputMode('bot')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all relative cursor-pointer ${
                inputMode === 'bot'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-white/50'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Invite AI Bot</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold tracking-wide uppercase ${
                inputMode === 'bot' ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-700'
              }`}>
                Live
              </span>
              {activeBotSession && activeBotSession.status !== 'completed' && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5 ring-2 ring-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload TXT</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                inputMode === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Paste Text</span>
            </button>
          </div>

          {/* Mode 1: AI Bot Mode */}
          {inputMode === 'bot' && (
            <div className="space-y-4">
              {activeBotSession ? (
                <LiveBotMonitor
                  session={activeBotSession}
                  onUpdateSession={handleUpdateBotSession}
                  onImportTranscript={handleImportBotTranscript}
                  onDismiss={() => setActiveBotSession(null)}
                  isSummarizing={loading}
                />
              ) : (
                /* Launchpad Card */
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">AI Notetaker Launchpad</h3>
                        <p className="text-[11px] text-slate-500">Autonomous meeting transcriber</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBotModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors cursor-pointer"
                    >
                      Advanced Options
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paste a meeting link below. The AI bot enters your call, captures incoming audio, differentiates speakers, and feeds the transcript directly into Hexavia.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Meeting Link (Google Meet, Zoom, Teams, Webex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={quickBotUrl}
                        onChange={(e) => setQuickBotUrl(e.target.value)}
                        placeholder="https://meet.google.com/abc-defg-hij"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickDispatch()}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Dispatch</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick sample link pills */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                      Or Try With a Demo Meeting:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_MEETING_LINKS.map((demo) => (
                        <button
                          key={demo.platform}
                          type="button"
                          onClick={() => {
                            setQuickBotUrl(demo.url);
                            handleQuickDispatch(demo.url);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <Video className="h-3 w-3 text-slate-400" />
                          <span>{demo.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {botSessions.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {botSessions.length} recorded bot session{botSessions.length > 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBotDrawerOpen(true)}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        View Bot Sessions &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata Parameters Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Meeting Parameters
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Sprint 24 Planning & Blockers"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Workspace
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Unassigned --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Mode 2: Upload File */}
          {inputMode === 'upload' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/70 p-6 text-center transition-colors relative"
            >
              <input
                type="file"
                accept=".txt,.vtt,.log"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-2 border border-blue-100">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {fileName ? fileName : 'Upload Zoom Transcript (.TXT)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Drag and drop your Zoom audio/video transcript file here
                </p>
              </div>
            </div>
          )}

          {/* Raw Textarea (Visible in paste mode or when transcript is loaded) */}
          {(inputMode === 'paste' || rawTranscript) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {inputMode === 'paste' ? 'Paste Transcript Text' : 'Active Transcript Preview'}
                </label>
                {rawTranscript && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {rawTranscript.split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>

              <textarea
                rows={inputMode === 'paste' ? 8 : 5}
                value={rawTranscript}
                onChange={(e) => setRawTranscript(e.target.value)}
                placeholder="00:00:15 Sarah: Hey team, we finished the sprint deliverables...&#10;00:00:30 Alex: Great, what about the database migrations?"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
              />

              <button
                onClick={handleProcessTranscript}
                disabled={loading || !rawTranscript.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Analyzing Transcript & Speakers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Meeting Summary</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INTELLIGENCE OUTPUT (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {summaryResult ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div className="border-b border-slate-200 p-5 pb-0 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {summaryResult.provider === 'gemini' && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          Google Gemini 1.5 Flash
                        </span>
                      )}
                      {summaryResult.provider === 'openai' && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          OpenAI {summaryResult.model}
                        </span>
                      )}
                      {summaryResult.provider === 'heuristic_mock' && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 flex items-center gap-1">
                          ⚡ Heuristic Engine
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {summaryResult.title || meetingTitle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {meetingDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {summaryResult.participants?.join(', ') || 'Team Attendees'}
                      </span>
                      {selectedProjectId ? (() => {
                        const proj = projects.find((p) => p.id === selectedProjectId);
                        if (!proj) return null;
                        return (
                          <div className="flex items-center gap-1.5">
                            <span>•</span>
                            <Link
                              href={`/projects/${proj.id}`}
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <FolderKanban className="h-3 w-3" />
                              <span>Project: {proj.name}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setIsConnectModalOpen(true)}
                              className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 underline ml-1 cursor-pointer"
                            >
                              (Change)
                            </button>
                          </div>
                        );
                      })() : (
                        <div className="flex items-center gap-1.5">
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setIsConnectModalOpen(true)}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <span>⚡ Unassigned • Connect to Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-sm transition-colors cursor-pointer"
                      title="Assign or change associated project"
                    >
                      <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                      <span>{selectedProjectId ? 'Change Project' : 'Connect to Project'}</span>
                    </button>

                    {summaryId && (
                      <button
                        onClick={handleDeleteSummary}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-sm transition-colors"
                        title="Delete Summary"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                      title="Copy Markdown"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                      title="Preview Executive Template & Print"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      <span>Executive Preview</span>
                    </button>

                    <button
                      onClick={handleExportPDF}
                      disabled={exportingPDF}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
                      title="Download PDF Report"
                    >
                      {exportingPDF ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!selectedProjectId && (
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3 text-xs border border-amber-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-950">This meeting summary is not connected to a project yet.</span>
                        <p className="text-[11px] text-amber-800">Assigning it to a project links all action items, decisions, and feeds into monthly status reports.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Connect to Project</span>
                    </button>
                  </div>
                )}

                {summaryResult.warning && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200">
                    <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>{summaryResult.warning}</span>
                  </div>
                )}

                {savedSuccess && (
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Meeting summary recorded successfully!</span>
                    </div>
                    {selectedProjectId ? (
                      <Link
                        href={`/projects/${selectedProjectId}`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition-colors self-start sm:self-auto"
                      >
                        <span>Open in Project Records</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConnectModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 underline self-start sm:self-auto cursor-pointer"
                      >
                        <span>Connect to a Project now</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 pt-2">
                  <button
                    onClick={() => setActiveTab('hexavia_report')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'hexavia_report'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Hexavia Diagnostic Report</span>
                    <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                      Official
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Executive Summary</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('who_said_what')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'who_said_what'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Who Said What ({summaryResult.who_said_what?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('action_items')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'action_items'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                    <span>Action Items ({summaryResult.action_items?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('decisions')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'decisions'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Decisions & Blockers</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('markdown')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'markdown'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Raw Markdown</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-4 max-h-[680px] overflow-y-auto">
                {/* TAB 0: HEXAVIA OFFICIAL DIAGNOSTIC MINUTES */}
                {activeTab === 'hexavia_report' && (
                  <div className="space-y-6">
                    {/* Official Hexavia Brand Bar */}
                    <div className="rounded-xl border border-sky-300 bg-linear-to-r from-sky-50 via-white to-blue-50 p-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 h-8 px-2 py-1 rounded bg-white border border-slate-200">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-xs" />
                            <div className="w-1.5 h-4 bg-blue-500 rounded-xs" />
                            <div className="w-1.5 h-6 bg-blue-600 rounded-xs" />
                          </div>
                          <div>
                            <span className="text-base font-extrabold text-slate-900 tracking-tight">
                              Hexavia! LIMITED
                            </span>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                              Organizational Diagnostic & Strategic Alignment Minutes
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-600">
                          <p>39A, Awudu Ekpegha Boulevard Street, Lekki Phase 1, Lagos</p>
                          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">© By Hexavia! www.hexavia.africa</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                        <div className="bg-white/80 rounded-lg p-2 border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
                          <span className="font-semibold text-slate-800">{summaryResult.meeting_date || meetingDate}</span>
                        </div>
                        <div className="bg-white/80 rounded-lg p-2 border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Time</span>
                          <span className="font-semibold text-slate-800">{summaryResult.meeting_time || 'Working Session'}</span>
                        </div>
                        <div className="bg-white/80 rounded-lg p-2 border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Prepared By</span>
                          <span className="font-semibold text-slate-800">{summaryResult.minutes_prepared_by?.name || summaryResult.participants?.[0] || 'Project Lead'}</span>
                        </div>
                        <div className="bg-white/80 rounded-lg p-2 border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                          <span className="font-semibold text-emerald-700">Validated Minutes</span>
                        </div>
                      </div>
                    </div>

                    {/* In Attendance */}
                    {summaryResult.in_attendance && summaryResult.in_attendance.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          <span>In Attendance</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {summaryResult.in_attendance.map((grp: any, gIdx: number) => (
                            <div key={gIdx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1.5">
                              <span className="text-xs font-bold text-blue-900 block border-b border-slate-200 pb-1">
                                {grp.organization}
                              </span>
                              <ul className="space-y-1 text-xs text-slate-700">
                                {grp.attendees.map((att: any, aIdx: number) => (
                                  <li key={aIdx} className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="font-semibold text-slate-900">{att.name}</span>
                                    <span className="text-slate-500">– {att.role}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Numbered Agenda */}
                    {summaryResult.agenda && summaryResult.agenda.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Session Agenda ({summaryResult.agenda.length} Topics)</span>
                        </h4>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-800">
                            {summaryResult.agenda.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 py-0.5">
                                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-blue-50 font-mono text-[10px] font-bold text-blue-700 border border-blue-100">
                                  {idx + 1}
                                </span>
                                <span className="leading-snug">{item.replace(/^\d+\.\s*/, '')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meeting Objective */}
                    {summaryResult.meeting_objective && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-blue-600" />
                          <span>Meeting Objective</span>
                        </h4>
                        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                          {summaryResult.meeting_objective}
                        </div>
                      </div>
                    )}

                    {/* Opening and Context */}
                    {summaryResult.opening_and_context && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Opening & Context Setting
                        </h4>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {summaryResult.opening_and_context}
                        </div>
                      </div>
                    )}

                    {/* Review of Previous Action Points */}
                    {summaryResult.review_of_previous_actions && summaryResult.review_of_previous_actions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Review of Previous Action Points
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {summaryResult.review_of_previous_actions.map((grp: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                              <span className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1">
                                {grp.track}
                              </span>
                              <ul className="space-y-1 text-xs text-slate-700">
                                {grp.items.map((it: string, iIdx: number) => (
                                  <li key={iIdx} className="flex items-start gap-1.5">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{it}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Workstream Deep Dives */}
                    {summaryResult.business_development_reviews && summaryResult.business_development_reviews.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Workstream Diagnostic & Business Development Reviews
                        </h4>
                        {summaryResult.business_development_reviews.map((rev: any, rIdx: number) => (
                          <div key={rIdx} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                              <h5 className="text-xs font-extrabold uppercase text-blue-900 tracking-wide">
                                {rev.track}
                              </h5>
                              <span className="text-[10px] font-bold text-slate-500">
                                {rev.subsections?.length || 0} Subsections
                              </span>
                            </div>
                            <div className="p-4 divide-y divide-slate-100 space-y-3">
                              {rev.subsections?.map((sub: any, sIdx: number) => (
                                <div key={sIdx} className={sIdx > 0 ? 'pt-3 space-y-1.5' : 'space-y-1.5'}>
                                  <h6 className="text-xs font-bold text-slate-900">{sub.topic}</h6>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{sub.details}</p>
                                  {sub.metrics_or_facts && sub.metrics_or_facts.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {sub.metrics_or_facts.map((m: string, mIdx: number) => (
                                        <span key={mIdx} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                          <span>🏷️</span>
                                          <span>{m}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Points by Person */}
                    {summaryResult.action_points_by_person && summaryResult.action_points_by_person.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Action Points & Next Steps (By Stakeholder)</span>
                        </h4>
                        <div className="space-y-3">
                          {summaryResult.action_points_by_person.map((p: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                                    {p.person.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold text-slate-900">{p.person}</span>
                                  <span className="text-[10px] text-slate-500">– {p.role}{p.organization ? `, ${p.organization}` : ''}</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                  {p.actions?.length || 0} Action{p.actions?.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <ul className="space-y-1 text-xs text-slate-700 pl-1">
                                {p.actions?.map((act: string, aIdx: number) => (
                                  <li key={aIdx} className="flex items-start gap-2">
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                    <span className="leading-snug">{act}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Closing & Signoff */}
                    {summaryResult.closing_remarks && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Meeting Closing</span>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{summaryResult.closing_remarks}</p>
                        {summaryResult.minutes_prepared_by && (
                          <div className="pt-2 border-t border-slate-200 text-xs text-slate-500">
                            <span className="font-bold text-slate-800">Minutes Prepared By: </span>
                            <span>{summaryResult.minutes_prepared_by.name}, {summaryResult.minutes_prepared_by.role} ({summaryResult.minutes_prepared_by.organization})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 1: EXECUTIVE OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Meeting Synopsis
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {summaryResult.executive_summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Agreed Decisions ({summaryResult.key_decisions?.length || 0})</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {summaryResult.key_decisions?.slice(0, 3).map((d: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold mt-0.5">•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Identified Risks / Blockers ({summaryResult.key_blockers?.length || 0})</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {summaryResult.key_blockers && summaryResult.key_blockers.length > 0 ? (
                            summaryResult.key_blockers.map((b: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold mt-0.5">•</span>
                                <span>{b}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-slate-500">No critical blockers recorded.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: WHO SAID WHAT */}
                {activeTab === 'who_said_what' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Speaker attribution, discussion points, and commitments:
                    </p>

                    <div className="space-y-3.5">
                      {summaryResult.who_said_what?.map((speakerItem: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                {speakerItem.speaker.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  {speakerItem.speaker}
                                </h4>
                                {speakerItem.sentiment && (
                                  <span className="text-[10px] text-slate-500 capitalize">
                                    Tone: {speakerItem.sentiment}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Main points */}
                          {speakerItem.main_points && speakerItem.main_points.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-600 mb-1">
                                Points & Perspectives Raised:
                              </p>
                              <ul className="space-y-1 text-xs text-slate-700 pl-3 border-l-2 border-slate-200">
                                {speakerItem.main_points.map((pt: string, pidx: number) => (
                                  <li key={pidx} className="leading-relaxed">
                                    {pt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Commitments */}
                          {speakerItem.commitments && speakerItem.commitments.length > 0 && (
                            <div className="rounded-lg bg-blue-50/60 p-2.5 border border-blue-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-1">
                                Commitments & Deliverables:
                              </p>
                              <ul className="space-y-0.5 text-xs text-blue-900">
                                {speakerItem.commitments.map((com: string, cidx: number) => (
                                  <li key={cidx} className="flex items-center gap-1.5">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span>{com}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: ACTION ITEMS */}
                {activeTab === 'action_items' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Action items with assignees, deadlines, and priority rankings:
                    </p>

                    <div className="space-y-2">
                      {summaryResult.action_items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <CheckCircle2 className="h-4 w-4 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-snug">
                                {item.task}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                <span className="font-semibold text-blue-700">
                                  👤 {item.assignee || 'Unassigned'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {item.deadline || 'TBD'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0 self-end sm:self-center">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                item.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : item.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {item.priority || 'Medium'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: DECISIONS & BLOCKERS */}
                {activeTab === 'decisions' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Agreed Decisions Log</span>
                      </h4>
                      <div className="space-y-2">
                        {summaryResult.key_decisions?.map((decision: string, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-slate-800 flex items-start gap-2.5"
                          >
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{decision}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Risks & Roadblocks</span>
                      </h4>
                      <div className="space-y-2">
                        {summaryResult.key_blockers && summaryResult.key_blockers.length > 0 ? (
                          summaryResult.key_blockers.map((blocker: string, idx: number) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-xs text-slate-800 flex items-start gap-2.5"
                            >
                              <span className="text-amber-600 font-bold">!</span>
                              <span>{blocker}</span>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 text-center">
                            No critical roadblocks recorded in this meeting transcript.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: RAW MARKDOWN */}
                {activeTab === 'markdown' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={handleCopyMarkdown}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy to Clipboard</span>
                      </button>
                    </div>
                    <pre className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] text-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                      {summaryResult.summary_markdown}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center h-[520px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3 border border-blue-100">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Meeting Summary Engine Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Upload your Zoom meeting TXT transcript or click &lsquo;Load Sample Zoom Transcript&rsquo; to extract who said what, action items, and decisions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sample Transcript Modal */}
      <SampleTranscriptModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={(sampleText, title) => {
          setRawTranscript(sampleText);
          setMeetingTitle(title);
          setFileName(`${title.toLowerCase().replace(/\s+/g, '_')}.txt`);
        }}
      />

      {/* Meeting Records Archive Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Saved Meeting Records Archive</h3>
                  <p className="text-[11px] text-slate-500">Access and load any previously recorded meeting</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Filter by title, date, or project name..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {meetingSummaries
                .filter((m) => {
                  if (!historySearch.trim()) return true;
                  const q = historySearch.toLowerCase();
                  const matchTitle = m.title.toLowerCase().includes(q);
                  const matchDate = (m.meeting_date || '').toLowerCase().includes(q);
                  const proj = projects.find((p) => p.id === m.project_id);
                  const matchProj = proj?.name.toLowerCase().includes(q);
                  return matchTitle || matchDate || matchProj;
                })
                .map((m) => {
                  const proj = projects.find((p) => p.id === m.project_id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        router.push(`/meeting-summary?id=${m.id}`);
                        setIsHistoryOpen(false);
                      }}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1 truncate pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {m.title}
                          </p>
                          {proj && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 flex-shrink-0">
                              {proj.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {m.meeting_date}
                          </span>
                          <span>•</span>
                          <span>{m.action_items?.length || 0} action items</span>
                          <span>•</span>
                          <span>{m.key_decisions?.length || 0} decisions</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        Open →
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Executive Report Preview Modal */}
      {summaryResult && (
        <ExecutiveReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          type="meeting"
          meetingData={{
            title: meetingTitle || summaryResult.title || 'Meeting Summary',
            meeting_date: meetingDate || summaryResult.meeting_date,
            meeting_time: summaryResult.meeting_time,
            projectName: projects.find((p) => p.id === selectedProjectId)?.name,
            file_name: fileName,
            executive_summary: summaryResult.executive_summary,
            participants: summaryResult.participants,
            in_attendance: summaryResult.in_attendance,
            agenda: summaryResult.agenda,
            meeting_objective: summaryResult.meeting_objective,
            opening_and_context: summaryResult.opening_and_context,
            review_of_previous_actions: summaryResult.review_of_previous_actions,
            business_development_reviews: summaryResult.business_development_reviews,
            action_points_by_person: summaryResult.action_points_by_person,
            closing_remarks: summaryResult.closing_remarks,
            minutes_prepared_by: summaryResult.minutes_prepared_by,
            action_items: summaryResult.action_items,
            key_decisions: summaryResult.key_decisions,
            key_blockers: summaryResult.key_blockers,
            who_said_what: summaryResult.who_said_what,
            summary_markdown: summaryResult.summary_markdown,
          }}
        />
      )}

      {/* Invite AI Bot Modal */}
      <InviteBotModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onDispatchBot={handleDispatchBot}
        initialProjectId={selectedProjectId}
      />

      {/* Bot Sessions History Drawer */}
      <BotSessionsDrawer
        isOpen={isBotDrawerOpen}
        onClose={() => setIsBotDrawerOpen(false)}
        sessions={botSessions}
        onSelectSession={(session) => {
          setActiveBotSession(session);
          setInputMode('bot');
        }}
        onNewBotInvite={() => setIsBotModalOpen(true)}
        onDeleteSession={(sessionId) => {
          setBotSessions((prev) => prev.filter((s) => s.id !== sessionId));
          if (activeBotSession?.id === sessionId) {
            setActiveBotSession(null);
          }
        }}
      />

      {/* Connect to Project Modal */}
      {summaryResult && (
        <ConnectProjectModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          summary={{
            id: activeSummaryId || summaryId || undefined,
            title: meetingTitle || summaryResult.title || 'Meeting Summary',
            meeting_date: meetingDate,
            executive_summary: summaryResult.executive_summary,
            action_items: summaryResult.action_items,
            key_decisions: summaryResult.key_decisions,
            key_blockers: summaryResult.key_blockers,
            participants: summaryResult.participants,
            durationSeconds: activeBotSession?.durationSeconds,
            summary_markdown: summaryResult.summary_markdown,
          }}
          currentProjectId={selectedProjectId || null}
          onConnect={handleConnectProject}
        />
      )}
    </div>
  );
}

export default function MeetingSummaryPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <MeetingSummaryContent />
      </Suspense>
    </AppLayout>
  );
}
