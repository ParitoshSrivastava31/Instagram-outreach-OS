import { NextResponse } from 'next/server';
import { getLeadById, recordOutreachEvent, updateLeadStatus } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Record OPENED event and set status to OPENED if it was QUEUED
    if (lead.status === 'QUEUED') {
      await updateLeadStatus(id, 'OPENED', { action: 'open_and_copy' });
    } else {
      await recordOutreachEvent(id, 'OPENED', { action: 'open_profile_view' }, lead.campaign_id);
    }

    return NextResponse.json({
      success: true,
      instagram_url: lead.instagram_url,
      prepared_message: lead.prepared_message || ''
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
