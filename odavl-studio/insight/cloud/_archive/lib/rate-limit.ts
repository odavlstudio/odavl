/**
 * Rate Limiting using Upstash Redis
 * Protects API endpoints from abuse
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

/**
 * API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Authentication Rate Limiter
 * 5 attempts per 15 minutes per IP
 * Protects against brute force attacks
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

/**
 * Aggressive Rate Limiter for sensitive endpoints
 * 10 requests per hour per IP
 */
export const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:strict',
});

/**
 * Analysis Rate Limiter
 * 20 analysis runs per day per user
 */
export const analysisLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '24 h'),
  analytics: true,
  prefix: 'ratelimit:analysis',
});

/**
 * Helper function to get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return 'unknown';
}

/**
 * Rate limit middleware wrapper
 */
export async function rateLimit(
  request: Request,
  limiter: Ratelimit,
  identifier?: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const id = identifier || getClientIp(request);
  const { success, limit, remaining, reset } = await limiter.limit(id);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}

/**
 * Rate limit exceeded response
 */
export function rateLimitExceededResponse(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

/**
 * Middleware function to apply rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: Ratelimit = apiLimiter
) {
  return async (request: Request): Promise<Response> => {
    const { success, limit, remaining, reset } = await rateLimit(request, limiter);

    if (!success) {
      return rateLimitExceededResponse(reset);
    }

    const response = await handler(request);
    
    // Add rate limit headers to response
    const headers = getRateLimitHeaders(limit, remaining, reset);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Check rate limit without consuming quota
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const key = `${limiter['prefix']}:${identifier}`;
    const count = await redis.get(key);
    
    if (!count) {
      return { allowed: true, remaining: limiter['limiter']['max'] };
    }

    const numCount = typeof count === 'number' ? count : parseInt(count as string, 10);
    const allowed = numCount < limiter['limiter']['max'];
    const remaining = Math.max(0, limiter['limiter']['max'] - numCount);

    return { allowed, remaining };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if check fails
    return { allowed: true, remaining: 0 };
  }
}

export default {
  apiLimiter,
  authLimiter,
  strictLimiter,
  analysisLimiter,
  rateLimit,
  withRateLimit,
  checkRateLimit,
  getRateLimitHeaders,
  rateLimitExceededResponse,
  getClientIp,
};
