import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRecallBot, getRecallBotTranscript } from '@/lib/bot/recallService';
import { generateMeetingSummary } from '@/lib/ai/aiService';

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
    const botId = eventData.data?.bot_id || eventData.data?.id;

    console.log(`[Recall.ai Webhook] Received event: ${eventType} for bot: ${botId}`);

    const code = eventData.data?.status?.code?.toLowerCase();
    const isMeetingEnded = 
      eventType === 'bot.transcription_completed' ||
      (eventType === 'bot.status_change' && (code === 'done' || code === 'call_ended'));

    // If meeting ended for everyone, trigger autonomous background summarization
    if (isMeetingEnded && botId) {
      console.log(`[Recall.ai Webhook] Meeting concluded for bot: ${botId}. Triggering AI summarization pipeline...`);

      // Run background processing asynchronously so webhook responds within 5s SLA
      (async () => {
        try {
          const supabase = getSupabaseBackendClient();
          const botData = await getRecallBot(botId);
          const metadata = botData.metadata || {};
          const userId = metadata.userId;
          const preSelectedProjectId = metadata.projectId || null;
          const sessionTitle = metadata.title || 'Recorded Meeting Summary';

          // Check if transcript already processed
          const fileName = `recall-bot-${botId.slice(0, 12)}.txt`;

          if (supabase && userId) {
            const { data: existing } = await supabase
              .from('meeting_summaries')
              .select('id')
              .eq('file_name', fileName)
              .maybeSingle();

            if (existing) {
              console.log(`[Recall.ai Webhook] Meeting ${botId} already processed.`);
              return;
            }
          }

          // Fetch transcript
          const transcriptData = await getRecallBotTranscript(botId);
          if (!transcriptData.fullTranscript || transcriptData.fullTranscript.trim().length < 20) {
            console.log(`[Recall.ai Webhook] No transcript content captured for bot ${botId}`);
            return;
          }

          console.log(`[Recall.ai Webhook] Generating AI summary for ${transcriptData.chunks.length} dialog turns...`);
          const summary = await generateMeetingSummary(
            transcriptData.fullTranscript,
            metadata.projectName || undefined
          );

          if (supabase && userId) {
            const { error: insertErr } = await supabase.from('meeting_summaries').insert({
              user_id: userId,
              project_id: preSelectedProjectId || null,
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
              console.log(`[Recall.ai Webhook] Successfully saved AI summary to Supabase for user ${userId}. Ready for project assignment!`);
            }
          }
        } catch (bgErr) {
          console.error('[Recall.ai Webhook Background Error]:', bgErr);
        }
      })();
    }

    // Return 200 OK immediately as required by Recall.ai / Svix
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
  });
}
