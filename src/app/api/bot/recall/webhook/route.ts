import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRecallBot, waitForRecallBotTranscript, recallBotFileName } from '@/lib/bot/recallService';
import { generateMeetingSummary } from '@/lib/ai/aiService';
import { isValidUUID } from '@/lib/utils/uuid';

function getSupabaseBackendClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder')) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

function extractBotId(eventData: any): string | undefined {
  return (
    eventData?.data?.bot?.id ||
    eventData?.data?.bot_id ||
    eventData?.bot?.id ||
    eventData?.data?.id ||
    eventData?.bot_id
  );
}

function extractStatusCode(eventData: any): string {
  return String(
    eventData?.data?.data?.code ||
    eventData?.data?.status?.code ||
    eventData?.data?.code ||
    ''
  ).toLowerCase();
}

function shouldSummarizeEvent(eventType: string, statusCode: string): boolean {
  const type = (eventType || '').toLowerCase();
  if (
    type === 'transcript.done' ||
    type === 'bot.done' ||
    type === 'bot.transcription_completed'
  ) {
    return true;
  }
  if (type === 'bot.status_change' && (statusCode === 'done' || statusCode === 'bot.done')) {
    return true;
  }
  // call_ended is too early — media/transcript are not ready yet
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let eventData: any = {};

    try {
      eventData = JSON.parse(rawBody);
    } catch {
      eventData = { raw: rawBody };
    }

    const eventType = eventData.event || eventData.type || 'unknown';
    const botId = extractBotId(eventData);
    const statusCode = extractStatusCode(eventData);

    console.log(`[Recall.ai Webhook] Received event: ${eventType} for bot: ${botId} (code: ${statusCode || 'n/a'})`);

    if (shouldSummarizeEvent(eventType, statusCode) && botId) {
      console.log(`[Recall.ai Webhook] Meeting artifacts ready for bot: ${botId}. Triggering AI summarization pipeline...`);

      // Run background processing asynchronously so webhook responds within 5s SLA
      (async () => {
        try {
          const supabase = getSupabaseBackendClient();
          const botData = await getRecallBot(botId);
          const metadata = botData.metadata || {};
          const userId = metadata.userId;
          const preSelectedProjectId = isValidUUID(metadata.projectId) ? metadata.projectId : null;
          const sessionTitle = metadata.title || 'Recorded Meeting Summary';
          const fileName = recallBotFileName(botId);

          if (supabase && userId) {
            const { data: existingByFile } = await supabase
              .from('meeting_summaries')
              .select('id')
              .eq('user_id', userId)
              .eq('file_name', fileName)
              .maybeSingle();

            if (existingByFile) {
              console.log(`[Recall.ai Webhook] Meeting ${botId} already processed.`);
              return;
            }
          }

          const transcriptData = await waitForRecallBotTranscript(botId, {
            attempts: 5,
            delayMs: 3000,
          });
          if (!transcriptData.fullTranscript || transcriptData.fullTranscript.trim().length < 20) {
            console.log(`[Recall.ai Webhook] No transcript content captured for bot ${botId} after retries`);
            return;
          }

          if (supabase && userId) {
            const { data: existingByTranscript } = await supabase
              .from('meeting_summaries')
              .select('id')
              .eq('user_id', userId)
              .eq('raw_transcript', transcriptData.fullTranscript)
              .maybeSingle();

            if (existingByTranscript) {
              console.log(`[Recall.ai Webhook] Identical transcript already saved for bot ${botId}. Skipping duplicate.`);
              return;
            }
          }

          console.log(`[Recall.ai Webhook] Generating AI summary for ${transcriptData.chunks.length} dialog turns...`);
          const summary = await generateMeetingSummary(
            transcriptData.fullTranscript,
            metadata.projectName || undefined
          );

          if (supabase && userId) {
            const { error: insertErr } = await supabase.from('meeting_summaries').insert({
              user_id: userId,
              project_id: preSelectedProjectId,
              title: sessionTitle || summary.title || 'Meeting Summary',
              meeting_date: new Date().toISOString().split('T')[0],
              file_name: fileName,
              raw_transcript: transcriptData.fullTranscript,
              summary_markdown: summary.summary_markdown,
              executive_summary: summary.executive_summary,
              who_said_what: summary.who_said_what,
              action_items: summary.action_items,
              key_decisions: summary.key_decisions,
              key_blockers: summary.key_blockers,
              participants: summary.participants?.length > 0 ? summary.participants : transcriptData.participants,
            });

            if (insertErr) {
              console.error('[Recall.ai Webhook] Failed to insert summary to Supabase:', insertErr);
            } else {
              console.log(`[Recall.ai Webhook] Successfully saved AI summary to Supabase for user ${userId}${preSelectedProjectId ? ` on project ${preSelectedProjectId}` : ''}.`);
            }
          }
        } catch (bgErr) {
          console.error('[Recall.ai Webhook Background Error]:', bgErr);
        }
      })();
    }

    return NextResponse.json({
      received: true,
      event: eventType,
      botId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Recall.ai Webhook Error]:', err);
    return NextResponse.json(
      { error: 'Webhook processing error', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Recall.ai webhook receiver is active and ready.',
    endpoint: '/api/bot/recall/webhook',
    subscribe: ['bot.done', 'transcript.done'],
  });
}
