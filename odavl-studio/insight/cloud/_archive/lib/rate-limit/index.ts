/**
 * Rate Limiting with Upstash Redis
 * Implements three-tier rate limiting for different API categories
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// ============================================
// Rate Limiters Configuration
// ============================================

/**
 * Auth Rate Limiter
 * For sensitive auth endpoints (login, register, password reset)
 * Limit: 5 requests per 15 minutes per IP
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

/**
 * API Rate Limiter
 * For general API calls (projects, analysis results, etc.)
 * Limit: 100 requests per minute per user/IP
 */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Analysis Rate Limiter
 * For expensive operations (code analysis, ML predictions)
 * Limit: 10 requests per hour per user
 */
export const analysisLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:analysis',
});

/**
 * Email Rate Limiter
 * For email sending operations
 * Limit: 3 requests per hour per user
 */
export const emailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:email',
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get identifier for rate limiting
 * Priority: User ID > IP Address > Fallback
 */
export function getIdentifier(request: NextRequest): string {
  // Try to get user ID from JWT token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Simple JWT decode (just get payload, don't verify here)
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      if (payload.userId) {
        return `user:${payload.userId}`;
      }
    } catch {
      // Token invalid, fall through to IP
    }
  }

  // Fallback to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Get IP address from request
 */
export function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

/**
 * Format rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      details: {
        limit: result.limit,
        remaining: result.remaining,
        resetAt: new Date(result.reset).toISOString(),
        retryAfter: `${retryAfter} seconds`,
      },
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

// ============================================
// Rate Limit Middleware
// ============================================

/**
 * Rate limit middleware wrapper
 * Usage: export const POST = withRateLimit(authLimiter, async (req) => { ... });
 */
export function withRateLimit(
  limiter: Ratelimit,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get identifier for this request
    const identifier = getIdentifier(request);

    // Check rate limit
    const result = await limiter.limit(identifier);

    // If rate limit exceeded, return 429
    if (!result.success) {
      return createRateLimitResponse(result);
    }

    // Rate limit OK, proceed to handler
    const response = await handler(request);

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Check rate limit without blocking
 * Useful for analytics or warnings
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  return await limiter.limit(identifier);
}

/**
 * Reset rate limit for identifier
 * Useful for admin overrides or testing
 */
export async function resetRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<void> {
  const key = `${limiter.prefix}:${identifier}`;
  await redis.del(key);
}

// ============================================
// Rate Limit Info Helpers
// ============================================

/**
 * Get rate limit info for identifier
 */
export async function getRateLimitInfo(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
  percentage: number;
}> {
  const result = await limiter.limit(identifier);

  return {
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    percentage: Math.round((result.remaining / result.limit) * 100),
  };
}

/**
 * Check if identifier is close to limit
 * Returns true if less than 20% remaining
 */
export async function isNearRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<boolean> {
  const info = await getRateLimitInfo(limiter, identifier);
  return info.percentage < 20;
}

// ============================================
// Development Mode Bypass
// ============================================

/**
 * Check if rate limiting should be bypassed
 * Bypass in development mode or if explicitly disabled
 */
export function shouldBypassRateLimit(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.DISABLE_RATE_LIMIT === 'true'
  );
}

/**
 * Rate limit middleware with dev bypass
 */
export function withRateLimitDev(
  limiter: Ratelimit,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Bypass in development
    if (shouldBypassRateLimit()) {
      return handler(request);
    }

    // Apply rate limit in production
    return withRateLimit(limiter, handler)(request);
  };
}

// ============================================
// Export Types
// ============================================

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export type RateLimiterType = 'auth' | 'api' | 'analysis' | 'email';

/**
 * Get rate limiter by type
 */
export function getRateLimiter(type: RateLimiterType): Ratelimit {
  switch (type) {
    case 'auth':
      return authLimiter;
    case 'api':
      return apiLimiter;
    case 'analysis':
      return analysisLimiter;
    case 'email':
      return emailLimiter;
    default:
      return apiLimiter;
  }
}
