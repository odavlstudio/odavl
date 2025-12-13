/**
 * Audit Logging for Billing Actions
 * Phase 3.0.5: Production Launch Hardening
 * 
 * Tracks all billing-related actions for compliance and debugging.
 */

import { prisma } from '@/lib/prisma';

export enum BillingAction {
  CHECKOUT_INITIATED = 'checkout.initiated',
  CHECKOUT_COMPLETED = 'checkout.completed',
  CHECKOUT_FAILED = 'checkout.failed',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  PLAN_SWITCHED = 'plan.switched',
  DOWNGRADE_REQUESTED = 'downgrade.requested',
  ABUSE_DETECTED = 'abuse.detected',
  BILLING_DISABLED_ACCESS = 'billing.disabled.access',
}

export interface AuditLogEntry {
  action: BillingAction;
  userId: string;
  timestamp: Date;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log billing action to console and database
 * Phase 3.0.5: Production implementation with DB persistence
 */
export async function logBillingAction(
  action: BillingAction,
  userId: string,
  metadata: Record<string, any> = {},
  request?: Request | null
): Promise<void> {
  const entry: AuditLogEntry = {
    action,
    userId,
    timestamp: new Date(),
    metadata,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
  };

  // Log to console with structured format (for log aggregation)
  console.log('[Billing Audit]', JSON.stringify(entry));

  // Phase 3.0.5: Write to audit table (production implementation)
  try {
    await prisma.billingAudit.create({
      data: {
        action,
        userId,
        timestamp: entry.timestamp,
        metadata: JSON.stringify(metadata),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[Billing Audit] Failed to write to database:', error);
  }
}

/**
 * Check for rapid plan switching (abuse detection)
 * Phase 3.0.5: Production implementation with DB queries
 */
export interface AbuseCheckResult {
  isAbuse: boolean;
  reason?: string;
  lastActionAt?: Date;
}

export async function checkForAbuse(
  userId: string,
  action: BillingAction
): Promise<AbuseCheckResult> {
  try {
    // Query audit table for recent actions (last 24 hours)
    const recentActions = await prisma.billingAudit.findMany({
      where: {
        userId,
        action,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10, // Only need to check first 10
    });

    // Detect abuse: 3+ attempts in 24h
    if (recentActions.length >= 3) {
      return {
        isAbuse: true,
        reason: `More than 3 ${action} attempts in 24 hours`,
        lastActionAt: recentActions[0].timestamp,
      };
    }

    return { isAbuse: false };
  } catch (error) {
    // On error, return safe default (don't block legitimate users)
    console.error('[Billing Audit] Abuse check failed:', error);
    return { isAbuse: false };
  }
}
