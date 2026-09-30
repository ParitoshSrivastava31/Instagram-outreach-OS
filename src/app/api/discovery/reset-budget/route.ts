import { NextResponse } from 'next/server';
import { resetMonthlyUsage } from '@/lib/db';

export async function POST() {
  try {
    const budgetStatus = await resetMonthlyUsage();
    return NextResponse.json({ success: true, budgetStatus });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
