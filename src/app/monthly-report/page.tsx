'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  FileSpreadsheet, 
  Upload, 
  Sparkles, 
  Calendar, 
  Copy, 
  Check, 
  Download, 
  CheckCircle2, 
  FileText, 
  Layers, 
  ArrowLeft, 
  RefreshCw,
  Files,
  ListFilter,
  TrendingUp,
  ShieldAlert,
  Target,
  Trash2,
  FolderKanban,
  ArrowRight,
  ExternalLink,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { exportMonthlyReportPDF } from '@/lib/export/pdfExport';
import { ExecutiveReportModal } from '@/components/export/ExecutiveReportModal';

function MonthlyReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const urlProjectId = searchParams.get('projectId');
  const { projects, activeProject, meetingSummaries, saveMonthlyReport, deleteMonthlyReport, monthlyReports } = useAuth();

  // Generation Method: 'uploaded_txts' or 'meeting_summaries'
  const [sourceType, setSourceType] = useState<'uploaded_txts' | 'meeting_summaries'>('meeting_summaries');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId || activeProject?.id || '');
  const [monthYear, setMonthYear] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterByMonthOnly, setFilterByMonthOnly] = useState(true);
  const [reportTitle, setReportTitle] = useState('');

  // Batch TXT state
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);

  // Project summaries selection state
  const [selectedSummaryIds, setSelectedSummaryIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportResult, setReportResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'milestones' | 'risks' | 'decisions' | 'markdown'>('executive');

  // Load existing report if ID in URL
  useEffect(() => {
    if (reportId) {
      const existing = monthlyReports.find((r) => r.id === reportId);
      if (existing) {
        setReportTitle(existing.title);
        setMonthYear(existing.month_year);
        setSelectedProjectId(existing.project_id);
        setSourceType(existing.source_type);
        setReportResult({
          title: existing.title,
          health_status: existing.health_status,
          executive_summary: existing.executive_summary,
          milestones_achieved: existing.milestones_achieved || [],
          in_progress_items: existing.in_progress_items || [],
          risks_blockers: existing.risks_blockers || [],
          decisions_log: existing.decisions_log || [],
          contributor_highlights: existing.contributor_highlights || [],
          next_month_goals: existing.next_month_goals || [],
          generated_report_markdown: existing.generated_report_markdown,
        });
      }
    }
  }, [reportId, monthlyReports]);

  // Update selected project if urlProjectId or activeProject changes
  useEffect(() => {
    if (urlProjectId) {
      setSelectedProjectId(urlProjectId);
    } else if (activeProject && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [urlProjectId, activeProject, selectedProjectId]);

  // Filter project summaries for selected project and month - Memoized to prevent infinite loop
  const filteredSummaries = useMemo(() => {
    return meetingSummaries.filter((m) => {
      if (!selectedProjectId) return false;
      const matchProj = m.project_id === selectedProjectId;
      if (!matchProj) return false;
      if (filterByMonthOnly && monthYear) {
        return m.meeting_date ? m.meeting_date.startsWith(monthYear) : false;
      }
      return true;
    });
  }, [meetingSummaries, selectedProjectId, filterByMonthOnly, monthYear]);

  // Auto-select all filtered summaries when switching project
  const summaryIdsKey = useMemo(() => filteredSummaries.map((s) => s.id).join(','), [filteredSummaries]);
  useEffect(() => {
    if (filteredSummaries.length > 0) {
      setSelectedSummaryIds(filteredSummaries.map((s) => s.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, summaryIdsKey]);

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setUploadedFiles((prev) => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    });
  };

  const handleDeleteReport = async () => {
    if (!reportId) return;
    if (window.confirm('Are you sure you want to delete this monthly status report?')) {
      await deleteMonthlyReport(reportId);
      router.push('/dashboard');
    }
  };

  const handleGenerateReport = async () => {
    const projectObj = projects.find((p) => p.id === selectedProjectId) || projects[0];
    if (!projectObj) {
      alert('Please create at least one project first from the Projects page before generating a monthly status report.');
      return;
    }

    let contentData = '';

    if (sourceType === 'uploaded_txts') {
      if (uploadedFiles.length === 0) {
        alert('Please upload at least one TXT transcript for the month.');
        return;
      }
      contentData = uploadedFiles
        .map((f, idx) => `=== MEETING FILE ${idx + 1}: ${f.name} ===\n${f.content}`)
        .join('\n\n');
    } else {
      const chosen = meetingSummaries.filter((m) => selectedSummaryIds.includes(m.id));
      if (chosen.length === 0) {
        contentData = `No prior meeting summaries stored. Generating comprehensive benchmark report for project: ${projectObj.name}`;
      } else {
        contentData = chosen
          .map(
            (m, idx) =>
              `=== MEETING ${idx + 1}: ${m.title} (Date: ${m.meeting_date}) ===\nExecutive Summary: ${
                m.executive_summary || m.summary_markdown
              }\nSpeaker Contributions & Attribution: ${JSON.stringify(
                m.who_said_what || []
              )}\nDecisions: ${JSON.stringify(m.key_decisions || [])}\nBlockers: ${JSON.stringify(
                m.key_blockers || []
              )}\nActions: ${JSON.stringify(m.action_items || [])}`
          )
          .join('\n\n');
      }
    }

    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/ai/monthly-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectObj.name,
          monthYear,
          sourceType,
          contentData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate monthly status report');
      }

      const data = await res.json();
      setReportResult(data);

      const titleToSave = reportTitle || data.title || `Monthly Report - ${projectObj.name} (${monthYear})`;
      setReportTitle(titleToSave);

      // Save to Supabase & local state
      await saveMonthlyReport({
        title: titleToSave,
        month_year: monthYear,
        project_id: projectObj.id,
        source_type: sourceType,
        source_summary_ids: selectedSummaryIds,
        generated_report_markdown: data.generated_report_markdown,
        executive_summary: data.executive_summary,
        health_status: data.health_status || 'on_track',
        milestones_achieved: data.milestones_achieved,
        in_progress_items: data.in_progress_items,
        risks_blockers: data.risks_blockers,
        decisions_log: data.decisions_log,
        contributor_highlights: data.contributor_highlights,
        next_month_goals: data.next_month_goals,
      });

      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Error generating monthly report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (reportResult?.generated_report_markdown) {
      navigator.clipboard.writeText(reportResult.generated_report_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    if (!reportResult) return;
    setExportingPDF(true);
    try {
      const proj = projects.find((p) => p.id === selectedProjectId);
      await exportMonthlyReportPDF({
        title: reportTitle || reportResult.title || 'Monthly Status Report',
        month_year: monthYear,
        projectName: proj?.name,
        health_status: reportResult.health_status,
        executive_summary: reportResult.executive_summary,
        milestones_achieved: reportResult.milestones_achieved,
        in_progress_items: reportResult.in_progress_items,
        risks_blockers: reportResult.risks_blockers,
        decisions_log: reportResult.decisions_log,
        contributor_highlights: reportResult.contributor_highlights,
        next_month_goals: reportResult.next_month_goals,
        generated_report_markdown: reportResult.generated_report_markdown,
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const toggleSummarySelection = (id: string) => {
    if (selectedSummaryIds.includes(id)) {
      setSelectedSummaryIds(selectedSummaryIds.filter((item) => item !== id));
    } else {
      setSelectedSummaryIds([...selectedSummaryIds, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Status Report Generator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Synthesize executive reports from monthly Zoom TXTs or accumulated project summaries
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: METHOD SELECTOR & CONFIG (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Generation Method Toggle Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Choose Generation Method
            </h3>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-50 border border-slate-200">
              <button
                type="button"
                onClick={() => setSourceType('meeting_summaries')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-md py-2.5 px-2 text-xs font-bold transition-all ${
                  sourceType === 'meeting_summaries'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="h-4 w-4" />
                <span className="text-center">From Saved Meetings</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('uploaded_txts')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-md py-2.5 px-2 text-xs font-bold transition-all ${
                  sourceType === 'uploaded_txts'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Files className="h-4 w-4" />
                <span className="text-center">Batch TXT Files</span>
              </button>
            </div>

            {/* Project & Month Selectors */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {projects.length === 0 ? (
                    <option value="">-- No Projects Created Yet --</option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reporting Month
                </label>
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* METHOD A: BATCH TXT UPLOADER */}
          {sourceType === 'uploaded_txts' && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Upload Month&apos;s Transcripts
                </h3>
                <span className="text-xs text-blue-600 font-bold">
                  {uploadedFiles.length} file(s) loaded
                </span>
              </div>

              <div className="rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/70 p-6 text-center transition-colors relative">
                <input
                  type="file"
                  multiple
                  accept=".txt,.vtt,.log"
                  onChange={handleBatchUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-2 border border-blue-100">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Select All Zoom TXTs for {monthYear}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hold Ctrl/Cmd to select multiple .txt transcript files
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {uploadedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 border border-slate-200"
                    >
                      <span className="truncate font-medium">{f.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {f.content.split(/\s+/).length} w
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* METHOD B: SELECT FROM SAVED SUMMARIES */}
          {sourceType === 'meeting_summaries' && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2. Select Meetings in Project
                  </h3>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterByMonthOnly}
                      onChange={(e) => setFilterByMonthOnly(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Show only meetings in {monthYear}</span>
                  </label>
                </div>
                <span className="text-xs text-blue-600 font-bold">
                  {selectedSummaryIds.length} of {filteredSummaries.length} selected
                </span>
              </div>

              {filteredSummaries.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <FileText className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-700 font-semibold">No saved meeting summaries for this project</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    The system will synthesize a full benchmark monthly report using project parameters.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredSummaries.map((summary) => {
                    const isSelected = selectedSummaryIds.includes(summary.id);
                    return (
                      <div
                        key={summary.id}
                        onClick={() => toggleSummarySelection(summary.id)}
                        className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {summary.title}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {summary.meeting_date}
                            {summary.action_items && (
                              <span>• {summary.action_items.length} action items</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Compiling Monthly Executive Report...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Synthesize Monthly Status Report</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: EXECUTIVE REPORT OUTPUT (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {reportResult ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div className="border-b border-slate-200 p-5 pb-0 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          reportResult.health_status === 'on_track'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : reportResult.health_status === 'at_risk'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        ● {reportResult.health_status?.replace('_', ' ') || 'ON TRACK'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Period: {monthYear}
                      </span>
                      {reportResult.provider === 'gemini' && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          Google Gemini 1.5 Flash
                        </span>
                      )}
                      {reportResult.provider === 'openai' && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          OpenAI {reportResult.model}
                        </span>
                      )}
                      {reportResult.provider === 'heuristic_mock' && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 flex items-center gap-1">
                          ⚡ Heuristic Engine
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mt-1">
                      {reportResult.title}
                    </h2>
                    {selectedProjectId && (() => {
                      const proj = projects.find((p) => p.id === selectedProjectId);
                      if (!proj) return null;
                      return (
                        <div className="mt-1">
                          <Link
                            href={`/projects/${proj.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <FolderKanban className="h-3 w-3" />
                            <span>Project Records: {proj.name}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    {reportId && (
                      <button
                        onClick={handleDeleteReport}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-sm transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      onClick={handleCopy}
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
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
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

                {reportResult.warning && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 border border-amber-200">
                    <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>{reportResult.warning}</span>
                  </div>
                )}

                {savedSuccess && (
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Monthly Status Report recorded successfully!</span>
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
                    onClick={() => setActiveTab('executive')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'executive'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Executive Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('milestones')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'milestones'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Milestones ({reportResult.milestones_achieved?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('risks')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'risks'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Risks & Roadblocks</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('decisions')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'decisions'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>Decisions & Contributors</span>
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
                    <span>Full Markdown</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-4 max-h-[680px] overflow-y-auto">
                {/* TAB 1: EXECUTIVE OVERVIEW */}
                {activeTab === 'executive' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Monthly Executive Synopsis
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {reportResult.executive_summary}
                      </p>
                    </div>

                    {/* Next Month Objectives Preview */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>Next Month Target Objectives</span>
                      </h4>
                      <div className="space-y-2">
                        {reportResult.next_month_goals?.map((goal: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-950"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MILESTONES & IN-PROGRESS */}
                {activeTab === 'milestones' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Completed Milestones</span>
                      </h4>
                      <div className="space-y-2.5">
                        {reportResult.milestones_achieved?.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-900">{m.milestone}</h5>
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 font-mono font-semibold">
                                Lead: {m.lead}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{m.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {reportResult.in_progress_items && reportResult.in_progress_items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
                          Active In-Progress Deliverables
                        </h4>
                        <div className="space-y-2">
                          {reportResult.in_progress_items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                            >
                              <span className="font-bold text-slate-800">{item.deliverable}</span>
                              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                                <span>👤 {item.owner}</span>
                                <span>•</span>
                                <span>📅 {item.expected_completion}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: RISKS & MITIGATION */}
                {activeTab === 'risks' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      <span>Risk Matrix & Actionable Mitigation</span>
                    </h4>
                    <div className="space-y-3">
                      {reportResult.risks_blockers?.map((risk: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-rose-900">{risk.risk}</h5>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                risk.severity === 'High'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              Severity: {risk.severity}
                            </span>
                          </div>
                          <div className="rounded-lg bg-white p-3 text-xs text-slate-700 border border-rose-100">
                            <span className="text-rose-700 font-bold">Mitigation Strategy: </span>
                            {risk.mitigation_plan}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: DECISIONS & CONTRIBUTOR HIGHLIGHTS */}
                {activeTab === 'decisions' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Strategic Architectural / Scope Decisions
                      </h4>
                      <div className="space-y-2.5">
                        {reportResult.decisions_log?.map((d: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-sm"
                          >
                            <h5 className="text-xs font-bold text-slate-900">{d.decision}</h5>
                            <p className="text-xs text-slate-600">{d.rationale}</p>
                            <p className="text-[11px] text-blue-700 font-semibold mt-1">
                              Stakeholders: {d.stakeholders}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Contributor Highlights (&ldquo;Who Delivered What&rdquo;)
                      </h4>
                      <div className="space-y-2">
                        {reportResult.contributor_highlights?.map((c: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] flex-shrink-0 border border-blue-100">
                              {c.contributor.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{c.contributor}</p>
                              <p className="text-slate-600 text-[11px] mt-0.5">{c.key_contributions}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: RAW MARKDOWN */}
                {activeTab === 'markdown' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy to Clipboard</span>
                      </button>
                    </div>
                    <pre className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] text-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                      {reportResult.generated_report_markdown}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center h-[520px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3 border border-blue-100">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Status Generator Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Choose your generation method (batch Zoom TXTs or saved meeting summaries) and click &lsquo;Synthesize Monthly Status Report&rsquo;.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Executive Report Preview Modal */}
      {reportResult && (
        <ExecutiveReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          type="monthly"
          monthlyData={{
            title: reportTitle || reportResult.title || 'Monthly Status Report',
            month_year: monthYear,
            projectName: projects.find((p) => p.id === selectedProjectId)?.name,
            health_status: reportResult.health_status,
            executive_summary: reportResult.executive_summary,
            milestones_achieved: reportResult.milestones_achieved,
            in_progress_items: reportResult.in_progress_items,
            risks_blockers: reportResult.risks_blockers,
            decisions_log: reportResult.decisions_log,
            contributor_highlights: reportResult.contributor_highlights,
            next_month_goals: reportResult.next_month_goals,
            generated_report_markdown: reportResult.generated_report_markdown,
          }}
        />
      )}
    </div>
  );
}

export default function MonthlyReportPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <MonthlyReportContent />
      </Suspense>
    </AppLayout>
  );
}
