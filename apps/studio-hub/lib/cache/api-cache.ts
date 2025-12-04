/**
 * API Response Caching Middleware
 * Caches GET requests for improved performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  cacheGet, 
  cacheSet, 
  CachePrefix, 
  CacheTTL 
} from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

/**
 * Cache configuration per route
 */
const CACHE_CONFIG: Record<string, { ttl: number; keyFn?: (req: NextRequest) => string }> = {
  '/api/trpc/insight.getIssues': {
    ttl: CacheTTL.SHORT, // 1 minute
    keyFn: (req) => {
      const url = new URL(req.url);
      const projectId = url.searchParams.get('projectId');
      return `${CachePrefix.API_RESPONSE}insight:issues:${projectId}`;
    },
  },
  '/api/trpc/autopilot.getRuns': {
    ttl: CacheTTL.SHORT,
    keyFn: (req) => {
      const url = new URL(req.url);
      const projectId = url.searchParams.get('projectId');
      return `${CachePrefix.API_RESPONSE}autopilot:runs:${projectId}`;
    },
  },
  '/api/trpc/guardian.getTests': {
    ttl: CacheTTL.SHORT,
    keyFn: (req) => {
      const url = new URL(req.url);
      const projectId = url.searchParams.get('projectId');
      return `${CachePrefix.API_RESPONSE}guardian:tests:${projectId}`;
    },
  },
  '/api/trpc/analytics.getMetrics': {
    ttl: CacheTTL.MEDIUM, // 5 minutes
    keyFn: (req) => {
      const url = new URL(req.url);
      const orgId = url.searchParams.get('orgId');
      const range = url.searchParams.get('range') || '7d';
      return `${CachePrefix.API_RESPONSE}analytics:metrics:${orgId}:${range}`;
    },
  },
  '/api/organizations': {
    ttl: CacheTTL.MEDIUM,
    keyFn: (req) => {
      const url = new URL(req.url);
      const userId = req.headers.get('x-user-id');
      return `${CachePrefix.API_RESPONSE}orgs:${userId}`;
    },
  },
  '/api/projects': {
    ttl: CacheTTL.SHORT,
    keyFn: (req) => {
      const url = new URL(req.url);
      const orgId = url.searchParams.get('orgId');
      return `${CachePrefix.API_RESPONSE}projects:${orgId}`;
    },
  },
};

/**
 * Check if route should be cached
 */
function shouldCache(req: NextRequest): boolean {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return false;
  }
  
  // Check if route has cache configuration
  const pathname = new URL(req.url).pathname;
  return pathname in CACHE_CONFIG;
}

/**
 * Generate cache key for request
 */
function getCacheKey(req: NextRequest): string {
  const pathname = new URL(req.url).pathname;
  const config = CACHE_CONFIG[pathname];
  
  if (config?.keyFn) {
    return config.keyFn(req);
  }
  
  // Default: Use full URL as key
  return `${CachePrefix.API_RESPONSE}${req.url}`;
}

/**
 * Get cache TTL for request
 */
function getCacheTTL(req: NextRequest): number {
  const pathname = new URL(req.url).pathname;
  const config = CACHE_CONFIG[pathname];
  
  return config?.ttl || CacheTTL.MEDIUM;
}

/**
 * API caching middleware
 */
export async function apiCacheMiddleware(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip caching if disabled
  if (process.env.DISABLE_API_CACHE === 'true') {
    return handler();
  }
  
  // Skip caching for non-cacheable routes
  if (!shouldCache(req)) {
    return handler();
  }
  
  const cacheKey = getCacheKey(req);
  
  try {
    // Try to get from cache
    const cached = await cacheGet<{
      status: number;
      headers: Record<string, string>;
      body: unknown;
    }>(cacheKey);
    
    if (cached) {
      logger.debug('Cache hit', {
        key: cacheKey,
        url: req.url,
      });
      
      // Return cached response
      return new NextResponse(JSON.stringify(cached.body), {
        status: cached.status,
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
    
    // Cache miss - execute handler
    logger.debug('Cache miss', {
      key: cacheKey,
      url: req.url,
    });
    
    const response = await handler();
    
    // Only cache successful responses
    if (response.status === 200) {
      const body = await response.clone().json();
      const ttl = getCacheTTL(req);
      
      // Store in cache
      await cacheSet(
        cacheKey,
        {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body,
        },
        ttl
      );
      
      logger.debug('Response cached', {
        key: cacheKey,
        ttl,
      });
      
      // Add cache headers
      const headers = new Headers(response.headers);
      headers.set('X-Cache', 'MISS');
      headers.set('Cache-Control', `public, max-age=${ttl}`);
      
      return new NextResponse(JSON.stringify(body), {
        status: response.status,
        headers,
      });
    }
    
    return response;
  } catch (error) {
    logger.error('API cache middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url,
    });
    
    // On error, bypass cache
    return handler();
  }
}

/**
 * Invalidate cache for specific entity
 */
export async function invalidateApiCache(
  prefix: string,
  entityId?: string
): Promise<void> {
  const pattern = entityId
    ? `${CachePrefix.API_RESPONSE}${prefix}:${entityId}:*`
    : `${CachePrefix.API_RESPONSE}${prefix}:*`;
  
  try {
    const { redis } = await import('@/lib/cache/redis');
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      
      logger.info('API cache invalidated', {
        pattern,
        keysDeleted: keys.length,
      });
    }
  } catch (error) {
    logger.error('Failed to invalidate API cache', {
      pattern,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Clear all API cache
 */
export async function clearApiCache(): Promise<number> {
  try {
    const { redis } = await import('@/lib/cache/redis');
    const keys = await redis.keys(`${CachePrefix.API_RESPONSE}*`);
    
    if (keys.length === 0) {
      return 0;
    }
    
    await redis.del(...keys);
    
    logger.info('All API cache cleared', {
      keysDeleted: keys.length,
    });
    
    return keys.length;
  } catch (error) {
    logger.error('Failed to clear API cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}
