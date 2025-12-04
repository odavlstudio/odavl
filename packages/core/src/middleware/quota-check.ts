/**
 * Quota Check Middleware
 * Enforce plan quotas before operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { usageTrackingService } from '../services/usage-tracking';

export interface QuotaCheckOptions {
  product: 'insight' | 'autopilot' | 'guardian';
  operation?: string;
}

/**
 * Middleware to check quota before operation
 */
export async function requireQuota(
  request: NextRequest,
  options: QuotaCheckOptions
): Promise<NextResponse | null> {
  try {
    // Get organization ID from request
    // This assumes orgId is in the request context or headers
    const orgId = request.headers.get('x-organization-id');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Check quota
    const result = await usageTrackingService.checkQuota(orgId, options.product);

    if (!result.allowed) {
      // Return 429 Too Many Requests with upgrade info
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: result.reason,
          upgradeUrl: result.upgradeUrl,
          code: 'QUOTA_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '0',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': getNextResetTimestamp(),
            'Retry-After': String(getSecondsUntilNextMonth()),
          },
        }
      );
    }

    // Get usage status for headers
    const status = await usageTrackingService.getUsageStatus(orgId);
    const limits = status.limits;
    const usage = status.usage;

    // Add quota headers to response (will be set by calling code)
    const fieldMap = {
      insight: 'insightRuns',
      autopilot: 'autopilotRuns',
      guardian: 'guardianTests',
    } as const;

    const field = fieldMap[options.product];
    const limit = limits[field];
    const current = usage[field];
    const remaining = limit === -1 ? -1 : Math.max(0, limit - current);

    // Store quota info in request for use by handler
    (request as any).quotaInfo = {
      limit,
      current,
      remaining,
      resetAt: getNextResetTimestamp(),
    };

    return null; // Allow request to proceed
  } catch (error) {
    console.error('Quota check failed:', error);
    // On error, allow request (fail open)
    return null;
  }
}

/**
 * Get timestamp for next monthly reset
 */
function getNextResetTimestamp(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

/**
 * Get seconds until next monthly reset
 */
function getSecondsUntilNextMonth(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
}

/**
 * Express/Next.js middleware wrapper
 */
export function createQuotaMiddleware(options: QuotaCheckOptions) {
  return async (request: NextRequest) => {
    const blockResponse = await requireQuota(request, options);
    
    if (blockResponse) {
      return blockResponse;
    }

    // If we get here, quota check passed
    // Continue to next middleware or handler
    return NextResponse.next();
  };
}

/**
 * Add quota headers to response
 */
export function addQuotaHeaders(
  response: NextResponse,
  quotaInfo: {
    limit: number;
    current: number;
    remaining: number;
    resetAt: string;
  }
): NextResponse {
  if (quotaInfo.limit !== -1) {
    response.headers.set('X-Quota-Limit', String(quotaInfo.limit));
    response.headers.set('X-Quota-Used', String(quotaInfo.current));
    response.headers.set('X-Quota-Remaining', String(quotaInfo.remaining));
    response.headers.set('X-Quota-Reset', quotaInfo.resetAt);
  }
  return response;
}
