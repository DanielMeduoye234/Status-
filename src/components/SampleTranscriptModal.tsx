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
    id: 'hexavia-strategic-diagnostic',
    title: 'Hexavia - Sway Liners / Mpenziwe Bed Outfit: Strategic Alignment Session',
    description: '14-point strategic alignment & diagnostic session covering CAC registration (₦45k), staff recruitment, bedding partnerships, and estate marketing.',
    transcript: `00:00:05 Ms. Funto Adeniyi (Hexavia Consulting): Good afternoon Mrs. Stella and Mr. Ikenna. Welcome to today's Organizational Diagnostic and Strategic Alignment Session for Sway Liners and Mpenziwe Bed Outfits. Apologies for the slight network delay as everyone connected. Let us proceed with reviewing the previous action points.
00:00:35 Mrs. Stella Obimba (Mpenziwe Bed Outfits): Good afternoon Ms. Funto. On my end, for the CAC registration, I have submitted my details to the registration consultant. There was a brief delay earlier because I misplaced my printed ID document, but that is resolved now.
00:01:05 Ms. Funto Adeniyi (Hexavia Consulting): Thank you Mrs. Stella. As clarified with Mr. Eizu, the consultant quoted ₦45,000 per business, which brings the total cost to ₦90,000 for both Swayliners and Mpenziwe under our negotiated joint rate. Mr. Ikenna, what is the status of your documentation?
00:01:25 Mr. Ikenna Uwaoma (Sway Liners): Good afternoon everyone. I am currently retrieving the final outstanding documents on my side. I will submit everything to the consultant before our next meeting so we can lock in the ₦45,000 joint filing rate.
00:01:45 Ms. Funto Adeniyi (Hexavia Consulting): Excellent. Mrs. Stella, regarding the proposed Mpenziwe logo and interior decoration training?
00:02:02 Mrs. Stella Obimba (Mpenziwe Bed Outfits): I have an alternative logo design ready and will send it to you today to compare with the mock-up in the business proposal. On the training, I have progressed to Module 5. It is largely reading-based with module assessments.
00:02:22 Ms. Funto Adeniyi (Hexavia Consulting): Understood. Remember to complement the course reading with practical exposure—watch Nigerian interior decoration transformation videos on YouTube and study local trends. Also, from my research into associations, LinkedIn was mostly inactive locally, but Instagram has an active network of Nigerian interior decorators. I recommend connecting with 1 or 2 established decorators.
00:02:50 Mrs. Stella Obimba (Mpenziwe Bed Outfits): I will definitely do that. Also, I regained access to my LinkedIn account from another phone, so I will share my profile name in our group for review. In terms of bedding outreach, I visited approximately six outlets this week, including four mattress shops. One mattress outlet owner on Oka Road showed strong interest because his existing bedding supplier is unreliable. I left my business card and will follow up to obtain his mattress grade prices.
00:03:30 Ms. Funto Adeniyi (Hexavia Consulting): That is very encouraging progress on Oka Road. That creates a mutual referral sales channel. What about flyer distribution?
00:03:45 Mrs. Stella Obimba (Mpenziwe Bed Outfits): I retained fewer than 20 flyers so I can distribute them strategically during physical store visits. I gave 3 flyers to the Oka Road shop for counter display.
00:04:05 Ms. Funto Adeniyi (Hexavia Consulting): Perfect strategy. Mr. Ikenna, let us review Swayliners: banner placement, customer acquisition, and laundry recruitment.
00:04:22 Mr. Ikenna Uwaoma (Sway Liners): Despite conference travel last week, we made solid progress on the banner placement at the commercial building in the estate. Gigi is assisting with getting the woman's approval. We have printed 2 banners and 2 sticker posters—one poster is already placed at the front compound.
00:04:50 Mr. Ikenna Uwaoma (Sway Liners): On recruitment, we had a major breakthrough. I interviewed a prospective laundry operator who is reasonably experienced. He agreed to our proposed salary. However, considering his commute distance and transport costs, requiring 6 days weekly was impractical. We structured a 4-day working schedule, with Friday and Saturday attracting supplemental daily pay when workload surges. He resumes next week subject to signed guarantor documentation.
00:05:35 Ms. Funto Adeniyi (Hexavia Consulting): Outstanding news on the hire! Accountability is vital, so ensure the guarantor documentation is completed before resumption. How is customer acquisition in the estate?
00:05:52 Mr. Ikenna Uwaoma (Sway Liners): We gained a new customer via the estate app code system, and another customer returned with a large order through compound recommendation. Regarding flyer distribution, estate security is strict. We agreed that once the new staff arrives, we will introduce him to estate security and have him accompany an authorized person.
00:06:20 Mr. Ikenna Uwaoma (Sway Liners): One challenge: our written customer testimonial on Instagram was automatically deleted after posting. We also have a video testimonial from a satisfied customer.
00:06:40 Ms. Funto Adeniyi (Hexavia Consulting): I will investigate the technical trigger behind Instagram deleting the post, whether it is caption moderation or file format. Let us continue with fresh varied content. To wrap up: I will follow up with Mr. Eizu on CAC and review the Mpenziwe logo. Mrs. Stella will follow up with the Oka Road prospect and continue Module 5. Mr. Ikenna will finalize CAC documents and complete laundry staff onboarding with guarantors.
00:07:15 Mrs. Stella Obimba (Mpenziwe Bed Outfits): Agreed, thank you Ms. Funto.
00:07:22 Mr. Ikenna Uwaoma (Sway Liners): Agreed. Meeting adjourned.`,
  },
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
