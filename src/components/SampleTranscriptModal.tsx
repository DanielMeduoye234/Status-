'use client';

import React from 'react';
import { X, FileText } from 'lucide-react';

interface SampleTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sampleText: string, title: string) => void;
}

export const SAMPLE_TRANSCRIPTS = [
  {
    id: 'sprint-sync',
    title: 'Sprint 24 Engineering Sync & Blockers',
    description: '4-person Zoom meeting discussing frontend deliverables, backend database migrations, and QA timeline.',
    transcript: `00:00:02 Alex (Engineering Lead): Good morning everyone, let's start the Sprint 24 standup and review blockers for the release.
00:00:15 Sarah (Frontend Lead): Hey Alex. On the frontend side, we finished the new Project Manager dashboard and the tabbed navigation. The only pending item is connecting the monthly report export to PDF. I will finish that by tomorrow afternoon.
00:00:38 Alex (Engineering Lead): Great work Sarah. David, how are we looking on the Supabase database migrations and Row Level Security?
00:00:49 David (Backend Engineer): Everything is deployed to staging. The RLS policies ensure PMs can only access their respective project data. I did notice a small latency bottleneck on large transcript uploads, so I will add a composite index on user_id and meeting_date today.
00:01:14 Elena (Product Manager): Thanks David. From the product standpoint, our client stakeholder review is scheduled for Thursday at 3 PM. We need all core flows tested by Wednesday EOD.
00:01:31 Alex (Engineering Lead): Understood. David, make sure the indexing PR is merged before Wednesday noon. Sarah, coordinate with QA for visual regression tests.
00:01:45 Sarah (Frontend Lead): Will do. I'll sync with Elena after this call to review the final export layout.
00:01:56 Elena (Product Manager): Perfect. Also, we agreed to drop the legacy CSV parser and stick strictly to TXT and VTT formats. Let's make that official.
00:02:12 Alex (Engineering Lead): Agreed. Decision is logged. Let's wrap up and get to work!`,
  },
  {
    id: 'architecture-review',
    title: 'Enterprise Architecture & Cloud Security Review',
    description: 'Technical sync between Tech Lead, DevOps, and Security Director on SOC2 and API rate limits.',
    transcript: `00:00:05 Marcus (Tech Lead): Thanks for joining the architecture sync. Our main focus today is resolving third-party rate limits and finalizing the SOC2 compliance plan.
00:00:22 Priya (DevOps Lead): Hi Marcus. I reviewed our traffic patterns. During end-of-month report generation, we risk hitting rate limits if multiple PMs run batch synthesis simultaneously. I propose implementing a Redis queue with exponential backoff and job retries.
00:00:48 Marcus (Tech Lead): That makes complete sense. How long will the queue take to implement?
00:00:54 Priya (DevOps Lead): About 2 days. I can have it ready in staging by Friday.
00:01:05 James (Security Director): From a compliance perspective, make sure raw Zoom transcripts containing sensitive stakeholder names are encrypted at rest with AES-256 and that our audit log captures every report export.
00:01:25 Priya (DevOps Lead): Confirmed. The Supabase storage bucket already enforces encryption at rest, and I will enable the audit logging extension today.
00:01:38 Marcus (Tech Lead): Excellent. Decision: We approve the queue implementation and mandatory audit logging for all report exports. James, will you sign off on the SOC2 readiness checklist by Monday?
00:01:52 James (Security Director): Yes, send me the documentation by Thursday EOD and I will review and sign off by Monday morning.
00:02:05 Marcus (Tech Lead): Perfect, meeting adjourned.`,
  },
  {
    id: 'client-status',
    title: 'Executive Stakeholder Monthly Steering Review',
    description: 'High-level steering sync with Client Sponsors, Project Director, and Lead Architect.',
    transcript: `00:00:03 Rachel (Project Director): Welcome everyone to our monthly steering committee review for the Hexavia Platform rollout.
00:00:18 John (Client Sponsor): Thanks Rachel. Overall we are very pleased with the milestones delivered this month, particularly the automated meeting intelligence features. What is the status of the mobile responsive dashboard?
00:00:35 Rachel (Project Director): We are on track for a 100% rollout by mid-next month. The team completed testing on both iOS and Android viewports last week.
00:00:50 Liam (Lead Architect): Furthermore, system uptime this month was 99.98%, with zero reported security incidents.
00:01:08 John (Client Sponsor): That is fantastic news. What are our primary risk areas for next month?
00:01:19 Rachel (Project Director): Our primary dependency is the client sign-off on the single sign-on (SSO) SAML configuration. Once your IT team provides the metadata XML, we can enable it within 24 hours.
00:01:36 John (Client Sponsor): I will follow up with our IT Director today and have the metadata sent to you by tomorrow.
00:01:48 Rachel (Project Director): Wonderful. We will proceed with the final staging validation and target production launch for the 28th.`,
  },
];

export default function SampleTranscriptModal({
  isOpen,
  onClose,
  onSelectSample,
}: SampleTranscriptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Load Sample Zoom Transcript</h2>
              <p className="text-xs text-slate-500">Test meeting summaries and speaker breakdown instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {SAMPLE_TRANSCRIPTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample.transcript, sample.title);
                onClose();
              }}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {sample.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>
                </div>
                <button className="flex-shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  Use This
                </button>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 p-2.5 font-mono text-[10px] text-slate-600 line-clamp-2 border border-slate-100">
                {sample.transcript.slice(0, 160)}...
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
