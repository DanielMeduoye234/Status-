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
        console.error('Recall.ai dispatch error, falling back to simulated session:', recallErr);
        // Fallback with error notice
        const fallbackSession: BotSession = {
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
          errorDetail: recallErr.message,
        };

        return NextResponse.json({
          success: true,
          isRealBot: false,
          session: fallbackSession,
          warning: `Recall.ai dispatch failed (${recallErr.message}). Started in interactive simulation mode.`,
        });
      }
    }

    // 2. Simulation Mode (when RECALL_AI_API_KEY is not yet supplied)
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
    };

    return NextResponse.json({
      success: true,
      isRealBot: false,
      session: simulatedSession,
      message: 'Running in interactive simulation mode. Add RECALL_AI_API_KEY to dispatch a real meeting bot.',
    });
  } catch (err: any) {
    console.error('Bot dispatch route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch bot' },
      { status: 500 }
    );
  }
}
