'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, X, ArrowRight, Calendar, FolderKanban } from 'lucide-react';
import { MeetingSummaryItem, Project } from '@/lib/context/AuthContext';

export function useRecordedMeetingId() {
  const [recordedId, setRecordedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRecordedId(params.get('recorded'));
  }, []);

  return {
    recordedId: dismissed ? null : recordedId,
    dismiss: () => setDismissed(true),
  };
}

export default function JustRecordedBanner({
  meeting,
  project,
  onDismiss,
}: {
  meeting: MeetingSummaryItem;
  project?: Project | null;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-950">Just recorded</p>
            <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">{meeting.title}</h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mt-1">
              {project && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2 py-0.5 font-semibold text-emerald-800">
                  <FolderKanban className="h-3 w-3" />
                  {project.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                {meeting.meeting_date}
              </span>
              <span>{meeting.action_items?.length || 0} action items</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/meeting-summary?id=${meeting.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold"
        >
          <span>Open minutes</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
        {project && (
          <Link
            href={`/projects/${project.id}?recorded=${meeting.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 px-3 py-1.5 text-xs font-bold"
          >
            Open project
          </Link>
        )}
      </div>
    </div>
  );
}
