/**
 * Billing Status Endpoint
 * Phase 3.0.5: Production Launch Hardening
 * 
 * GET /api/billing/status
 * Returns current billing status and quota information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '../../../lib/auth/jwt.middleware';
import { prisma } from '../../../lib/prisma';
import { isBillingEnabled } from '../../../lib/billing/feature-flags';
import { logBillingAction, BillingAction } from '../../../lib/billing/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/status
 * Returns current subscription status and quota information
 */
export const GET = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    // Get subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        billingEnabled: isBillingEnabled(),
        currentPlan: 'FREE',
        status: 'active',
        quotas: {
          maxProjects: 3,
          maxAnalysesPerMonth: 10,
          maxStorageGB: 1,
        },
        usage: {
          projectsUsed: 0,
          analysesUsedThisMonth: 0,
          storageUsedGB: 0,
        },
        renewalDate: null,
        features: {
          canUpgrade: isBillingEnabled(),
          canDowngrade: false,
          canSwitchPlans: false,
        },
      });
    }

    // Get usage data (from InsightUsage table if exists)
    // For now, return placeholder values
    const usage = {
      projectsUsed: 0,
      analysesUsedThisMonth: 0,
      storageUsedGB: 0,
    };

    // Calculate quota remaining
    const quotaRemaining = {
      projects: subscription.maxProjects - usage.projectsUsed,
      analyses: subscription.maxAnalysesPerMonth - usage.analysesUsedThisMonth,
      storageGB: subscription.maxStorageGB - usage.storageUsedGB,
    };

    // Check if user can perform actions
    const canUpgrade = isBillingEnabled() && subscription.tier !== 'ENTERPRISE';
    const canDowngrade = isBillingEnabled() && subscription.tier !== 'FREE';
    const canSwitchPlans = isBillingEnabled() && subscription.tier !== 'FREE' && subscription.tier !== 'ENTERPRISE';

    return NextResponse.json({
      success: true,
      billingEnabled: isBillingEnabled(),
      currentPlan: subscription.tier,
      status: subscription.status,
      quotas: {
        maxProjects: subscription.maxProjects,
        maxAnalysesPerMonth: subscription.maxAnalysesPerMonth,
        maxStorageGB: subscription.maxStorageGB,
      },
      usage,
      quotaRemaining,
      renewalDate: subscription.currentPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      features: {
        canUpgrade,
        canDowngrade,
        canSwitchPlans,
      },
    });
  } catch (error) {
    console.error('[Billing Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'STATUS_FETCH_FAILED',
        message: 'Failed to fetch billing status',
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
