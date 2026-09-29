import { NextResponse } from 'next/server';
import { getMonthlyUsageStatus, getDiscoveryRuns } from '@/lib/db';
import { getDiscoveryProvider } from '@/lib/discovery';

export async function GET() {
  try {
    const budgetStatus = await getMonthlyUsageStatus();
    const provider = getDiscoveryProvider();
    const recentRuns = await getDiscoveryRuns();

    return NextResponse.json({
      success: true,
      budgetStatus,
      provider: {
        id: provider.id,
        name: provider.name,
        isMock: provider.isMock
      },
      recentRuns: recentRuns.slice(0, 5)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
