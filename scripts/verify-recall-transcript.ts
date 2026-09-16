/**
 * Fixture check for Recall.ai transcript parsing.
 * Run: npx --yes tsx scripts/verify-recall-transcript.ts
 */
import { buildTranscriptFromRecallPayload } from '../src/lib/bot/recallService';
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

console.log('Recall transcript parser fixture passed.');
console.log(parsed.fullTranscript);
