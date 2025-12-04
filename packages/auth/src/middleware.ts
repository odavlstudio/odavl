import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type TokenPayload } from './jwt';

export interface AuthRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware to require authentication
 * Usage: export const GET = requireAuth(async (req: AuthRequest) => { ... })
 */
export function requireAuth(
  handler: (req: AuthRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Also check cookies for browser requests
    const cookieToken = req.cookies.get('accessToken')?.value;
    const finalToken = token || cookieToken;

    if (!finalToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(finalToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Attach user to request
    const authReq = req as AuthRequest;
    authReq.user = payload;

    return handler(authReq);
  };
}

/**
 * Middleware for optional authentication
 */
export function optionalAuth(
  handler: (req: AuthRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const cookieToken = req.cookies.get('accessToken')?.value;
    const finalToken = token || cookieToken;

    if (finalToken) {
      const payload = verifyToken(finalToken);
      if (payload) {
        const authReq = req as AuthRequest;
        authReq.user = payload;
      }
    }

    return handler(req as AuthRequest);
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(roles: string | string[]) {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (handler: (req: AuthRequest) => Promise<NextResponse>) => {
    return requireAuth(async (req: AuthRequest) => {
      if (!req.user || !roleArray.includes(req.user.role)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Rate limiter for authentication endpoints
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      const identifier = req.headers.get('x-forwarded-for') || 
                        req.headers.get('x-real-ip') || 
                        'unknown';

      const now = Date.now();
      const record = rateLimitMap.get(identifier);

      if (record) {
        if (now < record.resetAt) {
          if (record.count >= maxAttempts) {
            return NextResponse.json(
              { error: 'Too Many Requests', message: 'Please try again later' },
              { status: 429 }
            );
          }
          record.count++;
        } else {
          // Reset window
          rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
        }
      } else {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
      }

      return handler(req);
    };
  };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now >= value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}
