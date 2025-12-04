/**
 * Redis-Backed Rate Limiting Middleware
 *
 * Implements sliding window rate limiting with Redis for
 * distributed rate limiting across multiple servers.
 *
 * Limits:
 * - Free tier: 1,000 requests/hour
 * - Pro tier: 10,000 requests/hour
 * - Enterprise: Custom limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Initialize Redis client
const redis = Redis.fromEnv();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  FREE: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Rate limit exceeded. Upgrade to Pro for higher limits.',
  },
  PRO: {
    maxRequests: 10000,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  ENTERPRISE: {
    maxRequests: 100000,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `ratelimit:${identifier}`;

  try {
    // Use Redis sorted set for sliding window
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    const count = await redis.zcard(key);

    // Check if limit exceeded
    if (count >= config.maxRequests) {
      // Get oldest request timestamp to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const resetTime = oldest.length > 0
        ? (oldest[0] as { score: number }).score + config.windowMs
        : now + config.windowMs;

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: Math.ceil(resetTime / 1000),
      };
    }

    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiration to window size
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - count - 1,
      reset: Math.ceil((now + config.windowMs) / 1000),
    };
  } catch (error) {
    logger.error('[Rate Limit] Redis error', error as Error);

    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.ceil((now + config.windowMs) / 1000),
    };
  }
}

/**
 * Get rate limit configuration based on user's plan
 */
async function getRateLimitConfig(req: NextRequest): Promise<{
  identifier: string;
  config: RateLimitConfig;
}> {
  // Check for API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    // In production, fetch organization plan from database
    // For now, use API key prefix to determine plan
    const identifier = `apikey:${apiKey}`;
    const plan = apiKey.includes('_pro_') ? 'PRO' :
                 apiKey.includes('_ent_') ? 'ENTERPRISE' : 'FREE';
    return { identifier, config: RATE_LIMITS[plan] };
  }

  // Check for JWT token (session-based)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const identifier = `user:${session.user.id}`;

    // Fetch user's organization plan
    // For now, default to FREE
    type UserWithPlan = typeof session.user & { plan?: 'FREE' | 'PRO' | 'ENTERPRISE' };
    const plan = (session.user as UserWithPlan).plan || 'FREE';
    return { identifier, config: RATE_LIMITS[plan] };
  }

  // Anonymous user - use IP address
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown';
  return {
    identifier: `ip:${ip}`,
    config: {
      maxRequests: 100, // Lower limit for anonymous users
      windowMs: 60 * 60 * 1000,
      message: 'Rate limit exceeded. Sign in for higher limits.',
    },
  };
}

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip rate limiting for health checks
  if (req.nextUrl.pathname === '/api/health') {
    return handler(req);
  }

  const { identifier, config } = await getRateLimitConfig(req);
  const result = await checkRateLimit(identifier, config);

  // Add rate limit headers to response
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (!result.success) {
    // Rate limit exceeded
    return NextResponse.json(
      {
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: config.message || 'Rate limit exceeded',
          retryAfter: result.reset - Math.floor(Date.now() / 1000),
        },
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Execute handler
  const response = await handler(req);

  // Add rate limit headers to successful response
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Rate limiting for tRPC procedures
 */
export function createRateLimitMiddleware() {
  return async ({ ctx, next }: { ctx: { apiKey?: string; session?: { user?: { id: string } }; ip?: string; rateLimit?: unknown }; next: () => Promise<unknown> }) => {
    const identifier = ctx.apiKey
      ? `apikey:${ctx.apiKey}`
      : ctx.session?.user?.id
      ? `user:${ctx.session.user.id}`
      : `ip:${ctx.ip}`;

    const config = ctx.apiKey?.includes('_pro_')
      ? RATE_LIMITS.PRO
      : ctx.apiKey?.includes('_ent_')
      ? RATE_LIMITS.ENTERPRISE
      : RATE_LIMITS.FREE;

    const result = await checkRateLimit(identifier, config);

    if (!result.success) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Attach rate limit info to context
    ctx.rateLimit = result;

    return next();
  };
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `ratelimit:${identifier}`;

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const used = await redis.zcard(key);

    return {
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - used),
      reset: Math.ceil((now + config.windowMs) / 1000),
      used,
    };
  } catch (error) {
    logger.error('[Rate Limit] Status check error', error as Error);

    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.ceil((now + config.windowMs) / 1000),
      used: 0,
    };
  }
}

