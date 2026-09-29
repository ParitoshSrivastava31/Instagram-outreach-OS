import { NextResponse } from 'next/server';
import { getMessageTemplates } from '@/lib/db';

export async function GET() {
  try {
    const templates = await getMessageTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
