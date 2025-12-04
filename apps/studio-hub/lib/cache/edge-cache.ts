/**
 * CDN & Edge Caching Configuration
 * Cloudflare-specific optimizations for global performance
 */

import { http } from '../utils/fetch';

// Edge cache configuration
export const EdgeCacheConfig = {
  /**
   * Static assets - cache for 1 year
   */
  staticAssets: {
    paths: [
      '/_next/static/*',
      '/images/*',
      '/fonts/*',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ],
    cacheControl: 'public, max-age=31536000, immutable',
    cloudflareCache: 'cache-everything',
  },

  /**
   * API responses - cache based on endpoint
   */
  api: {
    '/api/trpc/insight.getIssues': {
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
      cloudflareCache: 'cache-everything',
    },
    '/api/trpc/autopilot.getRuns': {
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
      cloudflareCache: 'cache-everything',
    },
    '/api/trpc/guardian.getTests': {
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
      cloudflareCache: 'cache-everything',
    },
    '/api/analytics/*': {
      cacheControl: 'public, s-maxage=300, stale-while-revalidate=600',
      cloudflareCache: 'cache-everything',
    },
  },

  /**
   * Pages - cache with revalidation
   */
  pages: {
    '/': {
      cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
      cloudflareCache: 'cache-everything',
    },
    '/blog/*': {
      cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
      cloudflareCache: 'cache-everything',
    },
    '/docs/*': {
      cacheControl: 'public, s-maxage=1800, stale-while-revalidate=3600',
      cloudflareCache: 'cache-everything',
    },
    '/pricing': {
      cacheControl: 'public, s-maxage=1800, stale-while-revalidate=3600',
      cloudflareCache: 'cache-everything',
    },
  },

  /**
   * No cache - always fresh
   */
  noCache: {
    paths: [
      '/api/auth/*',
      '/dashboard/*',
      '/api/stripe/*',
      '/api/gdpr/*',
    ],
    cacheControl: 'private, no-cache, no-store, must-revalidate',
    cloudflareCache: 'bypass',
  },
};

/**
 * Get cache headers for a given path
 */
export function getCacheHeaders(pathname: string): Record<string, string> {
  // Check no-cache paths first
  for (const path of EdgeCacheConfig.noCache.paths) {
    if (matchPath(pathname, path)) {
      return {
        'Cache-Control': EdgeCacheConfig.noCache.cacheControl,
        'CDN-Cache-Control': EdgeCacheConfig.noCache.cacheControl,
        'Cloudflare-CDN-Cache-Control': EdgeCacheConfig.noCache.cloudflareCache,
      };
    }
  }

  // Check static assets
  for (const path of EdgeCacheConfig.staticAssets.paths) {
    if (matchPath(pathname, path)) {
      return {
        'Cache-Control': EdgeCacheConfig.staticAssets.cacheControl,
        'CDN-Cache-Control': EdgeCacheConfig.staticAssets.cacheControl,
        'Cloudflare-CDN-Cache-Control': EdgeCacheConfig.staticAssets.cloudflareCache,
      };
    }
  }

  // Check API endpoints
  for (const [path, config] of Object.entries(EdgeCacheConfig.api)) {
    if (matchPath(pathname, path)) {
      return {
        'Cache-Control': config.cacheControl,
        'CDN-Cache-Control': config.cacheControl,
        'Cloudflare-CDN-Cache-Control': config.cloudflareCache,
      };
    }
  }

  // Check pages
  for (const [path, config] of Object.entries(EdgeCacheConfig.pages)) {
    if (matchPath(pathname, path)) {
      return {
        'Cache-Control': config.cacheControl,
        'CDN-Cache-Control': config.cacheControl,
        'Cloudflare-CDN-Cache-Control': config.cloudflareCache,
      };
    }
  }

  // Default: no cache
  return {
    'Cache-Control': 'private, no-cache',
    'CDN-Cache-Control': 'no-cache',
    'Cloudflare-CDN-Cache-Control': 'bypass',
  };
}

/**
 * Match path with wildcard support
 */
function matchPath(pathname: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return pathname === pattern;
  }

  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*') + '$'
  );

  return regex.test(pathname);
}

/**
 * Helper: Make Cloudflare API request with error handling
 */
async function makeCloudflareRequest(
  endpoint: string,
  body: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return {
      success: false,
      error: 'Cloudflare credentials not configured',
    };
  }

  try {
    const data = await http.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}${endpoint}`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    ).then(res => res.json());

    if (!data.success) {
      return {
        success: false,
        error: data.errors?.[0]?.message || 'Unknown error',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Purge Cloudflare cache for specific URLs
 */
export async function purgeCloudflareCache(urls: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  return makeCloudflareRequest('/purge_cache', { files: urls });
}

/**
 * Purge everything from Cloudflare cache (use with caution!)
 */
export async function purgeAllCloudflareCache(): Promise<{
  success: boolean;
  error?: string;
}> {
  return makeCloudflareRequest('/purge_cache', { purge_everything: true });
}

/**
 * Get Cloudflare cache analytics
 */
export async function getCloudflareAnalytics(since: Date): Promise<{
  requests: number;
  bandwidth: number;
  cachedRequests: number;
  cacheHitRate: number;
} | null> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return null;
  }

  try {
    const sinceISO = since.toISOString();
    const data = await http.get(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${sinceISO}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    ).then(res => res.json());

    if (!data.success) {
      return null;
    }

    const result = data.result.totals;

    return {
      requests: result.requests.all,
      bandwidth: result.bandwidth.all,
      cachedRequests: result.requests.cached,
      cacheHitRate: result.requests.cached / result.requests.all,
    };
  } catch (error) {
    return null;
  }
}
