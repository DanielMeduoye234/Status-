import { NextRequest, NextResponse } from 'next/server';
import { 
  getRecallBot, 
  getRecallBotTranscript, 
  mapRecallStatusCodeToBotStatus, 
  isRecallConfigured 
} from '@/lib/bot/recallService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    if (!isRecallConfigured()) {
      return NextResponse.json(
        { error: 'RECALL_AI_API_KEY is not configured.' },
        { status: 400 }
      );
    }

    // 1. Fetch current bot info from Recall.ai
    const botData = await getRecallBot(id);
    const statusChanges = botData.status_changes || [];
    const latestChange = statusChanges[statusChanges.length - 1];
    const latestCode = latestChange?.code || 'ready';
    const mappedStatus = mapRecallStatusCodeToBotStatus(latestCode);

    // 2. Fetch transcript if in meeting or completed
    let transcriptData = {
      chunks: [],
      fullTranscript: '',
      participants: [] as string[],
    };

    try {
      const transcriptResult = await getRecallBotTranscript(id);
      transcriptData = {
        chunks: transcriptResult.chunks as any,
        fullTranscript: transcriptResult.fullTranscript,
        participants: transcriptResult.participants,
      };
    } catch (tErr) {
      // Transcript might not be ready yet (e.g. in waiting room)
      console.log(`Transcript not available yet for bot ${id}`);
    }

    // Determine participants from botData or transcript
    const meetingParticipants: string[] = [];
    if (Array.isArray(botData.meeting_participants)) {
      botData.meeting_participants.forEach((p: any) => {
        const name = p.name || p.user_name || p.display_name;
        if (name && !meetingParticipants.includes(name)) {
          meetingParticipants.push(name);
        }
      });
    }
    // Combine with transcript participants
    transcriptData.participants.forEach((p) => {
      if (!meetingParticipants.includes(p)) {
        meetingParticipants.push(p);
      }
    });

    const activeSpeaker = transcriptData.chunks.length > 0 
      ? (transcriptData.chunks[transcriptData.chunks.length - 1] as any).speaker 
      : undefined;

    return NextResponse.json({
      id,
      status: mappedStatus,
      recallStatusCode: latestCode,
      statusMessage: latestChange?.message || null,
      participants: meetingParticipants,
      activeSpeaker,
      transcriptChunks: transcriptData.chunks,
      fullTranscript: transcriptData.fullTranscript,
      isRealBot: true,
      videoUrl: botData.video_url || null,
      meetingUrl: botData.meeting_url,
    });
  } catch (err: any) {
    console.error('Error fetching Recall bot status:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch Recall bot status' },
      { status: 500 }
    );
  }
}
