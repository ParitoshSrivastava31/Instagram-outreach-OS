import { NextResponse } from 'next/server';
import { updateLeadStatus } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const updated = await updateLeadStatus(id, 'REPLIED', {
      reply_channel: 'instagram_dm',
      reply_snippet: body?.reply_snippet || '',
      sentiment: body?.sentiment || 'positive'
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
