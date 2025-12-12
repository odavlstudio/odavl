/**
 * ODAVL Cloud Console - API Middleware
 * Batch 2: Core Cloud API Infrastructure
 * 
 * Provides: JWT auth, rate limiting, logging, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Import authOptions type from route - actual import happens at runtime
type AuthOptions = Parameters<typeof getServerSession>[0];

// ============================================================================
// Types
// ============================================================================

export interface MiddlewareContext {
  userId?: string;
  email?: string;
  organizationId?: string;
  requestId: string;
  startTime: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Logger Utility
// ============================================================================

export class APILogger {
  static log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    
    // In production, send to monitoring service (Sentry, Datadog, etc.)
    console.log(JSON.stringify(logEntry));
  }

  static info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  static warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  static error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }
}

// ============================================================================
// Rate Limiting (In-Memory - Replace with Redis in production)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // First request or expired window
      const resetAt = now + config.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: config.maxRequests - 1, resetAt };
    }

    if (entry.count >= config.maxRequests) {
      // Limit exceeded
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

const rateLimiter = new RateLimiter();

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Authenticate request using NextAuth session
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // Dynamic import to avoid circular dependency
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    APILogger.warn('Unauthorized request', { path: req.nextUrl.pathname });
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid session required' },
      { status: 401 }
    );
  }

  const ctx: MiddlewareContext = {
    userId: session.user.email, // Will map to DB userId after Prisma integration
    email: session.user.email,
    requestId: crypto.randomUUID(),
    startTime: Date.now(),
  };

  APILogger.info('Authenticated request', {
    requestId: ctx.requestId,
    userId: ctx.userId,
    path: req.nextUrl.pathname,
  });

  return handler(req, ctx);
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(
  req: NextRequest,
  ctx: MiddlewareContext,
  config: RateLimitConfig,
  handler: (req: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const key = `${ctx.userId}:${req.nextUrl.pathname}`;
  const result = rateLimiter.check(key, config);

  const response = result.allowed
    ? await handler(req, ctx)
    : NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests' },
        { status: 429 }
      );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  return response;
}

/**
 * Logging middleware - tracks request/response timing
 */
export async function withLogging(
  req: NextRequest,
  ctx: MiddlewareContext,
  handler: (req: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await handler(req, ctx);
  const duration = Date.now() - ctx.startTime;

  APILogger.info('Request completed', {
    requestId: ctx.requestId,
    userId: ctx.userId,
    method: req.method,
    path: req.nextUrl.pathname,
    status: response.status,
    duration,
  });

  return response;
}

/**
 * Validation middleware using Zod schemas
 */
export async function withValidation<T>(
  req: NextRequest,
  schema: { parse: (data: unknown) => T },
  handler: (req: NextRequest, body: T, ctx: MiddlewareContext) => Promise<NextResponse>,
  ctx: MiddlewareContext
): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    return handler(req, validated, ctx);
  } catch (err) {
    const error = err as Error;
    APILogger.warn('Validation failed', {
      requestId: ctx.requestId,
      error: error.message,
      path: req.nextUrl.pathname,
    });

    return NextResponse.json(
      { error: 'Validation failed', message: error.message },
      { status: 400 }
    );
  }
}

/**
 * Error handling wrapper
 */
export async function withErrorHandling(
  req: NextRequest,
  ctx: MiddlewareContext,
  handler: (req: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler(req, ctx);
  } catch (err) {
    const error = err as Error;
    APILogger.error('Unhandled error', {
      requestId: ctx.requestId,
      userId: ctx.userId,
      path: req.nextUrl.pathname,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'An unexpected error occurred',
        requestId: ctx.requestId 
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Composition Helper
// ============================================================================

/**
 * Compose multiple middleware functions
 * Usage: composeMiddleware(withAuth, withRateLimit, withLogging)
 */
export function composeMiddleware(
  ...middlewares: Array<
    (req: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse>
  >
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let ctx: MiddlewareContext = {
      requestId: crypto.randomUUID(),
      startTime: Date.now(),
    };

    let response: NextResponse | null = null;

    for (const middleware of middlewares) {
      response = await middleware(req, ctx);
      if (response.status !== 200) break; // Stop on error
    }

    return response!;
  };
}
