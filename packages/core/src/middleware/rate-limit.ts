/**
 * Rate Limiting Middleware
 * Protect API endpoints from abuse
 * 
 * Features:
 * - Per-API-key rate limiting
 * - Per-IP rate limiting
 * - Per-organization quotas
 * - Sliding window algorithm
 * - Custom limits per endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheService, CacheNamespace } from '@/../../packages/core/src/services/cache';

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  identifier?: 'ip' | 'apiKey' | 'organization';
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitTier {
  name: string;
  limits: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
}

// Default rate limit tiers
export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  FREE: {
    name: 'Free',
    limits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000,
    },
  },
  PRO: {
    name: 'Pro',
    limits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000,
    },
  },
  TEAM: {
    name: 'Team',
    limits: {
      perMinute: 120,
      perHour: 5000,
      perDay: 50000,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    limits: {
      perMinute: 300,
      perHour: 20000,
      perDay: 200000,
    },
  },
};

// Endpoint-specific limits
export const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints - stricter limits
  '/api/v1/auth/login': {
    windowSeconds: 300, // 5 minutes
    maxRequests: 5,
    identifier: 'ip',
  },
  '/api/v1/auth/register': {
    windowSeconds: 3600, // 1 hour
    maxRequests: 3,
    identifier: 'ip',
  },
  
  // Sync endpoints - higher limits
  '/api/v1/sync/insight': {
    windowSeconds: 60, // 1 minute
    maxRequests: 10,
    identifier: 'apiKey',
  },
  '/api/v1/sync/autopilot': {
    windowSeconds: 60,
    maxRequests: 10,
    identifier: 'apiKey',
  },
  '/api/v1/sync/guardian': {
    windowSeconds: 60,
    maxRequests: 10,
    identifier: 'apiKey',
  },
  
  // Storage endpoints - moderate limits
  '/api/v1/storage/upload-url': {
    windowSeconds: 60,
    maxRequests: 20,
    identifier: 'organization',
  },
  
  // Analytics endpoints - lower limits (expensive queries)
  '/api/v1/analytics/query': {
    windowSeconds: 60,
    maxRequests: 5,
    identifier: 'organization',
  },
  
  // Reports endpoints
  '/api/v1/reports': {
    windowSeconds: 60,
    maxRequests: 15,
    identifier: 'organization',
  },
};

/**
 * Rate limit middleware
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  // Get identifier
  const identifier = getIdentifier(request, config?.identifier || 'ip');
  
  if (!identifier) {
    return NextResponse.json(
      { error: 'Unable to determine rate limit identifier' },
      { status: 400 }
    );
  }
  
  // Get config (use endpoint-specific or provided)
  const pathname = new URL(request.url).pathname;
  const limitConfig = config || ENDPOINT_LIMITS[pathname] || {
    windowSeconds: 60,
    maxRequests: 60, // Default: 60 requests per minute
    identifier: 'ip',
  };
  
  // Check rate limit
  const result = await cacheService.checkRateLimit(identifier, {
    windowSeconds: limitConfig.windowSeconds,
    maxRequests: limitConfig.maxRequests,
  });
  
  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limitConfig.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toISOString());
  
  // Check if rate limit exceeded
  if (!result.allowed) {
    headers.set('Retry-After', (result.retryAfter || 60).toString());
    
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please retry after ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        resetAt: result.resetAt.toISOString(),
      },
      {
        status: 429,
        headers,
      }
    );
  }
  
  // Rate limit passed, add headers to continue
  return null;
}

/**
 * Get identifier for rate limiting
 */
function getIdentifier(request: NextRequest, type: 'ip' | 'apiKey' | 'organization'): string | null {
  switch (type) {
    case 'ip':
      return getClientIP(request);
    
    case 'apiKey':
      return getAPIKey(request);
    
    case 'organization':
      return getOrganizationId(request);
    
    default:
      return null;
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string | null {
  // Try various headers
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // CloudFlare
    'x-vercel-forwarded-for', // Vercel
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can be comma-separated, take first
      return value.split(',')[0].trim();
    }
  }
  
  return null;
}

/**
 * Get API key from request
 */
function getAPIKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Get organization ID from request
 */
function getOrganizationId(request: NextRequest): string | null {
  return request.headers.get('x-organization-id');
}

/**
 * Rate limit decorator for API routes
 */
export function withRateLimit(config?: RateLimitConfig) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      // Check rate limit
      const rateLimitResponse = await rateLimitMiddleware(request, config);
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
      
      // Continue to handler
      return handler(request);
    };
  };
}

/**
 * Get rate limit info for user/organization
 */
export async function getRateLimitInfo(
  identifier: string,
  tier: keyof typeof RATE_LIMIT_TIERS = 'FREE'
): Promise<{
  tier: string;
  limits: {
    perMinute: { limit: number; remaining: number; resetAt: Date };
    perHour: { limit: number; remaining: number; resetAt: Date };
    perDay: { limit: number; remaining: number; resetAt: Date };
  };
}> {
  const tierConfig = RATE_LIMIT_TIERS[tier];
  
  // Check each time window
  const perMinute = await cacheService.checkRateLimit(`${identifier}:minute`, {
    windowSeconds: 60,
    maxRequests: tierConfig.limits.perMinute,
  });
  
  const perHour = await cacheService.checkRateLimit(`${identifier}:hour`, {
    windowSeconds: 3600,
    maxRequests: tierConfig.limits.perHour,
  });
  
  const perDay = await cacheService.checkRateLimit(`${identifier}:day`, {
    windowSeconds: 86400,
    maxRequests: tierConfig.limits.perDay,
  });
  
  return {
    tier: tierConfig.name,
    limits: {
      perMinute: {
        limit: tierConfig.limits.perMinute,
        remaining: perMinute.remaining,
        resetAt: perMinute.resetAt,
      },
      perHour: {
        limit: tierConfig.limits.perHour,
        remaining: perHour.remaining,
        resetAt: perHour.resetAt,
      },
      perDay: {
        limit: tierConfig.limits.perDay,
        remaining: perDay.remaining,
        resetAt: perDay.resetAt,
      },
    },
  };
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  await cacheService.delete(identifier, { namespace: CacheNamespace.RATE_LIMIT });
  await cacheService.delete(`${identifier}:minute`, { namespace: CacheNamespace.RATE_LIMIT });
  await cacheService.delete(`${identifier}:hour`, { namespace: CacheNamespace.RATE_LIMIT });
  await cacheService.delete(`${identifier}:day`, { namespace: CacheNamespace.RATE_LIMIT });
}

/**
 * Increment rate limit counter (for manual tracking)
 */
export async function incrementRateLimit(
  identifier: string,
  windowSeconds: number
): Promise<number> {
  const key = `${identifier}:${windowSeconds}`;
  
  return cacheService.increment(key, 1, {
    namespace: CacheNamespace.RATE_LIMIT,
    ttl: windowSeconds,
  });
}

/**
 * Check if rate limit would be exceeded (without incrementing)
 */
export async function wouldExceedRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<boolean> {
  const result = await cacheService.checkRateLimit(identifier, {
    windowSeconds: config.windowSeconds,
    maxRequests: config.maxRequests,
  });
  
  return !result.allowed;
}
