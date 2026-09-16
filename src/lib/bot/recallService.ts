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

export function recallBotFileName(botId: string): string {
  return `recall-bot-${botId.slice(0, 12)}.txt`;
}

function normalizeRecallLanguageCode(language?: string): string {
  if (!language || !language.trim()) return 'auto';
  const trimmed = language.trim();
  if (trimmed.toLowerCase() === 'auto') return 'auto';
  // Recall streaming accepts BCP-47 simple codes (en, es) or auto
  const simple = trimmed.split(/[-_]/)[0]?.toLowerCase();
  return simple && simple.length >= 2 ? simple : 'auto';
}

function extractRelativeSeconds(timestamp: unknown): number {
  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    const asNumber = Number(timestamp);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsedDate = Date.parse(timestamp);
    if (!Number.isNaN(parsedDate)) return parsedDate / 1000;
  }
  if (timestamp && typeof timestamp === 'object') {
    const obj = timestamp as { relative?: unknown; absolute?: unknown; seconds?: unknown };
    if (typeof obj.relative === 'number' && Number.isFinite(obj.relative)) {
      return obj.relative;
    }
    if (typeof obj.seconds === 'number' && Number.isFinite(obj.seconds)) {
      return obj.seconds;
    }
    if (typeof obj.relative === 'string' && Number.isFinite(Number(obj.relative))) {
      return Number(obj.relative);
    }
  }
  return 0;
}

function unwrapTranscriptSegments(payload: unknown): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    // A single Recall utterance already has participant + words; do not flatten `.words`.
    if (obj.participant || obj.speaker || (typeof obj.text === 'string' && obj.text.trim())) {
      return [obj];
    }

    const nestedKeys = ['transcript', 'segments', 'utterances', 'results', 'data'];
    for (const key of nestedKeys) {
      const value = obj[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const deeper = unwrapTranscriptSegments(value);
        if (deeper.length > 0) return deeper;
      }
    }
  }
  return [];
}

function scoreTranscriptSegments(segments: any[]): number {
  if (!Array.isArray(segments) || segments.length === 0) return 0;
  return segments.reduce((total, seg) => {
    if (typeof seg?.text === 'string') return total + seg.text.length;
    if (Array.isArray(seg?.words)) {
      return total + seg.words.reduce((inner: number, w: any) => inner + String(w?.text || '').length, 0);
    }
    if (typeof seg?.transcript === 'string') return total + seg.transcript.length;
    return total;
  }, 0);
}

async function downloadTranscriptSegments(downloadUrl: string): Promise<any[]> {
  const dlRes = await fetch(downloadUrl, { cache: 'no-store' });
  if (!dlRes.ok) return [];
  const dlData = await dlRes.json();
  return unwrapTranscriptSegments(dlData);
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

  const languageCode = normalizeRecallLanguageCode(params.language);

  // Format payload according to Recall.ai OpenAPI specs.
  // transcript.provider MUST be set — Recall defaults this to null (no transcript).
  const payload: any = {
    meeting_url: params.meetingUrl,
    bot_name: botName,
    recording_config: {
      transcript: {
        provider: {
          recallai_streaming: {
            mode: 'prioritize_accuracy',
            language_code: languageCode,
          },
        },
        diarization: {
          use_separate_streams_when_available: true,
        },
      },
    },
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

function isLikelyBotSpeaker(name: string, botName?: string): boolean {
  const cleaned = name.trim().toLowerCase();
  if (!cleaned) return false;
  if (botName && cleaned === botName.trim().toLowerCase()) return true;
  return cleaned.includes('hexavia notetaker') || cleaned.includes('notetaker bot');
}

function parseRecallTranscriptChunks(
  segments: any[],
  botName?: string
): { chunks: TranscriptChunk[]; participants: string[] } {
  const chunks: TranscriptChunk[] = [];
  const participantsSet = new Set<string>();

  for (const seg of segments) {
    const rawSpeaker =
      seg.participant?.name ||
      seg.participant?.user_name ||
      seg.speaker?.name ||
      seg.speaker ||
      seg.name ||
      '';
    const speaker = String(rawSpeaker || '').trim() || 'Participant';

    let text = '';
    let startSec = 0;
    if (Array.isArray(seg.words) && seg.words.length > 0) {
      text = seg.words.map((w: any) => String(w?.text || '').trim()).filter(Boolean).join(' ').trim();
      startSec = extractRelativeSeconds(seg.words[0]?.start_timestamp);
    } else if (typeof seg.text === 'string' && seg.text.trim()) {
      text = seg.text.trim();
      startSec = extractRelativeSeconds(seg.start_timestamp ?? seg.start);
    } else if (typeof seg.transcript === 'string' && seg.transcript.trim()) {
      text = seg.transcript.trim();
      startSec = extractRelativeSeconds(seg.start_timestamp ?? seg.start);
    }

    if (!text) continue;
    if (isLikelyBotSpeaker(speaker, botName)) continue;

    participantsSet.add(speaker);
    chunks.push({
      timestamp: formatSecondsToTimestamp(startSec),
      speaker,
      avatarColor: getSpeakerAvatarColor(speaker),
      text,
    });
  }

  return { chunks, participants: Array.from(participantsSet) };
}

export function buildTranscriptFromRecallPayload(payload: unknown, botName?: string): {
  chunks: TranscriptChunk[];
  fullTranscript: string;
  participants: string[];
  rawSegments: any[];
} {
  const segments = unwrapTranscriptSegments(payload);
  const { chunks, participants } = parseRecallTranscriptChunks(segments, botName);
  const fullTranscript = chunks
    .map((c) => `[${c.timestamp}] ${c.speaker}: ${c.text}`)
    .join('\n\n');
  return { chunks, fullTranscript, participants, rawSegments: segments };
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
  let bestScore = 0;
  let botName: string | undefined;

  const considerSegments = (candidate: any[]) => {
    const unwrapped = unwrapTranscriptSegments(candidate);
    const score = scoreTranscriptSegments(unwrapped);
    if (score > bestScore) {
      bestScore = score;
      segments = unwrapped;
    }
  };

  try {
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
        const downloadUrl = item?.data?.download_url;
        if (downloadUrl) {
          try {
            considerSegments(await downloadTranscriptSegments(downloadUrl));
          } catch (dlErr) {
            console.warn('Failed downloading transcript from download_url:', dlErr);
          }
        } else {
          considerSegments(unwrapTranscriptSegments(item));
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching transcript list for bot:', err);
  }

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
      botName = botData.bot_name || botData.name;
      const recordings = botData.recordings || [];
      for (const rec of recordings) {
        const dlUrl = rec.media_shortcuts?.transcript?.data?.download_url;
        if (dlUrl) {
          try {
            considerSegments(await downloadTranscriptSegments(dlUrl));
          } catch (dlErr) {
            console.warn('Failed downloading transcript from bot recording shortcut:', dlErr);
          }
        }
      }
    }
  } catch (botErr) {
    console.warn('Error checking bot recordings for transcript:', botErr);
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    return { chunks: [], fullTranscript: '', participants: [], rawSegments: [] };
  }

  const { chunks, participants } = parseRecallTranscriptChunks(segments, botName);
  const fullTranscript = chunks
    .map((c) => `[${c.timestamp}] ${c.speaker}: ${c.text}`)
    .join('\n\n');

  return {
    chunks,
    fullTranscript,
    participants,
    rawSegments: segments,
  };
}

const MIN_TRANSCRIPT_CHARS = 20;

export async function waitForRecallBotTranscript(
  botId: string,
  options?: {
    attempts?: number;
    delayMs?: number;
    apiKeyOverride?: string;
    regionOverride?: string;
  }
) {
  const attempts = options?.attempts ?? 5;
  const delayMs = options?.delayMs ?? 2500;
  let last = await getRecallBotTranscript(botId, options?.apiKeyOverride, options?.regionOverride);

  for (let i = 1; i < attempts; i++) {
    if (last.fullTranscript && last.fullTranscript.trim().length >= MIN_TRANSCRIPT_CHARS) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    last = await getRecallBotTranscript(botId, options?.apiKeyOverride, options?.regionOverride);
  }

  return last;
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
