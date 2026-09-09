import { NextRequest, NextResponse } from 'next/server';
import { testRecallApiKey, isRecallConfigured, getRecallRegion } from '@/lib/bot/recallService';

export async function POST(req: NextRequest) {
  try {
    let apiKeyOverride: string | undefined = undefined;
    let regionOverride: string | undefined = undefined;

    try {
      const body = await req.json();
      apiKeyOverride = body.apiKey;
      regionOverride = body.region;
    } catch {
      // Body is optional if testing server env variables
    }

    const configured = isRecallConfigured() || Boolean(apiKeyOverride);

    if (!configured) {
      return NextResponse.json({
        ok: false,
        configured: false,
        region: getRecallRegion(regionOverride),
        error: 'No RECALL_AI_API_KEY found in .env.local or provided in request.',
      });
    }

    const testResult = await testRecallApiKey(apiKeyOverride, regionOverride);
    return NextResponse.json(testResult);
  } catch (err: any) {
    console.error('Recall test connection error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const configured = isRecallConfigured();
  return NextResponse.json({
    configured,
    region: getRecallRegion(),
    provider: 'Recall.ai',
  });
}
