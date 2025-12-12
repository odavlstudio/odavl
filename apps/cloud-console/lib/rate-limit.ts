/**
 * Rate Limiting Middleware for ODAVL Cloud Console
 * Prevents API abuse and DDoS attacks
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

/**
 * Rate limiter middleware factory
 */
export function rateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, message = 'Too many requests' } = config;

  return async (request: NextRequest) => {
    // Get client identifier (IP or user ID)
    const identifier = getClientIdentifier(request);
    const now = Date.now();

    // Clean up expired entries
    if (store[identifier] && now > store[identifier].resetTime) {
      delete store[identifier];
    }

    // Initialize or update counter
    if (!store[identifier]) {
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[identifier].count++;
    }

    // Check if limit exceeded
    if (store[identifier].count > maxRequests) {
      return NextResponse.json(
        { error: message, retryAfter: store[identifier].resetTime - now },
        { status: 429 }
      );
    }

    return null; // Allow request
  };
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // Strict: 10 requests per minute
  strict: rateLimit({ maxRequests: 10, windowMs: 60 * 1000 }),
  
  // Standard: 50 requests per minute
  standard: rateLimit({ maxRequests: 50, windowMs: 60 * 1000 }),
  
  // Generous: 200 requests per minute
  generous: rateLimit({ maxRequests: 200, windowMs: 60 * 1000 }),
};
