export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | 'webex' | 'other';

export type BotStatus = 
  | 'idle'
  | 'connecting'
  | 'waiting_room'
  | 'in_meeting'
  | 'transcribing'
  | 'completed'
  | 'error';

export interface TranscriptChunk {
  timestamp: string;
  speaker: string;
  role?: string;
  avatarColor: string;
  text: string;
}

export interface BotSession {
  id: string;
  meetingUrl: string;
  platform: MeetingPlatform;
  title: string;
  projectId?: string;
  projectName?: string;
  botName: string;
  status: BotStatus;
  startedAt?: string;
  durationSeconds: number;
  participants: string[];
  activeSpeaker?: string;
  transcriptChunks: TranscriptChunk[];
  fullTranscript: string;
  postGreeting: boolean;
  scheduledTime?: string;
  isRealBot?: boolean;
  recallBotId?: string;
  recallStatus?: string;
  errorDetail?: string;
}

/**
 * Detect meeting platform from URL
 */
export function detectMeetingPlatform(url: string): {
  platform: MeetingPlatform;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
} {
  const cleanUrl = url.trim().toLowerCase();

  if (cleanUrl.includes('meet.google.com')) {
    return {
      platform: 'google_meet',
      label: 'Google Meet',
      color: '#00897B',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-700',
    };
  }
  if (cleanUrl.includes('zoom.us')) {
    return {
      platform: 'zoom',
      label: 'Zoom Video',
      color: '#2D8CFF',
      badgeBg: 'bg-blue-50 border-blue-200',
      badgeText: 'text-blue-700',
    };
  }
  if (cleanUrl.includes('teams.microsoft.com') || cleanUrl.includes('teams.live.com')) {
    return {
      platform: 'teams',
      label: 'Microsoft Teams',
      color: '#5B5FC7',
      badgeBg: 'bg-indigo-50 border-indigo-200',
      badgeText: 'text-indigo-700',
    };
  }
  if (cleanUrl.includes('webex.com')) {
    return {
      platform: 'webex',
      label: 'Cisco Webex',
      color: '#00BA96',
      badgeBg: 'bg-teal-50 border-teal-200',
      badgeText: 'text-teal-700',
    };
  }

  return {
    platform: 'other',
    label: cleanUrl.length > 5 ? 'Custom Meeting' : 'Meeting Link',
    color: '#64748B',
    badgeBg: 'bg-slate-100 border-slate-200',
    badgeText: 'text-slate-700',
  };
}

export const DEMO_MEETING_LINKS = [
  {
    platform: 'google_meet' as MeetingPlatform,
    name: 'Google Meet',
    url: 'https://meet.google.com/abc-defg-hij',
    title: 'Sprint 25 Architecture & Blockers Review',
  },
  {
    platform: 'zoom' as MeetingPlatform,
    name: 'Zoom Video',
    url: 'https://zoom.us/j/94827103948',
    title: 'Client Steering & Executive Milestone Review',
  },
  {
    platform: 'teams' as MeetingPlatform,
    name: 'Microsoft Teams',
    url: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_xyz',
    title: 'Cross-Functional Product & Design Sync',
  },
];

export const SIMULATED_TRANSCRIPT_DIALOGS: Record<MeetingPlatform, TranscriptChunk[]> = {
  google_meet: [
    {
      timestamp: '00:00:03',
      speaker: 'Alex (Engineering Lead)',
      role: 'Tech Lead',
      avatarColor: '#3b82f6',
      text: 'Good morning everyone, Hexavia Notetaker has joined our Google Meet call. Let us start with the Sprint 25 architecture review and database migrations.',
    },
    {
      timestamp: '00:00:16',
      speaker: 'Sarah (Frontend Lead)',
      role: 'Frontend',
      avatarColor: '#ec4899',
      text: 'Morning Alex! On the frontend, we completed the new PM bot dispatch modal and live transcription monitor. Everything is ready for staging testing today.',
    },
    {
      timestamp: '00:00:32',
      speaker: 'David (Backend Engineer)',
      role: 'Backend',
      avatarColor: '#10b981',
      text: 'The webhook listener endpoints are live. Supabase RLS is verified, ensuring each PM can only inspect their own bot transcripts and summaries.',
    },
    {
      timestamp: '00:00:48',
      speaker: 'Elena (Product Manager)',
      role: 'Product Manager',
      avatarColor: '#8b5cf6',
      text: 'Excellent. Our stakeholder demo is Thursday at 3 PM. We need all core flows green by Wednesday evening.',
    },
    {
      timestamp: '00:01:05',
      speaker: 'Alex (Engineering Lead)',
      role: 'Tech Lead',
      avatarColor: '#3b82f6',
      text: 'Understood. Action item: David merges the PR by Wednesday noon, and Sarah verifies cross-browser responsive layouts. Let us adjourn.',
    },
  ],
  zoom: [
    {
      timestamp: '00:00:04',
      speaker: 'Rachel (Project Director)',
      role: 'Director',
      avatarColor: '#f59e0b',
      text: 'Welcome everyone to the monthly steering committee. The Hexavia bot is capturing audio for our executive status minutes.',
    },
    {
      timestamp: '00:00:20',
      speaker: 'John (Client Sponsor)',
      role: 'Client Sponsor',
      avatarColor: '#3b82f6',
      text: 'Thanks Rachel. We reviewed the preliminary reports and are thrilled with the 30% reduction in reporting overhead. What is the status of the mobile rollout?',
    },
    {
      timestamp: '00:00:38',
      speaker: 'Rachel (Project Director)',
      role: 'Director',
      avatarColor: '#f59e0b',
      text: 'Mobile testing completed with 99.8% pass rate. Our primary dependency is the SAML SSO metadata XML from your IT department.',
    },
    {
      timestamp: '00:00:54',
      speaker: 'John (Client Sponsor)',
      role: 'Client Sponsor',
      avatarColor: '#3b82f6',
      text: 'I will personally ping our IT director right after this call and have the metadata sent before 2 PM today.',
    },
    {
      timestamp: '00:01:10',
      speaker: 'Rachel (Project Director)',
      role: 'Director',
      avatarColor: '#f59e0b',
      text: 'Fantastic! That keeps our target production launch firmly locked for the 28th. Thank you all.',
    },
  ],
  teams: [
    {
      timestamp: '00:00:05',
      speaker: 'Marcus (Tech Lead)',
      role: 'Lead Architect',
      avatarColor: '#6366f1',
      text: 'Hi team, jumping into our cloud security sync. Notetaker bot is in the session. Priya, how are we looking on SOC2 compliance?',
    },
    {
      timestamp: '00:00:22',
      speaker: 'Priya (DevOps Lead)',
      role: 'DevOps',
      avatarColor: '#06b6d4',
      text: 'We configured AES-256 encryption at rest across all transcript storage buckets and enabled full audit trails for report exports.',
    },
    {
      timestamp: '00:00:41',
      speaker: 'James (Security Director)',
      role: 'Security',
      avatarColor: '#ef4444',
      text: 'Great work Priya. Ensure the audit logs are retained for 180 days in our cold storage bucket.',
    },
    {
      timestamp: '00:00:57',
      speaker: 'Marcus (Tech Lead)',
      role: 'Lead Architect',
      avatarColor: '#6366f1',
      text: 'Logged as a decision. Priya will finalize the retention policy by Friday. Meeting adjourned!',
    },
  ],
  webex: [
    {
      timestamp: '00:00:04',
      speaker: 'Sophia (Operations Manager)',
      role: 'Operations',
      avatarColor: '#10b981',
      text: 'Good afternoon. Starting the weekly vendor SLA check-in. The Hexavia AI notetaker is present.',
    },
    {
      timestamp: '00:00:19',
      speaker: 'Liam (Vendor Account Exec)',
      role: 'Vendor Lead',
      avatarColor: '#f97316',
      text: 'We maintained 99.99% uptime across all cloud communication clusters this past week with zero degradation.',
    },
    {
      timestamp: '00:00:35',
      speaker: 'Sophia (Operations Manager)',
      role: 'Operations',
      avatarColor: '#10b981',
      text: 'Confirmed on our monitoring telemetry. Let us renew the SLA agreement for the upcoming fiscal quarter.',
    },
  ],
  other: [
    {
      timestamp: '00:00:03',
      speaker: 'Meeting Host',
      role: 'Host',
      avatarColor: '#64748B',
      text: 'Meeting started. AI Notetaker is recording the conversation audio.',
    },
    {
      timestamp: '00:00:15',
      speaker: 'Team Member',
      role: 'Participant',
      avatarColor: '#3b82f6',
      text: 'Reviewed the deliverables for this week and all milestones are on schedule.',
    },
  ],
};
