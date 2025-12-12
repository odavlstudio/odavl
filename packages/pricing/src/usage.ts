/**
 * Usage Tracking Utilities
 * 
 * Track user consumption of API calls, scans, tests, etc.
 */

export interface UsageMetrics {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  apiCalls: number;
  scans: number;
  tests: number;
  dataStorageMB: number;
  teamMembers: number;
}

export interface UsageTrend {
  date: string;
  apiCalls: number;
  scans: number;
  tests: number;
}

/**
 * Calculate current billing period
 */
export function getCurrentBillingPeriod(subscriptionStartDate: Date): {
  start: Date;
  end: Date;
  daysRemaining: number;
} {
  const now = new Date();
  const start = new Date(subscriptionStartDate);
  
  // Find current period start (same day of month as subscription start)
  const periodStart = new Date(now.getFullYear(), now.getMonth(), start.getDate());
  if (periodStart > now) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  // Period end is one month later
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  
  const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    start: periodStart,
    end: periodEnd,
    daysRemaining,
  };
}

/**
 * Calculate usage percentage for a resource
 */
export function calculateUsagePercentage(used: number, limit: number | 'unlimited'): number {
  if (limit === 'unlimited') return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Predict end-of-month usage based on current rate
 */
export function predictMonthlyUsage(
  currentUsage: number,
  daysElapsed: number,
  totalDaysInMonth: number = 30
): number {
  if (daysElapsed === 0) return 0;
  
  const dailyRate = currentUsage / daysElapsed;
  const predictedTotal = dailyRate * totalDaysInMonth;
  
  return Math.round(predictedTotal);
}

/**
 * Check if user is approaching limits (>80%)
 */
export function checkLimitWarnings(usage: {
  apiCalls: number;
  scans: number;
  tests: number;
}, limits: {
  apiCallsPerMonth: number | 'unlimited';
  scansPerMonth: number | 'unlimited';
  testsPerMonth: number | 'unlimited';
}): Array<{ resource: string; percentage: number; warning: string }> {
  const warnings: Array<{ resource: string; percentage: number; warning: string }> = [];

  // API calls
  if (limits.apiCallsPerMonth !== 'unlimited') {
    const percentage = calculateUsagePercentage(usage.apiCalls, limits.apiCallsPerMonth);
    if (percentage >= 80) {
      warnings.push({
        resource: 'API Calls',
        percentage,
        warning: `You've used ${percentage}% of your API call limit (${usage.apiCalls}/${limits.apiCallsPerMonth})`,
      });
    }
  }

  // Scans
  if (limits.scansPerMonth !== 'unlimited') {
    const percentage = calculateUsagePercentage(usage.scans, limits.scansPerMonth);
    if (percentage >= 80) {
      warnings.push({
        resource: 'Scans',
        percentage,
        warning: `You've used ${percentage}% of your scan limit (${usage.scans}/${limits.scansPerMonth})`,
      });
    }
  }

  // Tests
  if (limits.testsPerMonth !== 'unlimited') {
    const percentage = calculateUsagePercentage(usage.tests, limits.testsPerMonth);
    if (percentage >= 80) {
      warnings.push({
        resource: 'Tests',
        percentage,
        warning: `You've used ${percentage}% of your test limit (${usage.tests}/${limits.testsPerMonth})`,
      });
    }
  }

  return warnings;
}

/**
 * Aggregate usage data for trends
 */
export function aggregateUsageTrends(
  rawUsage: Array<{ timestamp: Date; apiCalls: number; scans: number; tests: number }>,
  granularity: 'daily' | 'weekly' = 'daily'
): UsageTrend[] {
  const aggregated = new Map<string, { apiCalls: number; scans: number; tests: number }>();

  for (const entry of rawUsage) {
    let key: string;
    
    if (granularity === 'daily') {
      key = entry.timestamp.toISOString().split('T')[0];
    } else {
      // Weekly: get start of week
      const d = new Date(entry.timestamp);
      d.setDate(d.getDate() - d.getDay());
      key = d.toISOString().split('T')[0];
    }

    const existing = aggregated.get(key) || { apiCalls: 0, scans: 0, tests: 0 };
    existing.apiCalls += entry.apiCalls;
    existing.scans += entry.scans;
    existing.tests += entry.tests;
    aggregated.set(key, existing);
  }

  return Array.from(aggregated.entries())
    .map(([date, usage]) => ({ date, ...usage }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default {
  getCurrentBillingPeriod,
  calculateUsagePercentage,
  predictMonthlyUsage,
  checkLimitWarnings,
  aggregateUsageTrends,
};
