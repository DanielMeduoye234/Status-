/**
 * Fixture check for Recall.ai transcript parsing.
 * Run: npx --yes tsx scripts/verify-recall-transcript.ts
 */
import { buildTranscriptFromRecallPayload, isHardwareDeviceName, cleanParticipantName } from '../src/lib/bot/recallService';
import { parseZoomTranscript } from '../src/lib/parsers/zoomTranscriptParser';

const recallDownload = [
  {
    participant: {
      id: 100,
      name: 'Ada Okafor',
      is_host: true,
    },
    words: [
      {
        text: 'We will ship the payment retry fix by Friday.',
        start_timestamp: { relative: 9.73, absolute: '2025-07-17T00:00:09.730066Z' },
        end_timestamp: { relative: 12.75, absolute: '2025-07-17T00:00:12.751031Z' },
      },
    ],
  },
  {
    participant: {
      id: 200,
      name: 'Ken Banks',
    },
    words: [
      {
        text: 'I will update the risk register after standup.',
        start_timestamp: { relative: 75, absolute: '2025-07-17T00:01:15.000Z' },
      },
    ],
  },
  {
    participant: { id: 300, name: 'Hexavia Notetaker' },
    words: [{ text: 'Hello I am recording.', start_timestamp: { relative: 1 } }],
  },
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const parsed = buildTranscriptFromRecallPayload(recallDownload, 'Hexavia Notetaker');
assert(parsed.chunks.length === 2, `Expected 2 speaker chunks, got ${parsed.chunks.length}`);
assert(parsed.participants.includes('Ada Okafor'), 'Missing Ada Okafor');
assert(parsed.participants.includes('Ken Banks'), 'Missing Ken Banks');
assert(!parsed.participants.includes('Hexavia Notetaker'), 'Bot speaker should be skipped');
assert(parsed.fullTranscript.includes('[00:09] Ada Okafor: We will ship the payment retry fix by Friday.'), parsed.fullTranscript);
assert(parsed.fullTranscript.includes('[01:15] Ken Banks: I will update the risk register after standup.'), parsed.fullTranscript);
assert(!parsed.fullTranscript.includes('NaN'), 'Timestamps should not be NaN');

const nested = buildTranscriptFromRecallPayload({ transcript: recallDownload });
assert(nested.chunks.length === 2, 'Nested transcript wrapper should unwrap');

const inlineSegment = buildTranscriptFromRecallPayload({
  participant: { id: 1, name: 'Maya Chen' },
  words: [{ text: 'Blocker is the vendor SLA.', start_timestamp: { relative: 12 } }],
});
assert(inlineSegment.chunks.length === 1, 'Single segment object should stay intact');
assert(inlineSegment.fullTranscript.includes('Maya Chen'), 'Inline segment lost speaker name');
assert(inlineSegment.fullTranscript.includes('vendor SLA'), 'Inline segment lost spoken text');

const zoomParsed = parseZoomTranscript(parsed.fullTranscript);
assert(zoomParsed.participants.includes('Ada Okafor'), 'Zoom parser should keep Ada');
assert(zoomParsed.cleanedDialogue.includes('payment retry fix'), 'Cleaned dialogue lost meeting content');

// Test Case: Interleaved fragmented word streaming from screenshot
// Tolani speaking continuous sentence with Israel micro-interjection / mic bleed
const fragmentedStream = [
  {
    participant: { name: 'Tolani' },
    words: [
      { text: 'I', start_timestamp: 87.04, end_timestamp: 87.2 },
      { text: 'own', start_timestamp: 87.2, end_timestamp: 87.4 },
    ],
  },
  {
    participant: { name: 'Israel (PM @ Hexavia)' },
    words: [
      { text: 'sir.', start_timestamp: 87.4, end_timestamp: 87.5 },
    ],
  },
  {
    participant: { name: 'Tolani' },
    words: [
      { text: 'this', start_timestamp: 87.6, end_timestamp: 87.7 },
      { text: 'thing', start_timestamp: 87.7, end_timestamp: 87.8 },
      { text: 'is', start_timestamp: 87.8, end_timestamp: 87.9 },
    ],
  },
  {
    participant: { name: 'Israel (PM @ Hexavia)' },
    words: [
      { text: 'Enjoy', start_timestamp: 88.0, end_timestamp: 88.1 },
    ],
  },
  {
    participant: { name: 'Tolani' },
    words: [
      { text: 'just.', start_timestamp: 88.2, end_timestamp: 88.4 },
    ],
  },
];

const fragmentedParsed = buildTranscriptFromRecallPayload(fragmentedStream);
console.log('Coalesced Result:\n', fragmentedParsed.fullTranscript);

// Verify Tolani's sentence was coalesced together rather than broken into 3 fragments
const tolaniChunk = fragmentedParsed.chunks.find((c) => c.speaker === 'Tolani');
assert(Boolean(tolaniChunk), 'Tolani chunk should exist');
assert(tolaniChunk!.text === 'I own this thing is just.', `Expected coalesced text, got: "${tolaniChunk!.text}"`);

// Verify Israel's interjection is preserved without breaking Tolani's turn
const israelChunk = fragmentedParsed.chunks.find((c) => c.speaker.includes('Israel'));
assert(Boolean(israelChunk), 'Israel chunk should exist');
// Verify device name detection
assert(isHardwareDeviceName('Samsung SM-A075F') === true, 'Samsung SM-A075F should be recognized as hardware');
assert(isHardwareDeviceName('iPhone') === true, 'iPhone should be recognized as hardware');
assert(isHardwareDeviceName('Redmi Note 11') === true, 'Redmi Note 11 should be recognized as hardware');
assert(isHardwareDeviceName('Tolani') === false, 'Tolani is not hardware');
assert(cleanParticipantName('iPhone of Sarah') === 'Sarah', 'iPhone of Sarah should clean to Sarah');

// Verify Zoom Parser Coalescing
const zoomFragmentedRaw = `[01:27:04] Tolani: I own
[01:27:04] Israel: sir.
[01:27:05] Tolani: this thing is
[01:27:05] Israel: Enjoy
[01:27:05] Tolani: just.`;

const zoomCoalesced = parseZoomTranscript(zoomFragmentedRaw);
assert(zoomCoalesced.utterances.length === 2, `Expected 2 coalesced utterances from Zoom parser, got ${zoomCoalesced.utterances.length}`);
assert(zoomCoalesced.utterances[0].text === 'I own this thing is just.', `Zoom coalesced text mismatch: ${zoomCoalesced.utterances[0].text}`);
assert(zoomCoalesced.utterances[1].text === 'sir. Enjoy', `Zoom interjection mismatch: ${zoomCoalesced.utterances[1].text}`);

console.log('Recall transcript parser fixture & turn coalescing passed successfully.');

