/**
 * Usage Tracker - Metering and quota enforcement
 */

export interface UsageMetric {
  organizationId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

export interface UsageQuota {
  metric: string;
  limit: number;
  used: number;
  resetAt: Date;
}

export class UsageTracker {
  private usage: Map<string, UsageMetric[]> = new Map();

  recordUsage(organizationId: string, metric: string, value: number): void {
    const key = `${organizationId}:${metric}`;
    const existing = this.usage.get(key) || [];
    
    existing.push({
      organizationId,
      metric,
      value,
      timestamp: new Date(),
    });
    
    this.usage.set(key, existing);
  }

  getUsage(organizationId: string, metric?: string): UsageMetric[] {
    if (metric) {
      return this.usage.get(`${organizationId}:${metric}`) || [];
    }
    
    return Array.from(this.usage.entries())
      .filter(([key]) => key.startsWith(`${organizationId}:`))
      .flatMap(([, metrics]) => metrics);
  }

  getTotalUsage(organizationId: string, metric: string): number {
    const metrics = this.usage.get(`${organizationId}:${metric}`) || [];
    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  checkQuota(organizationId: string, metric: string, limit: number): UsageQuota {
    const used = this.getTotalUsage(organizationId, metric);
    const resetAt = this.getNextResetDate();
    
    return {
      metric,
      limit,
      used,
      resetAt,
    };
  }

  enforceQuota(organizationId: string, metric: string, limit: number): boolean {
    const used = this.getTotalUsage(organizationId, metric);
    return used < limit;
  }

  private getNextResetDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  resetUsage(organizationId: string, metric?: string): void {
    if (metric) {
      this.usage.delete(`${organizationId}:${metric}`);
    } else {
      Array.from(this.usage.keys())
        .filter((key) => key.startsWith(`${organizationId}:`))
        .forEach((key) => this.usage.delete(key));
    }
  }
}
