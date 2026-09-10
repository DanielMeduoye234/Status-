import { BotStatus, MeetingPlatform, TranscriptChunk } from './mockBotService';

export interface RecallConfig {
  apiKey?: string;
  region?: string;
}

export const RECALL_REGIONS = [
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

export function getRecallRegion(overrideRegion?: string): string {
  return overrideRegion || process.env.RECALL_AI_REGION || 'us-west-2';
}

export function getRecallApiKey(overrideKey?: string): string | undefined {
  return overrideKey || process.env.RECALL_AI_API_KEY || process.env.RECALL_API_KEY;
}

export function getRecallBaseUrl(region?: string): string {
  const reg = getRecallRegion(region);
  return `https://${reg}.recall.ai/api/v1`;
}

export function isRecallConfigured(): boolean {
  const key = getRecallApiKey();
  return Boolean(key && key.trim().length > 0);
}

// Avatar color generator based on speaker name
const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

export function getSpeakerAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Format seconds into HH:MM:SS
export function formatSecondsToTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Maps Recall.ai status code to Hexavia BotStatus
 */
export function mapRecallStatusCodeToBotStatus(code?: string): BotStatus {
  if (!code) return 'connecting';

  switch (code.toLowerCase()) {
    case 'ready':
    case 'joining_call':
      return 'connecting';

    case 'in_waiting_room':
      return 'waiting_room';

    case 'in_call_recording':
      return 'transcribing';

    case 'in_call_not_recording':
      return 'in_meeting';

    case 'call_ended':
    case 'done':
      return 'completed';

    case 'fatal':
      return 'error';

    default:
      if (code.includes('waiting')) return 'waiting_room';
      if (code.includes('call') || code.includes('recording')) return 'in_meeting';
      if (code.includes('end') || code.includes('done')) return 'completed';
      if (code.includes('error') || code.includes('fatal')) return 'error';
      return 'connecting';
  }
}

export interface DispatchRecallBotParams {
  meetingUrl: string;
  botName?: string;
  joinMode?: 'now' | 'scheduled';
  scheduledTime?: string;
  postGreeting?: boolean;
  language?: string;
  transcriptionProvider?: string;
  metadata?: Record<string, string>;
  apiKey?: string;
  region?: string;
}

/**
 * Dispatches a real bot via the Recall.ai API
 */
export async function dispatchRecallBot(params: DispatchRecallBotParams) {
  const apiKey = getRecallApiKey(params.apiKey);
  if (!apiKey) {
    throw new Error('RECALL_AI_API_KEY is not configured in environment variables.');
  }

  const baseUrl = getRecallBaseUrl(params.region);
  const botName = params.botName || 'Hexavia Notetaker';

  // Format payload according to Recall.ai OpenAPI specs
  const payload: any = {
    meeting_url: params.meetingUrl,
    bot_name: botName,
  };

  // Scheduled join support
  if (params.joinMode === 'scheduled' && params.scheduledTime) {
    try {
      const scheduledDate = new Date(params.scheduledTime);
      if (!isNaN(scheduledDate.getTime())) {
        payload.join_at = scheduledDate.toISOString();
      }
    } catch (e) {
      console.warn('Failed to parse scheduled time for Recall.ai:', params.scheduledTime);
    }
  }

  // In-call greeting notice
  if (params.postGreeting !== false) {
    payload.chat = {
      on_bot_join: {
        send_to: 'everyone',
        message: `Hello! I am ${botName} recording for PM notes, action items, and executive summaries.`,
      },
    };
  }

  if (params.metadata) {
    payload.metadata = params.metadata;
  }

  const response = await fetch(`${baseUrl}/bot/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Recall.ai API error (${response.status})`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  const botData = await response.json();
  return botData;
}

/**
 * Retrieve bot state and latest status code from Recall.ai
 */
export async function getRecallBot(botId: string, apiKeyOverride?: string, regionOverride?: string) {
  const apiKey = getRecallApiKey(apiKeyOverride);
  if (!apiKey) throw new Error('RECALL_AI_API_KEY is not configured.');

  const baseUrl = getRecallBaseUrl(regionOverride);
  const response = await fetch(`${baseUrl}/bot/${botId}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorDetail = `Recall.ai API error (${response.status})`;
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

/**
 * Retrieve transcript segments from Recall.ai and parse into Hexavia format
 * Uses Recall.ai modern /transcript/?bot_id= endpoint & download_url
 */
export async function getRecallBotTranscript(
  botId: string,
  apiKeyOverride?: string,
  regionOverride?: string
): Promise<{
  chunks: TranscriptChunk[];
  fullTranscript: string;
  participants: string[];
  rawSegments: any[];
}> {
  const apiKey = getRecallApiKey(apiKeyOverride);
  if (!apiKey) throw new Error('RECALL_AI_API_KEY is not configured.');

  const baseUrl = getRecallBaseUrl(regionOverride);
  let segments: any[] = [];

  try {
    // 1. Query transcripts associated with this bot_id
    const response = await fetch(`${baseUrl}/transcript/?bot_id=${botId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);

      for (const item of results) {
        if (item.data?.download_url) {
          try {
            const dlRes = await fetch(item.data.download_url);
            if (dlRes.ok) {
              const dlData = await dlRes.json();
              if (Array.isArray(dlData)) {
                segments = dlData;
                break;
              }
            }
          } catch (dlErr) {
            console.warn('Failed downloading transcript from download_url:', dlErr);
          }
        } else if (Array.isArray(item.words) || Array.isArray(item.transcript)) {
          segments = item.words || item.transcript;
          break;
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching transcript list for bot:', err);
  }

  // 2. If segments not found yet, check bot media shortcuts
  if (segments.length === 0) {
    try {
      const botRes = await fetch(`${baseUrl}/bot/${botId}/`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'accept': 'application/json',
        },
        cache: 'no-store',
      });
      if (botRes.ok) {
        const botData = await botRes.json();
        const recordings = botData.recordings || [];
        for (const rec of recordings) {
          const dlUrl = rec.media_shortcuts?.transcript?.data?.download_url;
          if (dlUrl) {
            const dlRes = await fetch(dlUrl);
            if (dlRes.ok) {
              const dlData = await dlRes.json();
              if (Array.isArray(dlData)) {
                segments = dlData;
                break;
              }
            }
          }
        }
      }
    } catch (botErr) {
      console.warn('Error checking bot recordings for transcript:', botErr);
    }
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    return { chunks: [], fullTranscript: '', participants: [], rawSegments: [] };
  }

  const chunks: TranscriptChunk[] = [];
  const participantsSet = new Set<string>();

  for (const seg of segments) {
    const speaker = seg.speaker || seg.participant?.name || 'Participant';
    participantsSet.add(speaker);

    // Words array
    let text = '';
    let startSec = 0;
    if (Array.isArray(seg.words) && seg.words.length > 0) {
      text = seg.words.map((w: any) => w.text).join(' ').trim();
      startSec = seg.words[0].start_timestamp ?? 0;
    } else if (seg.text) {
      text = seg.text.trim();
      startSec = seg.start_timestamp ?? 0;
    }

    if (!text) continue;

    const timestamp = formatSecondsToTimestamp(startSec);
    chunks.push({
      timestamp,
      speaker,
      avatarColor: getSpeakerAvatarColor(speaker),
      text,
    });
  }

  const fullTranscript = chunks
    .map((c) => `[${c.timestamp}] ${c.speaker}: ${c.text}`)
    .join('\n\n');

  return {
    chunks,
    fullTranscript,
    participants: Array.from(participantsSet),
    rawSegments: segments,
  };
}

/**
 * Instruct bot to leave the meeting early
 */
export async function leaveRecallBot(botId: string, apiKeyOverride?: string, regionOverride?: string) {
  const apiKey = getRecallApiKey(apiKeyOverride);
  if (!apiKey) throw new Error('RECALL_AI_API_KEY is not configured.');

  const baseUrl = getRecallBaseUrl(regionOverride);
  const response = await fetch(`${baseUrl}/bot/${botId}/leave_call/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to leave call: ${errText}`);
  }

  return true;
}

/**
 * Test Recall.ai API Key connection
 */
export async function testRecallApiKey(apiKeyOverride?: string, regionOverride?: string) {
  const apiKey = getRecallApiKey(apiKeyOverride);
  if (!apiKey) {
    return {
      ok: false,
      error: 'No API key provided or found in environment variables.',
      configured: false,
    };
  }

  const baseUrl = getRecallBaseUrl(regionOverride);
  try {
    const response = await fetch(`${baseUrl}/bot/?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: 'Invalid API Key. Authentication failed on Recall.ai.',
        configured: true,
        region: getRecallRegion(regionOverride),
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      return {
        ok: false,
        error: `Recall.ai returned HTTP ${response.status}: ${errText.slice(0, 200)}`,
        configured: true,
        region: getRecallRegion(regionOverride),
      };
    }

    const data = await response.json();
    return {
      ok: true,
      configured: true,
      region: getRecallRegion(regionOverride),
      totalBots: data.count ?? (Array.isArray(data.results) ? data.results.length : 0),
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Network error connecting to Recall.ai',
      configured: true,
      region: getRecallRegion(regionOverride),
    };
  }
}
