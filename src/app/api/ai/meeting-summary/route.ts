import { NextRequest, NextResponse } from 'next/server';
import { generateMeetingSummary } from '@/lib/ai/aiService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawTranscript, projectName } = body;

    if (!rawTranscript || typeof rawTranscript !== 'string' || rawTranscript.trim().length === 0) {
      return NextResponse.json(
        { error: 'A valid meeting transcript is required.' },
        { status: 400 }
      );
    }

    const result = await generateMeetingSummary(rawTranscript, projectName);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating meeting summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meeting summary' },
      { status: 500 }
    );
  }
}
