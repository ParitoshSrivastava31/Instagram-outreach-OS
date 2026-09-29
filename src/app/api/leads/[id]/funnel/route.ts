import { NextResponse } from 'next/server';
import { updateLeadStatus } from '@/lib/db';
import { LeadStatus } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const targetStatus = body.status as LeadStatus;

    const allowedFunnelStatuses: LeadStatus[] = [
      'INTERESTED',
      'USED_VAULT',
      'SENT_SECOND_REEL',
      'PAID'
    ];

    if (!allowedFunnelStatuses.includes(targetStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid funnel status. Must be one of: ${allowedFunnelStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await updateLeadStatus(id, targetStatus, {
      product_milestone: targetStatus,
      reels_processed_count: body.reels_processed_count || 1,
      notes: body.notes
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
