import { NextRequest, NextResponse } from 'next/server';

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

    // If bot status changed
    if (eventType === 'bot.status_change') {
      const code = eventData.data?.status?.code;
      const message = eventData.data?.status?.message;
      console.log(`[Recall.ai Webhook] Bot ${botId} status change: ${code} - ${message}`);
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
