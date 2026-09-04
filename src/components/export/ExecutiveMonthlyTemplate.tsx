'use client';

import React from 'react';
import { MonthlyReportPDFData } from '@/lib/export/pdfExport';
import { 
  Calendar, 
  FolderGit2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Award, 
  Target, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  Flame,
  UserCheck,
  CheckSquare
} from 'lucide-react';

interface Props {
  data: MonthlyReportPDFData;
  theme?: 'navy' | 'slate' | 'emerald';
}

export const ExecutiveMonthlyTemplate: React.FC<Props> = ({ 
  data, 
  theme = 'navy' 
}) => {
  const docTitle = data.title || 'Executive Monthly Status Report';
  const milestones = data.milestones_achieved || [];
  const inProgress = data.in_progress_items || [];
  const risks = data.risks_blockers || [];
  const decisions = data.decisions_log || [];
  const contributors = data.contributor_highlights || [];
  const nextGoals = data.next_month_goals || [];

  const health = data.health_status || 'on_track';
  const healthConfig = {
    on_track: { label: 'ON TRACK', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', dot: 'bg-emerald-400' },
    at_risk: { label: 'AT RISK', bg: 'bg-amber-500/20 text-amber-300 border-amber-400/40', dot: 'bg-amber-400' },
    delayed: { label: 'DELAYED', bg: 'bg-rose-500/20 text-rose-300 border-rose-400/40', dot: 'bg-rose-400' },
    completed: { label: 'COMPLETED', bg: 'bg-blue-500/20 text-blue-300 border-blue-400/40', dot: 'bg-blue-400' },
  }[health] || { label: 'ON TRACK', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', dot: 'bg-emerald-400' };

  // Theme accents
  const themeHeaderBg = 
    theme === 'emerald' ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900' :
    theme === 'slate' ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900' :
    'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900';

  return (
    <div 
      id="executive-monthly-report"
      className="w-full max-w-[850px] mx-auto bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-xl print:shadow-none print:p-0 print:max-w-none text-sm leading-relaxed"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* BRAND COVER HEADER */}
      <div className={`${themeHeaderBg} text-white rounded-xl p-6 sm:p-8 mb-8 shadow-md print:rounded-none relative overflow-hidden pdf-page-break-avoid`}>
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
                MONTHLY EXECUTIVE STEERING RECORD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${healthConfig.bg}`}>
              <span className={`w-2 h-2 rounded-full ${healthConfig.dot} animate-pulse`} />
              HEALTH STATUS: {healthConfig.label}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Executive Monthly Status & Trajectory Report
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {docTitle}
          </h1>
        </div>

        {/* METADATA STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-indigo-300" /> Reporting Cycle
            </div>
            <div className="font-medium text-white truncate">
              {data.month_year || 'N/A'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <FolderGit2 className="w-3 h-3 text-emerald-300" /> Target Project
            </div>
            <div className="font-medium text-white truncate">
              {data.projectName || 'Cross-Organizational Portfolio'}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3 text-amber-300" /> Governance Level
            </div>
            <div className="font-medium text-white truncate">
              Executive Steering Review
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      {data.executive_summary && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Executive Synthesis & Velocity Overview
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Monthly Leadership Brief
            </span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border-l-4 border-indigo-600 border-t border-r border-b border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm">
            <p className="whitespace-pre-line">
              {data.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* MILESTONES ACHIEVED */}
      {milestones.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Major Milestones Achieved ({milestones.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Completed Deliverables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {milestones.map((m, idx) => {
              const title = typeof m === 'string' ? m : (m.milestone || m.title || JSON.stringify(m));
              const impact = typeof m === 'object' && m ? m.impact : undefined;
              const dateAchieved = typeof m === 'object' && m ? m.date_achieved : undefined;

              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-1.5 shadow-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {title}
                      </h3>
                      {dateAchieved && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Completed: {dateAchieved}
                        </span>
                      )}
                    </div>
                  </div>
                  {impact && (
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      <strong className="text-emerald-900 font-semibold">Impact: </strong>
                      {impact}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IN-PROGRESS ITEMS */}
      {inProgress.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Key Initiatives In Flight ({inProgress.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Active Workstreams
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4 w-[60%]">Deliverable / Workstream</th>
                  <th className="py-3 px-4 w-[20%]">Lead Owner</th>
                  <th className="py-3 px-4 w-[20%] text-right">Target Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inProgress.map((item, idx) => {
                  const deliv = typeof item === 'string' ? item : (item.deliverable || item.title || JSON.stringify(item));
                  const owner = typeof item === 'object' && item ? (item.owner || 'Assigned Team') : 'Team';
                  const completion = typeof item === 'object' && item ? (item.expected_completion || 'Ongoing') : 'Ongoing';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 align-top">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <span>{deliv}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold align-top">
                        {owner}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium align-top">
                        <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                          {completion}
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

      {/* RISKS & DECISIONS SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* RISKS & BLOCKERS */}
        {risks.length > 0 && (
          <div className="pdf-page-break-avoid">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-4 rounded-full bg-rose-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Risks & Mitigation Matrix ({risks.length})
              </h2>
            </div>

            <div className="space-y-3">
              {risks.map((r, idx) => {
                const riskDesc = typeof r === 'string' ? r : (r.risk || JSON.stringify(r));
                const severity = typeof r === 'object' && r ? r.severity : undefined;
                const mitigation = typeof r === 'object' && r ? r.mitigation_plan : undefined;

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200/70 space-y-1.5 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-rose-950 leading-snug">
                          {riskDesc}
                        </span>
                      </div>
                      {severity && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                          {severity}
                        </span>
                      )}
                    </div>
                    {mitigation && (
                      <p className="text-xs text-slate-700 pl-6 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">Mitigation: </strong>
                        {mitigation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DECISIONS LOG */}
        {decisions.length > 0 && (
          <div className="pdf-page-break-avoid">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-4 rounded-full bg-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Governance & Architectural Decisions ({decisions.length})
              </h2>
            </div>

            <div className="space-y-3">
              {decisions.map((d, idx) => {
                const decText = typeof d === 'string' ? d : (d.decision || JSON.stringify(d));
                const rationale = typeof d === 'object' && d ? d.rationale : undefined;

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-200/70 space-y-1.5 shadow-xs">
                    <div className="flex items-start gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {decText}
                      </span>
                    </div>
                    {rationale && (
                      <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                        <strong className="text-slate-800 font-semibold">Rationale: </strong>
                        {rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CONTRIBUTOR HIGHLIGHTS */}
      {contributors.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Team Member Recognition & Key Highlights
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {contributors.map((c, idx) => {
              const name = typeof c === 'string' ? c : (c.contributor || c.name || `Contributor ${idx + 1}`);
              const note = typeof c === 'object' && c ? (c.highlight || (c as any).key_contributions) : undefined;

              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900">
                      {name}
                    </h3>
                  </div>
                  {note && (
                    <p className="text-xs text-slate-600 leading-snug">
                      {note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEXT MONTH ROADMAP & GOALS */}
      {nextGoals.length > 0 && (
        <div className="mb-8 pdf-page-break-avoid">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Upcoming Cycle Priorities & Goals ({nextGoals.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {nextGoals.map((goal, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs font-medium text-slate-800 leading-snug">
                  {goal}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXECUTIVE DOCUMENT FOOTER */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Hexavia Status</span>
          <span>•</span>
          <span>Enterprise Monthly Portfolio Governance & Intelligence</span>
        </div>
        <div>
          <span>Confidential Executive Distribution</span>
        </div>
      </div>
    </div>
  );
};
