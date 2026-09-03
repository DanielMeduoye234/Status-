import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyStatusReport } from '@/lib/ai/aiService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, monthYear, sourceType, contentData } = body;

    if (!projectName || !monthYear || !contentData) {
      return NextResponse.json(
        { error: 'Project name, month/year, and content data are required.' },
        { status: 400 }
      );
    }

    const result = await generateMonthlyStatusReport({
      projectName,
      monthYear,
      sourceType: sourceType || 'meeting_summaries',
      contentData,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating monthly status report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate monthly status report' },
      { status: 500 }
    );
  }
}
