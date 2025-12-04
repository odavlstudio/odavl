// Cache control strategies for different content types

export type CacheStrategy = 
  | 'static-assets'
  | 'api-data'
  | 'user-content'
  | 'public-content'
  | 'dynamic'
  | 'no-cache';

export interface CacheConfig {
  'Cache-Control': string;
  'CDN-Cache-Control'?: string;
  'Vercel-CDN-Cache-Control'?: string;
  'Surrogate-Control'?: string;
  'Vary'?: string;
  'Pragma'?: string;
  'Expires'?: string;
}

export const cacheStrategies: Record<CacheStrategy, CacheConfig> = {
  // Static assets (JS, CSS, images with hashes)
  'static-assets': {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000',
  },
  
  // API data that changes frequently
  'api-data': {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'CDN-Cache-Control': 'no-store',
  },
  
  // User-specific content
  'user-content': {
    'Cache-Control': 'private, max-age=300', // 5 minutes
    'Vary': 'Cookie, Authorization',
  },
  
  // Public content (blog posts, docs)
  'public-content': {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // 1 hour, 1 day SWR
    'CDN-Cache-Control': 'public, s-maxage=3600',
  },
  
  // Dynamic content with short cache
  'dynamic': {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // 1 min, 5 min SWR
    'CDN-Cache-Control': 'public, s-maxage=60',
  },
  
  // No caching
  'no-cache': {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

export function getCacheHeaders(strategy: CacheStrategy): Record<string, string> {
  return cacheStrategies[strategy] as unknown as Record<string, string>;
}

// Helper for stale-while-revalidate pattern
export function swr(maxAge: number, staleTime: number): CacheConfig {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleTime}`,
    'CDN-Cache-Control': `public, s-maxage=${maxAge}`,
  };
}

// Helper for private content with revalidation
export function privateCache(maxAge: number): CacheConfig {
  return {
    'Cache-Control': `private, max-age=${maxAge}`,
    'Vary': 'Cookie, Authorization',
  };
}

// Edge cache tags for selective invalidation
export function addCacheTags(headers: HeadersInit, tags: string[]): HeadersInit {
  return {
    ...headers,
    'Cache-Tag': tags.join(','),
    'Surrogate-Key': tags.join(' '),
  };
}

// Purge cache by tags (Cloudflare, Fastly, etc.)
export async function purgeCacheTags(tags: string[]): Promise<void> {
  if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      }
    );
  }
}
