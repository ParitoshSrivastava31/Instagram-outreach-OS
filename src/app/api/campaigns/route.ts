import { NextResponse } from 'next/server';
import { getCampaigns, createCampaign } from '@/lib/db';

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Campaign name is required' }, { status: 400 });
    }

    const campaign = await createCampaign(body);
    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
