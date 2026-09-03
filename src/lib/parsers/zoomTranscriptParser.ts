export interface TranscriptUtterance {
  timestamp?: string;
  speaker: string;
  text: string;
}

export interface ParsedTranscript {
  participants: string[];
  utterances: TranscriptUtterance[];
  rawText: string;
  totalWords: number;
  speakerWordCounts: Record<string, number>;
  cleanedDialogue: string;
}

/**
 * Parses various Zoom / Teams / Google Meet TXT transcript formats
 */
export function parseZoomTranscript(rawText: string): ParsedTranscript {
  const lines = rawText.split(/\r?\n/);
  const utterances: TranscriptUtterance[] = [];
  const participantsSet = new Set<string>();
  const speakerWordCounts: Record<string, number> = {};

  // Common non-speaker header keywords to prevent false participant attribution
  const NON_SPEAKER_PREFIXES = [
    'summary', 'agenda', 'note', 'notes', 'decision', 'decisions', 
    'action item', 'action items', 'actions', 'next step', 'next steps', 
    'status', 'update', 'updates', 'q&a', 'questions', 'review', 
    'blocker', 'blockers', 'risks', 'risk', 'topic', 'discussion', 
    'time', 'date', 'meeting', 'attendees', 'participants', 'http', 
    'https', 'warning', 'error', 'info', 'context', 'overview', 'milestone'
  ];

  const isLikelySpeaker = (name: string): boolean => {
    const cleaned = name.trim().toLowerCase();
    if (cleaned.length < 2 || cleaned.length > 40) return false;
    if (cleaned.includes('://') || cleaned.includes('.com') || cleaned.includes('www.')) return false;
    for (const prefix of NON_SPEAKER_PREFIXES) {
      if (cleaned === prefix || cleaned.startsWith(prefix + ' ') || cleaned.startsWith(prefix + ':')) {
        return false;
      }
    }
    return true;
  };

  // Pattern 1: "[00:01:23] John Doe: Hello" or "00:01:23 John Doe: Hello" or "01:23 John: Hello"
  const pattern1 = /^\[?(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{3})?)\]?\s+([^:]+?):\s*(.*)$/;

  // Pattern 2: "John Doe (00:01:23): Hello" or "John Doe [01:23]: Hello"
  const pattern2 = /^([^({\[]+?)\s*[\(\[](?:\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{3})?)[\)\]]:?\s*(.*)$/;

  // Pattern 3: Zoom In-Meeting Chat: "09:30:15 From John Doe to Everyone: Hello"
  const patternChat = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+From\s+([^:]+?)\s+(?:to\s+[^:]+?):\s*(.*)$/i;

  // Pattern 4: "John Doe: Hello team" (simple speaker colon)
  const patternColon = /^([A-Z][a-zA-Z0-9\s._'-]{1,40}):\s*(.+)$/;

  // VTT timestamp format (e.g. 00:00:00.000 --> 00:00:05.000)
  const vttTimePattern = /^\d{1,2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}\.\d{3}$/;

  let currentSpeaker = 'Unknown Speaker';
  let currentTimestamp: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Ignore WebVTT header lines
    if (
      line === 'WEBVTT' ||
      line.startsWith('NOTE') ||
      line.startsWith('Kind:') ||
      line.startsWith('Language:')
    ) {
      continue;
    }

    // Ignore VTT numeric sequencing headers (e.g., "1", "2")
    if (/^\d+$/.test(line) && i + 1 < lines.length && vttTimePattern.test(lines[i + 1].trim())) {
      continue;
    }

    // Check VTT timestamp line
    if (vttTimePattern.test(line)) {
      currentTimestamp = line.split('-->')[0].trim();
      continue;
    }

    let matched = false;

    // Test Zoom Chat: "09:30:15 From John Doe to Everyone: Hello"
    const mChat = line.match(patternChat);
    if (mChat) {
      const timestamp = mChat[1];
      const speaker = mChat[2].trim();
      const text = mChat[3].trim();
      if (isLikelySpeaker(speaker) && text.length > 0) {
        utterances.push({ timestamp, speaker, text });
        participantsSet.add(speaker);
        currentSpeaker = speaker;
        currentTimestamp = timestamp;
        matched = true;
      }
    }

    // Test Pattern 1: "[00:15:30] Alice Smith: Let's start" or "00:15:30 Alice Smith: Let's start"
    if (!matched) {
      const m1 = line.match(pattern1);
      if (m1) {
        const timestamp = m1[1];
        const speaker = m1[2].trim();
        const text = m1[3].trim();
        if (isLikelySpeaker(speaker) && text.length > 0) {
          utterances.push({ timestamp, speaker, text });
          participantsSet.add(speaker);
          currentSpeaker = speaker;
          currentTimestamp = timestamp;
          matched = true;
        }
      }
    }

    // Test Pattern 2: "Alice Smith (00:15:30): Let's start" or "Alice Smith [00:15:30]: Let's start"
    if (!matched) {
      const m2 = line.match(pattern2);
      if (m2) {
        const speaker = m2[1].trim();
        const text = m2[2].trim();
        if (isLikelySpeaker(speaker) && text.length > 0) {
          utterances.push({ timestamp: currentTimestamp, speaker, text });
          participantsSet.add(speaker);
          currentSpeaker = speaker;
          matched = true;
        }
      }
    }

    // Test Pattern Colon: "Alice Smith: Let's start"
    if (!matched) {
      const mColon = line.match(patternColon);
      if (mColon) {
        const speaker = mColon[1].trim();
        const text = mColon[2].trim();
        if (isLikelySpeaker(speaker) && text.length > 0) {
          utterances.push({ timestamp: currentTimestamp, speaker, text });
          participantsSet.add(speaker);
          currentSpeaker = speaker;
          matched = true;
        }
      }
    }

    // Continuation line of previous speaker
    if (!matched) {
      if (utterances.length > 0) {
        utterances[utterances.length - 1].text += ' ' + line;
      } else {
        utterances.push({
          timestamp: currentTimestamp,
          speaker: currentSpeaker,
          text: line,
        });
        if (currentSpeaker !== 'Unknown Speaker') {
          participantsSet.add(currentSpeaker);
        }
      }
    }
  }

  // Calculate word counts per speaker
  let totalWords = 0;
  utterances.forEach((u) => {
    const words = u.text.trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    speakerWordCounts[u.speaker] = (speakerWordCounts[u.speaker] || 0) + words;
  });

  const participants = Array.from(participantsSet).filter((p) => p !== 'Unknown Speaker');
  if (participants.length === 0 && participantsSet.has('Unknown Speaker')) {
    participants.push('Unknown Speaker');
  }

  // Format clean dialogue for AI prompt
  const cleanedDialogue = utterances
    .map((u) => `[${u.timestamp || '--:--'}] ${u.speaker}: ${u.text}`)
    .join('\n');

  return {
    participants,
    utterances,
    rawText,
    totalWords,
    speakerWordCounts,
    cleanedDialogue: cleanedDialogue.length > 0 ? cleanedDialogue : rawText,
  };
}
