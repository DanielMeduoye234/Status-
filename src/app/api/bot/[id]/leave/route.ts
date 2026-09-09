import { NextRequest, NextResponse } from 'next/server';
import { leaveRecallBot, isRecallConfigured } from '@/lib/bot/recallService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    if (!isRecallConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Simulated bot left the meeting.',
      });
    }

    await leaveRecallBot(id);

    return NextResponse.json({
      success: true,
      message: 'Recall.ai bot instructed to leave the call.',
    });
  } catch (err: any) {
    console.error('Error instructing Recall bot to leave:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to leave meeting' },
      { status: 500 }
    );
  }
}
