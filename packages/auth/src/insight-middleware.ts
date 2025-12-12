/**
 * Insight API Middleware - Protect Insight Cloud APIs with ODAVL ID
 * 
 * Provides authentication middleware for Next.js API routes.
 * Verifies access tokens and attaches user session to request.
 * 
 * Usage:
 * ```typescript
 * export const POST = withInsightAuth(async (req) => {
 *   const { session } = req;
 *   // session is guaranteed to exist here
 *   return NextResponse.json({ userId: session.userId });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyOdavlToken, type OdavlSession } from './odavl-id.js';

/**
 * Request with attached ODAVL session
 * Use this type in protected route handlers
 */
export interface InsightAuthRequest extends NextRequest {
  /**
   * Verified user session
   * Guaranteed to exist in withInsightAuth handlers
   */
  session: OdavlSession;
}

/**
 * Route handler with session context
 * Type for handlers wrapped with withInsightAuth
 */
export type InsightAuthHandler = (
  req: InsightAuthRequest
) => Promise<NextResponse>;

/**
 * Options for authentication middleware
 */
export interface InsightAuthOptions {
  /**
   * Allow requests without authentication
   * If true, session will be undefined if no token provided
   * Default: false (require authentication)
   */
  optional?: boolean;
  
  /**
   * Custom error response for unauthorized requests
   */
  onUnauthorized?: (req: NextRequest) => NextResponse;
}

/**
 * Middleware to require ODAVL ID authentication
 * 
 * Extracts token from:
 * 1. Authorization header (Bearer token)
 * 2. Cookie (accessToken)
 * 
 * If token valid, attaches session to request.
 * If invalid/missing, returns 401 Unauthorized.
 * 
 * @param handler Route handler with session context
 * @param options Authentication options
 * @returns Next.js API route handler
 * 
 * @example
 * ```typescript
 * // Require authentication
 * export const POST = withInsightAuth(async (req) => {
 *   const { session } = req;
 *   console.log(`User: ${session.name} (${session.insightPlanId})`);
 *   return NextResponse.json({ success: true });
 * });
 * 
 * // Optional authentication
 * export const GET = withInsightAuth(
 *   async (req) => {
 *     const { session } = req;
 *     if (session) {
 *       return NextResponse.json({ userId: session.userId });
 *     }
 *     return NextResponse.json({ userId: null });
 *   },
 *   { optional: true }
 * );
 * ```
 */
export function withInsightAuth(
  handler: InsightAuthHandler,
  options: InsightAuthOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    let token: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
    
    // Fallback to cookie (for browser requests)
    if (!token) {
      token = req.cookies.get('accessToken')?.value;
    }
    
    // No token provided
    if (!token) {
      if (options.optional) {
        // Allow without authentication
        return handler(req as InsightAuthRequest);
      }
      
      // Require authentication
      if (options.onUnauthorized) {
        return options.onUnauthorized(req);
      }
      
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Authentication required. Please provide a valid access token.',
          code: 'MISSING_TOKEN'
        },
        { status: 401 }
      );
    }
    
    // Verify token and extract session
    const session = verifyOdavlToken(token);
    
    if (!session) {
      if (options.optional) {
        // Allow with invalid token (session = undefined)
        return handler(req as InsightAuthRequest);
      }
      
      // Token invalid or expired
      if (options.onUnauthorized) {
        return options.onUnauthorized(req);
      }
      
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or expired access token. Please log in again.',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }
    
    // Attach session to request
    (req as InsightAuthRequest).session = session;
    
    // Call handler with authenticated request
    return handler(req as InsightAuthRequest);
  };
}

/**
 * Middleware to require specific Insight plan
 * 
 * Wraps withInsightAuth and checks plan entitlement.
 * 
 * @param requiredPlan Minimum plan required (or array of allowed plans)
 * @param handler Route handler
 * @returns Next.js API route handler
 * 
 * @example
 * ```typescript
 * // Require Pro or higher
 * export const POST = withInsightPlan('INSIGHT_PRO', async (req) => {
 *   // Only PRO, TEAM, ENTERPRISE can reach here
 *   return NextResponse.json({ success: true });
 * });
 * 
 * // Allow specific plans only
 * export const POST = withInsightPlan(
 *   ['INSIGHT_TEAM', 'INSIGHT_ENTERPRISE'],
 *   async (req) => {
 *     // Only TEAM and ENTERPRISE can reach here
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function withInsightPlan(
  requiredPlan: import('./odavl-id.js').InsightPlanId | import('./odavl-id.js').InsightPlanId[],
  handler: InsightAuthHandler
): (req: NextRequest) => Promise<NextResponse> {
  return withInsightAuth(async (req) => {
    const { session } = req;
    
    // Check if user's plan meets requirement
    const allowedPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan];
    
    if (!allowedPlans.includes(session.insightPlanId)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `This feature requires ${allowedPlans.join(' or ')} plan.`,
          code: 'INSUFFICIENT_PLAN',
          currentPlan: session.insightPlanId,
          requiredPlan: allowedPlans
        },
        { status: 403 }
      );
    }
    
    return handler(req);
  });
}

/**
 * Middleware to require organization membership
 * 
 * Useful for team-only features (TEAM and ENTERPRISE plans).
 * 
 * @param handler Route handler
 * @returns Next.js API route handler
 * 
 * @example
 * ```typescript
 * export const POST = withOrganization(async (req) => {
 *   const { session } = req;
 *   console.log(`Organization: ${session.organizationId}`);
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withOrganization(
  handler: InsightAuthHandler
): (req: NextRequest) => Promise<NextResponse> {
  return withInsightAuth(async (req) => {
    const { session } = req;
    
    if (!session.organizationId) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'This feature requires organization membership (TEAM or ENTERPRISE plan).',
          code: 'NOT_ORGANIZATION_MEMBER',
          currentPlan: session.insightPlanId
        },
        { status: 403 }
      );
    }
    
    return handler(req);
  });
}

/**
 * Extract session from request (for manual usage)
 * 
 * Use this in middleware or when you can't use withInsightAuth wrapper.
 * 
 * @param req Next.js request
 * @returns Session or null if not authenticated
 * 
 * @example
 * ```typescript
 * // In middleware.ts
 * export function middleware(req: NextRequest) {
 *   const session = getSessionFromRequest(req);
 *   if (!session) {
 *     return NextResponse.redirect('/login');
 *   }
 *   return NextResponse.next();
 * }
 * ```
 */
export function getSessionFromRequest(req: NextRequest): OdavlSession | null {
  // Extract token (same logic as withInsightAuth)
  const authHeader = req.headers.get('authorization');
  let token: string | undefined;
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  if (!token) {
    token = req.cookies.get('accessToken')?.value;
  }
  
  if (!token) {
    return null;
  }
  
  return verifyOdavlToken(token);
}
