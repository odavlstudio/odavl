// Simple in-memory rate limiter for ODAVL API endpoints
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; 

export function rateLimit(ip: string): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitMap.delete(ip);
  }

  const currentEntry = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (currentEntry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetTime: currentEntry.resetTime };
  }

  currentEntry.count++;
  rateLimitMap.set(ip, currentEntry);

  return { 
    success: true, 
    remaining: MAX_REQUESTS - currentEntry.count, 
    resetTime: currentEntry.resetTime 
  };
}

export function getRateLimitHeaders(remaining: number, resetTime: number) {
  return {
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}