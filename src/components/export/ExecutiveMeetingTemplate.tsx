'use client';

import React from 'react';
import { MeetingPDFData } from '@/lib/export/pdfExport';
import { 
  Calendar, 
  Clock, 
  Users, 
  FolderGit2, 
  CheckCircle2, 
  AlertTriangle, 
  CheckSquare, 
  FileText, 
  User,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface Props {
  data: MeetingPDFData;
  theme?: 'navy' | 'slate' | 'emerald';
}

export const ExecutiveMeetingTemplate: React.FC<Props> = ({ 
  data, 
  theme = 'navy' 
}) => {
  const docTitle = data.title || 'Executive Meeting Intelligence Report';
  const actionItems = data.action_items || [];
  const keyDecisions = data.key_decisions || [];
  const keyBlockers = data.key_blockers || [];
  const whoSaidWhat = data.who_said_what || [];
  const participants = data.participants || [];

  // Theme accents
  const themeHeaderBg = 
    theme === 'emerald' ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900' :
    theme === 'slate' ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900' :
    'bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900';

  const themeAccentBorder = 
    theme === 'emerald' ? 'border-emerald-500' :
    theme === 'slate' ? 'border-slate-500' :
    'border-blue-600';

  return (
    <div 
      id="executive-meeting-report"
      className="w-full max-w-[850px] mx-auto bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-xl print:shadow-none print:p-0 print:max-w-none text-sm leading-relaxed"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* BRAND COVER HEADER */}
      <div className={`${themeHeaderBg} text-white rounded-xl p-6 sm:p-8 mb-8 shadow-md print:rounded-none relative overflow-hidden pdf-page-break-avoid`}>
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base tracking-wider text-amber-300">
              HX
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                Hexavia Status Intelligence
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                EXECUTIVE PM PLATFORM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              CONFIDENTIAL • EXECUTIVE BRIEF
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Meeting Intelligence Record
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {docTitle}
          </h1>
        </div>

        {/* METADATA STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-blue-300" /> Date
            </div>
            <div className="font-medium text-white truncate">
              {data.meeting_date || 'N/A'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <FolderGit2 className="w-3 h-3 text-emerald-300" /> Project
            </div>
            <div className="font-medium text-white truncate">
              {data.projectName || 'General / Unassigned'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-amber-300" /> Participants
            </div>
            <div className="font-medium text-white truncate">
              {participants.length > 0 ? `${participants.length} Key Stakeholders` : 'Recorded in Brief'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3 text-purple-300" /> Source File
            </div>
            <div className="font-medium text-white truncate">
              {data.file_name || 'Transcript Sync'}
            </div>
          </div>
        </div>
      </div>

      {/* ATTENDEES CHIPS */}
      {participants.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Meeting Participants & Stakeholders ({participants.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((person, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                  {person.charAt(0).toUpperCase()}
                </span>
                {person}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* EXECUTIVE SUMMARY */}
      {data.executive_summary && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Executive Summary
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Strategic Context & Synthesis
            </span>
          </div>

          <div className={`p-5 rounded-xl bg-slate-50 border-l-4 ${themeAccentBorder} border-t border-r border-b border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm`}>
            <p className="whitespace-pre-line">
              {data.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* ACTION ITEMS & DELIVERABLES MATRIX */}
      {actionItems.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Action Items & Commitments Matrix ({actionItems.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Accountability Tracking
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4 w-[55%]">Deliverable / Action Item</th>
                  <th className="py-3 px-4 w-[25%]">Assignee / Owner</th>
                  <th className="py-3 px-4 w-[20%] text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {actionItems.map((item, idx) => {
                  const taskText = typeof item === 'string' ? item : (item.task || item.item || JSON.stringify(item));
                  const ownerName = typeof item === 'object' && item ? (item.assignee || item.owner || 'Team / Unassigned') : 'Team';
                  const deadlineStr = typeof item === 'object' && item ? (item.deadline || item.due_date || 'TBD') : 'TBD';
                  const priority = typeof item === 'object' && item ? item.priority : undefined;

                  const priorityBadge = 
                    priority?.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    priority?.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-normal text-slate-800 align-top">
                        <div className="flex items-start gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <span className="font-medium text-slate-900 leading-snug block">
                              {taskText}
                            </span>
                            {priority && (
                              <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${priorityBadge}`}>
                                Priority: {priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-semibold text-slate-700 text-xs">
                          <User className="w-3 h-3 text-slate-500" />
                          {ownerName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right align-top">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {deadlineStr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KEY DECISIONS & BLOCKERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* KEY DECISIONS */}
        {keyDecisions.length > 0 && (
          <div className="pdf-page-break-avoid">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-4 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Key Decisions Agreed Upon ({keyDecisions.length})
              </h2>
            </div>

            <div className="space-y-2.5">
              {keyDecisions.map((dec, idx) => {
                const decText = typeof dec === 'string' ? dec : JSON.stringify(dec);
                return (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                      {decText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BLOCKERS & RISKS */}
        {keyBlockers.length > 0 && (
          <div className="pdf-page-break-avoid">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-4 rounded-full bg-rose-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Blockers & Identified Risks ({keyBlockers.length})
              </h2>
            </div>

            <div className="space-y-2.5">
              {keyBlockers.map((blk, idx) => {
                const blkText = typeof blk === 'string' ? blk : JSON.stringify(blk);
                return (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-start gap-3 shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-rose-900 leading-relaxed">
                      {blkText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SPEAKER BREAKDOWN ("WHO SAID WHAT") */}
      {whoSaidWhat.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-slate-900" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Speaker Breakdown & Discussion Intelligence
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Contribution Attribution
            </span>
          </div>

          <div className="space-y-4">
            {whoSaidWhat.map((item, idx) => {
              const speakerName = item.speaker || item.participant || `Speaker ${idx + 1}`;
              
              // Points extraction
              const pointsList: string[] = [];
              if (Array.isArray(item.main_points) && item.main_points.length > 0) {
                pointsList.push(...item.main_points);
              } else if (Array.isArray(item.points) && item.points.length > 0) {
                pointsList.push(...item.points);
              } else if (item.points) {
                pointsList.push(String(item.points));
              } else if (item.discussion) {
                pointsList.push(item.discussion);
              } else if (item.summary) {
                pointsList.push(item.summary);
              }

              // Commitments extraction
              const commitmentsList: string[] = [];
              if (Array.isArray(item.commitments) && item.commitments.length > 0) {
                commitmentsList.push(...item.commitments);
              }

              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4.5 shadow-xs pdf-page-break-avoid space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {speakerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          {speakerName}
                        </h3>
                      </div>
                    </div>

                    {item.sentiment && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Sentiment: {item.sentiment}
                      </span>
                    )}
                  </div>

                  {/* Main Points */}
                  {pointsList.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        Key Perspectives & Status Updates:
                      </p>
                      <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc marker:text-blue-500">
                        {pointsList.map((pt, pIdx) => (
                          <li key={pIdx} className="leading-relaxed">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Explicit Commitments */}
                  {commitmentsList.length > 0 && (
                    <div className="mt-2 bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 mb-1">
                        <CheckSquare className="w-3 h-3 text-emerald-600" />
                        Explicit Commitments Made:
                      </p>
                      <ul className="list-disc pl-4 text-emerald-950 space-y-0.5 marker:text-emerald-600">
                        {commitmentsList.map((comm, cIdx) => (
                          <li key={cIdx} className="leading-snug">
                            {comm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXECUTIVE DOCUMENT FOOTER */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Hexavia Status</span>
          <span>•</span>
          <span>Enterprise Project Intelligence & Executive Documentation</span>
        </div>
        <div>
          <span>Document Generated Automatically</span>
        </div>
      </div>
    </div>
  );
};
