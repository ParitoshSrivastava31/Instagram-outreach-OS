import { NextResponse } from 'next/server';
import { getSenderAccount, updateSenderAccount } from '@/lib/db';

export async function GET() {
  try {
    const sender = await getSenderAccount();
    return NextResponse.json({
      success: true,
      sender,
      budgetCeilingUsd: parseFloat(process.env.APIFY_MONTHLY_BUDGET_USD || '4.50'),
      hasApifyToken: Boolean(process.env.APIFY_API_TOKEN),
      apifyActorId: process.env.APIFY_ACTOR_ID || 'apify/instagram-profile-scraper',
      hasMetaWebhook: Boolean(process.env.META_VERIFY_TOKEN)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanUsername = (body.instagram_username || 'vault.moment').replace(/^@/, '').trim();

    const updated = await updateSenderAccount({
      name: body.name || 'Paritosh',
      display_name: body.display_name || 'Paritosh',
      instagram_username: cleanUsername,
      instagram_profile_url: `https://instagram.com/${cleanUsername}`
    });

    return NextResponse.json({ success: true, sender: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
