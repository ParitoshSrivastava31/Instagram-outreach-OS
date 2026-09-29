import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/db';

export async function GET() {
  try {
    const analytics = await getAnalyticsSummary();
    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
