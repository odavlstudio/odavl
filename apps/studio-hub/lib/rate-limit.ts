import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Initialize Redis client (with fallback for development)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : Redis.fromEnv();

// Create rate limiter instances for different use cases
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
  prefix: '@odavl/api',
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 login attempts per 15 minutes
  analytics: true,
  prefix: '@odavl/auth',
});

export const insightRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 insight runs per hour
  analytics: true,
  prefix: '@odavl/insight',
});

export const autopilotRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 autopilot runs per hour
  analytics: true,
  prefix: '@odavl/autopilot',
});

export const guardianRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'), // 30 guardian tests per hour
  analytics: true,
  prefix: '@odavl/guardian',
});

// Higher limits for paid plans
export const proApiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 requests per hour
  analytics: true,
  prefix: '@odavl/api/pro',
});

// CLI API rate limiter (10 req/min per user/IP)
export const cliRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
  prefix: '@odavl/cli',
});

// Helper function for CLI routes
export async function rateLimit(request: NextRequest): Promise<{ success: boolean; remaining: number }> {
  try {
    // Get identifier (IP or API key)
    const authHeader = request.headers.get('Authorization');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const identifier = authHeader ? `api:${authHeader.substring(7, 20)}` : `ip:${ip}`;

    const result = await cliRateLimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request (fail open)
    return { success: true, remaining: 10 };
  }
}

export const enterpriseApiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10000, '1 h'), // 10000 requests per hour
  analytics: true,
  prefix: '@odavl/api/enterprise',
});

// Get appropriate rate limiter based on user plan
export function getRateLimiterForPlan(plan: 'FREE' | 'PRO' | 'ENTERPRISE') {
  switch (plan) {
    case 'ENTERPRISE':
      return enterpriseApiRateLimit;
    case 'PRO':
      return proApiRateLimit;
    default:
      return apiRateLimit;
  }
}

// Helper to check rate limit and return appropriate response
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}
