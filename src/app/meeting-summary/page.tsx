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
  Plus
} from 'lucide-react';
import SampleTranscriptModal from '@/components/SampleTranscriptModal';
import Link from 'next/link';
import { exportMeetingSummaryPDF } from '@/lib/export/pdfExport';
import { ExecutiveReportModal } from '@/components/export/ExecutiveReportModal';
import InviteBotModal from '@/components/bot/InviteBotModal';
import LiveBotMonitor from '@/components/bot/LiveBotMonitor';
import BotSessionsDrawer from '@/components/bot/BotSessionsDrawer';
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
  const { projects, activeProject, saveMeetingSummary, deleteMeetingSummary, meetingSummaries } = useAuth();

  const [rawTranscript, setRawTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId || activeProject?.id || '');
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
  const [activeTab, setActiveTab] = useState<'overview' | 'who_said_what' | 'action_items' | 'decisions' | 'markdown'>('overview');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Result state
  const [summaryResult, setSummaryResult] = useState<any | null>(null);

  // Load existing summary if ?id= is in URL
  useEffect(() => {
    if (summaryId) {
      const existing = meetingSummaries.find((s) => s.id === summaryId);
      if (existing) {
        setMeetingTitle(existing.title);
        setMeetingDate(existing.meeting_date);
        setSelectedProjectId(existing.project_id || '');
        setSummaryResult({
          title: existing.title,
          executive_summary: existing.executive_summary,
          who_said_what: existing.who_said_what || [],
          action_items: existing.action_items || [],
          key_decisions: existing.key_decisions || [],
          key_blockers: existing.key_blockers || [],
          summary_markdown: existing.summary_markdown,
          participants: existing.participants || [],
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

  const executeProcessing = async (textOverride?: string, titleOverride?: string, projOverride?: string) => {
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
      await saveMeetingSummary({
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

      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error generating summary. Please check your transcript.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTranscript = () => executeProcessing();

  const handleDispatchBot = (config: {
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
    const newSession: BotSession = {
      id: `bot-${Date.now()}`,
      meetingUrl: config.meetingUrl,
      platform: config.platform,
      title: config.title || `${detectMeetingPlatform(config.meetingUrl).label} Sync Session`,
      projectId: config.projectId,
      projectName: proj?.name,
      botName: config.botName || 'Hexavia Notetaker',
      status: 'connecting',
      durationSeconds: 0,
      participants: [],
      transcriptChunks: [],
      fullTranscript: '',
      postGreeting: config.postGreeting,
      scheduledTime: config.scheduledTime,
      startedAt: new Date().toISOString(),
    };

    setActiveBotSession(newSession);
    setBotSessions((prev) => [newSession, ...prev]);
    setInputMode('bot');
    if (!meetingTitle) {
      setMeetingTitle(newSession.title);
    }
    if (config.projectId && !selectedProjectId) {
      setSelectedProjectId(config.projectId);
    }

    // Auto-progress to waiting room after brief connection simulation
    setTimeout(() => {
      setActiveBotSession((prev) => {
        if (!prev || prev.id !== newSession.id) return prev;
        return { ...prev, status: 'waiting_room' };
      });
    }, 2000);
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

  const handleImportBotTranscript = (transcriptText: string, title: string, projId?: string) => {
    setRawTranscript(transcriptText);
    if (title) setMeetingTitle(title);
    if (projId) setSelectedProjectId(projId);
    setFileName(`ai-bot-${new Date().toISOString().split('T')[0]}.txt`);

    // Execute processing immediately
    executeProcessing(transcriptText, title, projId);
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
        meeting_date: meetingDate,
        projectName: proj?.name,
        file_name: fileName,
        executive_summary: summaryResult.executive_summary,
        participants: summaryResult.participants,
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
                      {selectedProjectId && (() => {
                        const proj = projects.find((p) => p.id === selectedProjectId);
                        if (!proj) return null;
                        return (
                          <>
                            <span>•</span>
                            <Link
                              href={`/projects/${proj.id}`}
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <FolderKanban className="h-3 w-3" />
                              <span>Project: {proj.name}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                    {selectedProjectId && (
                      <Link
                        href={`/projects/${selectedProjectId}`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition-colors self-start sm:self-auto"
                      >
                        <span>Open in Project Records</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 pt-2">
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
            meeting_date: meetingDate,
            projectName: projects.find((p) => p.id === selectedProjectId)?.name,
            file_name: fileName,
            executive_summary: summaryResult.executive_summary,
            participants: summaryResult.participants,
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
