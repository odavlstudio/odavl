/**
 * Feature Gating System
 * Middleware and utilities to enforce tier-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@odavl-studio/auth';
import { PRODUCT_TIERS, type SubscriptionTier } from '@odavl/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Feature definitions by tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  FREE: [
    'basic-detectors',
    'problems-panel',
    'typescript-analysis',
    'eslint-integration',
    'import-checks',
    'community-support',
  ],
  PRO: [
    'basic-detectors',
    'problems-panel',
    'typescript-analysis',
    'eslint-integration',
    'import-checks',
    'community-support',
    // PRO-exclusive features
    'ml-predictions',
    'auto-fix',
    'advanced-detectors',
    'security-scanning',
    'performance-analysis',
    'circular-dependency-detection',
    'priority-support',
  ],
  ENTERPRISE: [
    'basic-detectors',
    'problems-panel',
    'typescript-analysis',
    'eslint-integration',
    'import-checks',
    'community-support',
    'ml-predictions',
    'auto-fix',
    'advanced-detectors',
    'security-scanning',
    'performance-analysis',
    'circular-dependency-detection',
    'priority-support',
    // ENTERPRISE-exclusive features
    'custom-rules',
    'team-sharing',
    'sso-saml',
    'audit-logs',
    'dedicated-support',
    'on-premise-deployment',
    'unlimited-users',
  ],
};

/**
 * Middleware: Require specific tier or higher
 * Usage: requireTier('PRO')
 */
export function requireTier(minTier: SubscriptionTier) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // Verify authentication
      const token = req.cookies.get('accessToken')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const payload = verifyToken(token, JWT_SECRET);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Get subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId: payload.userId },
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'No active subscription' },
          { status: 403 }
        );
      }

      // Check tier
      const tierOrder: SubscriptionTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
      const userTierIndex = tierOrder.indexOf(subscription.tier as SubscriptionTier);
      const requiredTierIndex = tierOrder.indexOf(minTier);

      if (userTierIndex < requiredTierIndex) {
        const requiredTierName = PRODUCT_TIERS[minTier].displayName;
        return NextResponse.json(
          {
            error: `This feature requires ${requiredTierName} plan`,
            currentTier: subscription.tier,
            requiredTier: minTier,
            upgradeUrl: '/dashboard/billing/upgrade',
          },
          { status: 403 }
        );
      }

      // Tier check passed
      return null;
    } catch (error) {
      console.error('Tier check error:', error);
      return NextResponse.json(
        { error: 'Failed to verify tier' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user can access a specific feature
 * @param userId - User ID
 * @param feature - Feature slug (e.g., 'ml-predictions')
 * @returns Promise<boolean>
 */
export async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return false;
    }

    const tier = subscription.tier as SubscriptionTier;
    const tierFeatures = TIER_FEATURES[tier] || [];
    return tierFeatures.includes(feature);
  } catch (error) {
    console.error('Feature check error:', error);
    return false;
  }
}

/**
 * Get all features available to a user
 * @param userId - User ID
 * @returns Promise<string[]>
 */
export async function getUserFeatures(userId: string): Promise<string[]> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return TIER_FEATURES.FREE;
    }

    const tier = subscription.tier as SubscriptionTier;
    return TIER_FEATURES[tier] || TIER_FEATURES.FREE;
  } catch (error) {
    console.error('Get features error:', error);
    return TIER_FEATURES.FREE;
  }
}

/**
 * Middleware: Require specific feature
 * Usage: requireFeature('ml-predictions')
 */
export function requireFeature(feature: string) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // Verify authentication
      const token = req.cookies.get('accessToken')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const payload = verifyToken(token, JWT_SECRET);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check feature access
      const hasAccess = await canAccessFeature(payload.userId, feature);

      if (!hasAccess) {
        // Find which tier provides this feature
        let requiredTier: SubscriptionTier | null = null;
        for (const [tier, features] of Object.entries(TIER_FEATURES)) {
          if (features.includes(feature)) {
            requiredTier = tier as SubscriptionTier;
            break;
          }
        }

        return NextResponse.json(
          {
            error: `Feature '${feature}' not available in your plan`,
            feature,
            requiredTier,
            upgradeUrl: '/dashboard/billing/upgrade',
          },
          { status: 403 }
        );
      }

      // Feature check passed
      return null;
    } catch (error) {
      console.error('Feature check error:', error);
      return NextResponse.json(
        { error: 'Failed to verify feature access' },
        { status: 500 }
      );
    }
  };
}

/**
 * Get upgrade recommendation for a feature
 * @param feature - Feature slug
 * @returns Minimum tier required
 */
export function getRequiredTier(feature: string): SubscriptionTier | null {
  for (const [tier, features] of Object.entries(TIER_FEATURES)) {
    if (features.includes(feature)) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}
