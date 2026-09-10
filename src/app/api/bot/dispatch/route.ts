import { NextRequest, NextResponse } from 'next/server';
import { 
  dispatchRecallBot, 
  isRecallConfigured, 
  mapRecallStatusCodeToBotStatus 
} from '@/lib/bot/recallService';
import { BotSession, detectMeetingPlatform } from '@/lib/bot/mockBotService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      meetingUrl, 
      title, 
      projectId, 
      projectName,
      botName = 'Hexavia Notetaker', 
      joinMode = 'now', 
      scheduledTime, 
      postGreeting = true, 
      language = 'en-US',
      forceSimulation = false 
    } = body;

    if (!meetingUrl || typeof meetingUrl !== 'string' || !meetingUrl.trim()) {
      return NextResponse.json(
        { error: 'A valid meeting URL (Google Meet, Zoom, MS Teams, or Webex) is required.' },
        { status: 400 }
      );
    }

    const platformInfo = detectMeetingPlatform(meetingUrl);
    const sessionTitle = title?.trim() || `${platformInfo.label} Sync Session`;
    const sessionId = `bot-${Date.now()}`;
    const recallConfigured = isRecallConfigured();

    // 1. If Recall.ai is configured and not forced to simulation, dispatch live bot
    if (recallConfigured && !forceSimulation) {
      try {
        const recallBot = await dispatchRecallBot({
          meetingUrl: meetingUrl.trim(),
          botName: botName.trim(),
          joinMode,
          scheduledTime,
          postGreeting,
          language,
          metadata: {
            app: 'Hexavia Status',
            sessionId,
            projectId: projectId || '',
          },
        });

        const initialStatusCode = recallBot.status_changes?.[recallBot.status_changes.length - 1]?.code || 'ready';
        const mappedStatus = mapRecallStatusCodeToBotStatus(initialStatusCode);

        const newSession: BotSession = {
          id: sessionId,
          meetingUrl: meetingUrl.trim(),
          platform: platformInfo.platform,
          title: sessionTitle,
          projectId: projectId || undefined,
          projectName: projectName || undefined,
          botName: botName.trim(),
          status: mappedStatus,
          durationSeconds: 0,
          participants: [],
          transcriptChunks: [],
          fullTranscript: '',
          postGreeting,
          scheduledTime,
          startedAt: new Date().toISOString(),
          isRealBot: true,
          recallBotId: recallBot.id,
          recallStatus: initialStatusCode,
        };

        return NextResponse.json({
          success: true,
          isRealBot: true,
          session: newSession,
          recallBotId: recallBot.id,
          message: 'Recall.ai Notetaker successfully dispatched to meeting.',
        });
      } catch (recallErr: any) {
        console.error('Recall.ai dispatch error:', recallErr);
        return NextResponse.json(
          { 
            error: `Failed to dispatch Recall.ai bot: ${recallErr.message}`,
            details: recallErr.message
          },
          { status: 502 }
        );
      }
    }

    // 2. Simulation Mode (when RECALL_AI_API_KEY is not yet supplied or forceSimulation is true)
    const simulatedSession: BotSession = {
      id: sessionId,
      meetingUrl: meetingUrl.trim(),
      platform: platformInfo.platform,
      title: sessionTitle,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      botName: botName.trim(),
      status: 'connecting',
      durationSeconds: 0,
      participants: [],
      transcriptChunks: [],
      fullTranscript: '',
      postGreeting,
      scheduledTime,
      startedAt: new Date().toISOString(),
      isRealBot: false,
      errorDetail: !recallConfigured 
        ? 'RECALL_AI_API_KEY is not configured in server environment variables. Running in simulated demo mode.'
        : undefined,
    };

    return NextResponse.json({
      success: true,
      isRealBot: false,
      session: simulatedSession,
      warning: !recallConfigured 
        ? 'RECALL_AI_API_KEY is not configured on this server (e.g. Vercel Environment Variables). Started in demo simulation mode.' 
        : 'Running in interactive simulation mode.',
    });
  } catch (err: any) {
    console.error('Bot dispatch route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch bot' },
      { status: 500 }
    );
  }
}
