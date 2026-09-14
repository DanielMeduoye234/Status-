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
  ShieldCheck,
  Building2,
  Target,
  ArrowRight
} from 'lucide-react';

import { 
  HexaviaAttendanceGroup, 
  HexaviaPreviousActionReview, 
  HexaviaBusinessReview, 
  HexaviaPersonActionPoints 
} from '@/lib/ai/aiService';

interface Props {
  data: MeetingPDFData;
  theme?: 'navy' | 'slate' | 'emerald';
}

function extractEmbeddedHexaviaMeta(markdown?: string): Record<string, any> {
  if (!markdown) return {};
  const match = markdown.match(/<!--\s*HEXAVIA_METADATA:\s*([\s\S]*?)\s*-->/);
  if (!match || !match[1]) return {};
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return {};
  }
}

export const ExecutiveMeetingTemplate: React.FC<Props> = ({ 
  data, 
  theme = 'navy' 
}) => {
  const embedded = extractEmbeddedHexaviaMeta(data.summary_markdown);

  const docTitle = data.title || embedded.title || 'Executive Meeting & Strategic Alignment Session';
  const meetingDate = data.meeting_date || embedded.meeting_date || '';
  const meetingTime = data.meeting_time || embedded.meeting_time || '';
  const inAttendance: HexaviaAttendanceGroup[] = data.in_attendance || embedded.in_attendance || [];
  const agenda: string[] = data.agenda || embedded.agenda || [];
  const meetingObjective = data.meeting_objective || embedded.meeting_objective || data.executive_summary || '';
  const openingAndContext = data.opening_and_context || embedded.opening_and_context || '';
  const reviewPreviousActions: HexaviaPreviousActionReview[] = data.review_of_previous_actions || embedded.review_of_previous_actions || [];
  const businessDevelopmentReviews: HexaviaBusinessReview[] = data.business_development_reviews || embedded.business_development_reviews || [];
  const actionPointsByPerson: HexaviaPersonActionPoints[] = data.action_points_by_person || embedded.action_points_by_person || [];
  const closingRemarks = data.closing_remarks || embedded.closing_remarks || '';
  const minutesPreparedBy = data.minutes_prepared_by || embedded.minutes_prepared_by || {
    name: data.participants?.[0] || inAttendance?.[0]?.attendees?.[0]?.name || 'Project Lead',
    role: 'Project Manager / Facilitator',
    organization: inAttendance?.[0]?.organization || 'Project Team'
  };

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
      className="w-full max-w-[850px] mx-auto bg-white text-slate-900 font-sans p-6 sm:p-10 shadow-xl print:shadow-none print:p-0 print:max-w-none text-sm leading-relaxed"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* 1. OFFICIAL HEXAVIA CORPORATE HEADER */}
      <div className="mb-6 rounded-lg border border-sky-400/80 overflow-hidden shadow-xs pdf-page-break-avoid">
        <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Hexavia 3-bar logo mark */}
            <div className="flex items-center gap-1.5 h-10 px-2 py-1 rounded bg-slate-50 border border-slate-200 shrink-0">
              <div className="w-2 h-8 bg-blue-600 rounded-sm" />
              <div className="w-2 h-6 bg-blue-500 rounded-sm" />
              <div className="w-2 h-8 bg-blue-600 rounded-sm" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-sans">
                  Hexavia!
                </span>
              </div>
              <p className="text-[10px] tracking-[0.25em] font-bold text-slate-500 uppercase">
                L I M I T E D
              </p>
            </div>
          </div>

          <div className="text-right sm:max-w-md">
            <p className="text-[11px] text-slate-600 font-medium leading-snug">
              39A, Awudu Ekpegha Boulevard Street, Off Admiralty Road, Lekki Phase 1, Lagos
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Hexavia.net • 08035202891 • @hexavia
            </p>
          </div>
        </div>

        {/* Brand Copyright Sub-Bar */}
        <div className="bg-sky-50 border-t border-sky-300 px-4 py-1.5 flex items-center justify-between text-[11px] font-semibold text-sky-800">
          <span>Enterprise Management & Organizational Diagnostic Intelligence</span>
          <span className="text-sky-900 font-bold">© By Hexavia! www.hexavia.africa</span>
        </div>
      </div>

      {/* 2. STRATEGIC ALIGNMENT COVER BANNER */}
      <div className={`${themeHeaderBg} text-white rounded-xl p-6 sm:p-7 mb-8 shadow-md print:rounded-none relative overflow-hidden pdf-page-break-avoid`}>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/20 text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              CONFIDENTIAL • ORGANIZATIONAL DIAGNOSTIC & STRATEGIC ALIGNMENT
            </span>
          </div>

          <div className="text-xs text-slate-300 font-medium">
            Hexavia Consulting Minutes
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Meeting Minutes Record
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {docTitle}
          </h1>
        </div>

        {/* METADATA STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
              <Calendar className="w-3 h-3 text-blue-300" /> Date
            </div>
            <div className="font-semibold text-white truncate">
              {meetingDate || 'Friday, August 14, 2026'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-emerald-300" /> Time
            </div>
            <div className="font-semibold text-white truncate">
              {meetingTime || '4:00 pm – 4:30 pm'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
              <FolderGit2 className="w-3 h-3 text-amber-300" /> Project / Track
            </div>
            <div className="font-semibold text-white truncate">
              {data.projectName || (data.title && !data.title.includes('Executive Meeting') ? data.title.split(':')[0] : 'Project Workstream')}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
              <User className="w-3 h-3 text-purple-300" /> Minutes Prepared By
            </div>
            <div className="font-semibold text-white truncate">
              {minutesPreparedBy?.name || data.participants?.[0] || 'Project Lead'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. IN ATTENDANCE */}
      <div className="mb-7 pdf-page-break-avoid">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            In Attendance
          </h2>
        </div>

        {inAttendance.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inAttendance.map((grp, gIdx) => (
              <div key={gIdx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 border-b border-slate-200/80 pb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{grp.organization}</span>
                </div>
                <div className="space-y-1.5">
                  {grp.attendees.map((att, aIdx) => (
                    <div key={aIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">{att.name}</span>
                        <span className="text-slate-500"> – {att.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>

      {/* 4. AGENDA */}
      {agenda.length > 0 && (
        <div className="mb-7 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                AGENDA ({agenda.length} Key Topics)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Session Roadmap
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-800">
              {agenda.map((item, idx) => {
                const formatted = item.replace(/^\d+\.\s*/, '');
                return (
                  <div key={idx} className="flex items-start gap-2 py-0.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-100 font-mono text-[10px] font-bold text-blue-800">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. MEETING OBJECTIVE */}
      {meetingObjective && (
        <div className="mb-7 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                MEETING OBJECTIVE
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Strategic Purpose & Revenue Focus
            </span>
          </div>

          <div className={`p-4 sm:p-5 rounded-xl bg-slate-50 border-l-4 ${themeAccentBorder} border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed shadow-2xs`}>
            <p className="whitespace-pre-line">
              {meetingObjective}
            </p>
          </div>
        </div>
      )}

      {/* 6. OPENING AND CONTEXT SETTING */}
      {openingAndContext && (
        <div className="mb-7 pdf-page-break-avoid">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-4 rounded-full bg-slate-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              OPENING AND CONTEXT SETTING
            </h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-700 text-xs leading-relaxed">
            <p className="whitespace-pre-line">{openingAndContext}</p>
          </div>
        </div>
      )}

      {/* 7. REVIEW OF PREVIOUS ACTION POINTS */}
      {reviewPreviousActions.length > 0 && (
        <div className="mb-7 pdf-page-break-avoid">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-4 rounded-full bg-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              REVIEW OF PREVIOUS ACTION POINTS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviewPreviousActions.map((grp, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>{grp.track}</span>
                  <span className="text-[10px] font-semibold text-slate-500">{grp.items.length} items</span>
                </h3>
                <ul className="space-y-1 text-xs text-slate-700">
                  {grp.items.map((it, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold mt-0.5">•</span>
                      <span className="leading-snug">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. BUSINESS DEVELOPMENT & OPERATIONAL REVIEWS (DEEP DIVES) */}
      {businessDevelopmentReviews.length > 0 && (
        <div className="mb-8 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-4 rounded-full bg-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Business Development & Operational Workstream Reviews
            </h2>
          </div>

          {businessDevelopmentReviews.map((rev, rIdx) => (
            <div key={rIdx} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs pdf-page-break-avoid">
              <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-blue-900">
                  {rev.track}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  {rev.subsections.length} Subsections
                </span>
              </div>

              <div className="p-5 divide-y divide-slate-100 space-y-4">
                {rev.subsections.map((sub, sIdx) => (
                  <div key={sIdx} className={sIdx > 0 ? 'pt-4 space-y-2' : 'space-y-2'}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                        {sub.topic}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {sub.details}
                    </p>

                    {sub.metrics_or_facts && sub.metrics_or_facts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sub.metrics_or_facts.map((m, mIdx) => (
                          <span 
                            key={mIdx}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800 border border-blue-200"
                          >
                            <span className="text-blue-500">🏷️</span>
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

      {/* 9. ACTION POINTS AND NEXT STEPS (BY ASSIGNEE) */}
      {actionPointsByPerson.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Action Points & Next Steps (Categorized by Stakeholder)
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Accountability Tracking
            </span>
          </div>

          <div className="space-y-4">
            {actionPointsByPerson.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {p.person.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{p.person}</h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {p.role}{p.organization ? ` – ${p.organization}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {p.actions.length} Deliverable{p.actions.length > 1 ? 's' : ''}
                  </span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
                  {p.actions.map((act, aIdx) => (
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

      {/* 10. ACTION ITEMS MATRIX TABLE */}
      {actionItems.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Action Items Deliverables Matrix ({actionItems.length})
              </h2>
            </div>
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
                      <td className="py-3 px-4 font-normal text-slate-800 align-top">
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

                      <td className="py-3 px-4 align-top">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-semibold text-slate-700 text-xs">
                          <User className="w-3 h-3 text-slate-500" />
                          {ownerName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right align-top">
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

      {/* 11. KEY DECISIONS & BLOCKERS GRID */}
      {(keyDecisions.length > 0 || keyBlockers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {keyDecisions.length > 0 && (
            <div className="pdf-page-break-avoid">
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Key Decisions Agreed Upon ({keyDecisions.length})
                </h2>
              </div>
              <div className="space-y-2">
                {keyDecisions.map((dec, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-800 leading-relaxed flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{typeof dec === 'string' ? dec : JSON.stringify(dec)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {keyBlockers.length > 0 && (
            <div className="pdf-page-break-avoid">
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Blockers & Identified Risks ({keyBlockers.length})
                </h2>
              </div>
              <div className="space-y-2">
                {keyBlockers.map((blk, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-rose-900 leading-relaxed flex items-start gap-2">
                    <span className="text-rose-600 font-bold">!</span>
                    <span>{typeof blk === 'string' ? blk : JSON.stringify(blk)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 12. WHO SAID WHAT (SPEAKER BREAKDOWN) */}
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

          <div className="space-y-3.5">
            {whoSaidWhat.map((item, idx) => {
              const speakerName = item.speaker || item.participant || `Speaker ${idx + 1}`;
              const pointsList: string[] = [];
              if (Array.isArray(item.main_points) && item.main_points.length > 0) {
                pointsList.push(...item.main_points);
              } else if (Array.isArray(item.points) && item.points.length > 0) {
                pointsList.push(...item.points);
              } else if (item.points) {
                pointsList.push(String(item.points));
              }

              const commitmentsList: string[] = [];
              if (Array.isArray(item.commitments) && item.commitments.length > 0) {
                commitmentsList.push(...item.commitments);
              }

              return (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {speakerName.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900">{speakerName}</h3>
                    </div>
                    {item.sentiment && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {item.sentiment}
                      </span>
                    )}
                  </div>

                  {pointsList.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc marker:text-blue-500">
                      {pointsList.map((pt, pIdx) => (
                        <li key={pIdx} className="leading-relaxed">{pt}</li>
                      ))}
                    </ul>
                  )}

                  {commitmentsList.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-950">
                      <span className="font-bold text-emerald-800 block mb-0.5">Explicit Commitments:</span>
                      <ul className="list-disc pl-4 space-y-0.5 marker:text-emerald-600">
                        {commitmentsList.map((comm, cIdx) => (
                          <li key={cIdx}>{comm}</li>
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

      {/* 13. CLOSING */}
      {closingRemarks && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-4 rounded-full bg-slate-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              CLOSING
            </h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
            {closingRemarks}
          </div>
        </div>
      )}

      {/* 14. MINUTES PREPARED BY SIGN-OFF */}
      {minutesPreparedBy && (
        <div className="mb-8 p-4.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pdf-page-break-avoid">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Minutes Prepared By:
            </span>
            <p className="text-sm font-bold text-slate-900">
              {minutesPreparedBy.name}, {minutesPreparedBy.role}
            </p>
            <p className="text-xs text-slate-600">
              {minutesPreparedBy.organization}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified & Documented
            </span>
          </div>
        </div>
      )}

      {/* 15. FOOTER */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Hexavia Status</span>
          <span>•</span>
          <span>Organizational Diagnostic & Strategic Alignment Platform</span>
        </div>
        <div>
          <span>© By Hexavia! www.hexavia.africa</span>
        </div>
      </div>
    </div>
  );
};
