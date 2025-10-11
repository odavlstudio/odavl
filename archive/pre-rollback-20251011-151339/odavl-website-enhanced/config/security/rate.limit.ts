// ODAVL-WAVE-X4-INJECT: Rate limiting with sliding window algorithm
// @odavl-governance: SECURITY-SAFE mode active
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

const defaultConfig = { windowMs: 60000, maxRequests: 500, blockDurationMs: 60000 };
const requestCounts = new Map<string, { count: number; windowStart: number; blocked?: number }>();

export function checkRateLimit(identifier: string, config = defaultConfig): RateLimitResult {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;
  const existing = requestCounts.get(key);

  if (existing?.blocked && now < existing.blocked) {
    return {
      allowed: false, remaining: 0, resetTime: existing.blocked,
      retryAfter: Math.ceil((existing.blocked - now) / 1000)
    };
  }

  if (!existing || now - existing.windowStart >= config.windowMs) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  existing.count++;
  if (existing.count > config.maxRequests) {
    existing.blocked = now + config.blockDurationMs;
    return { 
      allowed: false, remaining: 0, resetTime: existing.blocked, 
      retryAfter: Math.ceil(config.blockDurationMs / 1000) 
    };
  }

  return { allowed: true, remaining: config.maxRequests - existing.count, resetTime: existing.windowStart + config.windowMs };
}