import { MonthlyBudgetStatus } from '@/types';

// Configuration from Environment Variables with strictly guarded server defaults
export const BUDGET_CONFIG = {
  get monthlyBudgetUsd(): number {
    return parseFloat(process.env.APIFY_MONTHLY_BUDGET_USD || '4.50');
  },
  get maxDailyQualifiedLeads(): number {
    return parseInt(process.env.MAX_DAILY_QUALIFIED_LEADS || '60', 10);
  },
  get maxRawProfilesPerRun(): number {
    return parseInt(process.env.MAX_RAW_PROFILES_PER_RUN || '150', 10);
  },
  get maxFollowers(): number {
    return parseInt(process.env.MAX_FOLLOWERS || '20000', 10);
  }
};

/**
 * Standard estimated cost calculation for Apify runs.
 * Apify Instagram scrapers typically cost ~$0.001 to $0.003 per profile scraped (or compute unit equivalent).
 */
export function estimateRunCost(rawProfilesCount: number): number {
  const costPerProfile = 0.002; // $0.002 per profile scraped
  const runBaseFee = 0.005; // $0.005 base execution fee
  return parseFloat((runBaseFee + rawProfilesCount * costPerProfile).toFixed(4));
}

export function evaluateBudgetCheck(
  currentMonthUsageUsd: number,
  todayQualifiedCount: number
): {
  canProceed: boolean;
  reason?: string;
  status: MonthlyBudgetStatus;
} {
  const budget = BUDGET_CONFIG.monthlyBudgetUsd;
  const remaining = Math.max(0, budget - currentMonthUsageUsd);
  const isBudgetExceeded = currentMonthUsageUsd >= budget;

  const now = new Date();
  const daysElapsed = now.getDate();

  const status: MonthlyBudgetStatus = {
    monthly_budget_usd: budget,
    estimated_usage_usd: parseFloat(currentMonthUsageUsd.toFixed(4)),
    remaining_budget_usd: parseFloat(remaining.toFixed(4)),
    is_budget_exceeded: isBudgetExceeded,
    days_elapsed: daysElapsed,
    total_qualified_leads_month: 0, // Injected by caller from DB
    today_qualified_leads: todayQualifiedCount,
    max_daily_qualified_leads: BUDGET_CONFIG.maxDailyQualifiedLeads
  };

  if (isBudgetExceeded) {
    return {
      canProceed: false,
      reason: `Monthly discovery budget reached ($${currentMonthUsageUsd.toFixed(2)} / $${budget.toFixed(2)}). To protect against costs, discovery is halted until next month.`,
      status
    };
  }

  if (todayQualifiedCount >= BUDGET_CONFIG.maxDailyQualifiedLeads) {
    return {
      canProceed: false,
      reason: `Daily qualified lead limit of ${BUDGET_CONFIG.maxDailyQualifiedLeads} leads reached for today. Outreach queue is fully stocked.`,
      status
    };
  }

  return {
    canProceed: true,
    status
  };
}
