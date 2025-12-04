/**
 * Usage Tracking Service
 * Track API usage and enforce plan quotas
 */

import { prisma } from '@/lib/prisma';

export interface UsageMetrics {
  period: string; // 'YYYY-MM'
  apiCalls: number;
  insightRuns: number;
  autopilotRuns: number;
  guardianTests: number;
  storageUsed: number; // bytes
}

export interface QuotaLimits {
  apiCalls: number;
  insightRuns: number;
  autopilotRuns: number;
  guardianTests: number;
  storageLimit: number; // bytes
}

export interface UsageStatus {
  usage: UsageMetrics;
  limits: QuotaLimits;
  percentUsed: {
    apiCalls: number;
    insightRuns: number;
    autopilotRuns: number;
    guardianTests: number;
    storage: number;
  };
  withinLimits: boolean;
  warnings: string[];
}

// Plan limits configuration
const PLAN_LIMITS: Record<string, QuotaLimits> = {
  FREE: {
    apiCalls: 100,
    insightRuns: 10,
    autopilotRuns: 5,
    guardianTests: 5,
    storageLimit: 100 * 1024 * 1024, // 100MB
  },
  PRO: {
    apiCalls: 10000,
    insightRuns: 1000,
    autopilotRuns: 500,
    guardianTests: 500,
    storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
  },
  ENTERPRISE: {
    apiCalls: -1, // unlimited
    insightRuns: -1,
    autopilotRuns: -1,
    guardianTests: -1,
    storageLimit: -1,
  },
};

export class UsageTrackingService {
  private static instance: UsageTrackingService;

  private constructor() {}

  public static getInstance(): UsageTrackingService {
    if (!UsageTrackingService.instance) {
      UsageTrackingService.instance = new UsageTrackingService();
    }
    return UsageTrackingService.instance;
  }

  /**
   * Get current period (YYYY-MM)
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get plan limits for organization
   */
  private async getPlanLimits(orgId: string): Promise<QuotaLimits> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    return PLAN_LIMITS[org.plan] || PLAN_LIMITS.FREE;
  }

  /**
   * Track operation usage
   */
  public async trackOperation(
    orgId: string,
    userId: string,
    product: 'insight' | 'autopilot' | 'guardian',
    operation: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Create usage record
      await prisma.usageRecord.create({
        data: {
          userId,
          orgId,
          product,
          action: operation,
          endpoint: `/api/v1/${product}/${operation}`,
          billable: true,
          credits: 1,
          timestamp: new Date(),
        },
      });

      // Increment organization counters
      const period = this.getCurrentPeriod();
      const fieldMap = {
        insight: 'monthlyInsightRuns',
        autopilot: 'monthlyAutopilotRuns',
        guardian: 'monthlyGuardianTests',
      };

      const field = fieldMap[product];
      if (field) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            [field]: { increment: 1 },
            monthlyApiCalls: { increment: 1 },
          },
        });
      }
    } catch (error) {
      console.error('Failed to track usage:', error);
      // Don't throw - usage tracking failures shouldn't break operations
    }
  }

  /**
   * Get usage for organization
   */
  public async getUsage(orgId: string, period?: string): Promise<UsageMetrics> {
    const targetPeriod = period || this.getCurrentPeriod();

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        monthlyApiCalls: true,
        monthlyInsightRuns: true,
        monthlyAutopilotRuns: true,
        monthlyGuardianTests: true,
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    // Calculate storage used
    const storageUsed = await this.calculateStorageUsage(orgId);

    return {
      period: targetPeriod,
      apiCalls: org.monthlyApiCalls,
      insightRuns: org.monthlyInsightRuns,
      autopilotRuns: org.monthlyAutopilotRuns,
      guardianTests: org.monthlyGuardianTests,
      storageUsed,
    };
  }

  /**
   * Calculate storage usage for organization
   */
  private async calculateStorageUsage(orgId: string): Promise<number> {
    // Get all users in organization
    const users = await prisma.user.findMany({
      where: { orgId },
      select: { id: true },
    });

    const userIds = users.map(u => u.id);

    // Calculate storage from uploaded data
    // Note: This is a simplified calculation
    // In production, you'd track actual file sizes
    const [
      insightRuns,
      autopilotSnapshots,
      guardianScreenshots,
    ] = await Promise.all([
      prisma.insightRun.count({ where: { userId: { in: userIds } } }),
      prisma.autopilotSnapshot.count({ where: { userId: { in: userIds } } }),
      prisma.guardianScreenshot.count({ where: { userId: { in: userIds } } }),
    ]);

    // Estimate: 50KB per insight run, 500KB per snapshot, 200KB per screenshot
    const estimatedStorage = 
      (insightRuns * 50 * 1024) +
      (autopilotSnapshots * 500 * 1024) +
      (guardianScreenshots * 200 * 1024);

    return estimatedStorage;
  }

  /**
   * Check if operation is within quota
   */
  public async checkQuota(
    orgId: string,
    product: 'insight' | 'autopilot' | 'guardian'
  ): Promise<{ allowed: boolean; reason?: string; upgradeUrl?: string }> {
    try {
      const limits = await this.getPlanLimits(orgId);
      const usage = await this.getUsage(orgId);

      // Check if unlimited (ENTERPRISE)
      const fieldMap = {
        insight: 'insightRuns',
        autopilot: 'autopilotRuns',
        guardian: 'guardianTests',
      } as const;

      const field = fieldMap[product];
      const limit = limits[field];
      const current = usage[field];

      // Unlimited plan
      if (limit === -1) {
        return { allowed: true };
      }

      // Check if over limit
      if (current >= limit) {
        return {
          allowed: false,
          reason: `Monthly ${product} quota exceeded (${current}/${limit})`,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?upgrade=true`,
        };
      }

      // Check API calls limit
      if (limits.apiCalls !== -1 && usage.apiCalls >= limits.apiCalls) {
        return {
          allowed: false,
          reason: `Monthly API calls quota exceeded (${usage.apiCalls}/${limits.apiCalls})`,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?upgrade=true`,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Quota check failed:', error);
      // On error, allow operation (fail open)
      return { allowed: true };
    }
  }

  /**
   * Get usage status with warnings
   */
  public async getUsageStatus(orgId: string): Promise<UsageStatus> {
    const limits = await this.getPlanLimits(orgId);
    const usage = await this.getUsage(orgId);

    // Calculate percentages
    const percentUsed = {
      apiCalls: limits.apiCalls === -1 ? 0 : (usage.apiCalls / limits.apiCalls) * 100,
      insightRuns: limits.insightRuns === -1 ? 0 : (usage.insightRuns / limits.insightRuns) * 100,
      autopilotRuns: limits.autopilotRuns === -1 ? 0 : (usage.autopilotRuns / limits.autopilotRuns) * 100,
      guardianTests: limits.guardianTests === -1 ? 0 : (usage.guardianTests / limits.guardianTests) * 100,
      storage: limits.storageLimit === -1 ? 0 : (usage.storageUsed / limits.storageLimit) * 100,
    };

    // Generate warnings
    const warnings: string[] = [];
    const thresholds = [
      { percent: 80, level: 'warning' },
      { percent: 90, level: 'danger' },
      { percent: 100, level: 'exceeded' },
    ];

    for (const [key, percent] of Object.entries(percentUsed)) {
      for (const threshold of thresholds) {
        if (percent >= threshold.percent) {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          warnings.push(`${label}: ${Math.round(percent)}% used (${threshold.level})`);
          break;
        }
      }
    }

    // Check if within limits
    const withinLimits = Object.values(percentUsed).every(p => p < 100);

    return {
      usage,
      limits,
      percentUsed,
      withinLimits,
      warnings,
    };
  }

  /**
   * Reset monthly counters (called by cron job)
   */
  public async resetMonthlyCounters(): Promise<void> {
    try {
      await prisma.organization.updateMany({
        data: {
          monthlyApiCalls: 0,
          monthlyInsightRuns: 0,
          monthlyAutopilotRuns: 0,
          monthlyGuardianTests: 0,
        },
      });
      console.log('Monthly usage counters reset successfully');
    } catch (error) {
      console.error('Failed to reset monthly counters:', error);
      throw error;
    }
  }

  /**
   * Get usage history for analytics
   */
  public async getUsageHistory(
    orgId: string,
    months: number = 12
  ): Promise<UsageMetrics[]> {
    const history: UsageMetrics[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // In production, you'd query historical data
      // For now, return current month data
      if (i === 0) {
        history.push(await this.getUsage(orgId, period));
      } else {
        history.push({
          period,
          apiCalls: 0,
          insightRuns: 0,
          autopilotRuns: 0,
          guardianTests: 0,
          storageUsed: 0,
        });
      }
    }

    return history;
  }
}

// Export singleton instance
export const usageTrackingService = UsageTrackingService.getInstance();
