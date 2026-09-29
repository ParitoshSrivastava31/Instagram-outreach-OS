import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/db';
import { LeadStatus } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as LeadStatus | 'ALL') || undefined;
    const tier = searchParams.get('tier') || undefined;
    const campaignId = searchParams.get('campaignId') || undefined;
    const search = searchParams.get('search') || undefined;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!, 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    const leads = await getLeads({
      status,
      tier,
      campaignId,
      search,
      minScore,
      limit
    });

    return NextResponse.json({ success: true, count: leads.length, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
