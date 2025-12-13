/**
 * JWT Authentication Middleware
 * Phase 3.0.3: Authentication & Plan Binding
 * 
 * Validates JWT tokens from Authorization header and attaches
 * authenticated user to request context.
 * 
 * @module jwt.middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { prisma } from '../prisma';
import type { SubscriptionTier } from '@prisma/client';

/**
 * JWT Secret from environment
 * Must be set in .env: JWT_SECRET=<your-secret-key>
 */
const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.warn('[Auth] JWT_SECRET not set - authentication will fail');
}

/**
 * Authenticated user data attached to request
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  plan: SubscriptionTier;
  name?: string;
}

/**
 * Extended JWT payload with user data
 */
export interface UserJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Request with authenticated user attached
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Error response for authentication failures
 */
interface AuthErrorResponse {
  success: false;
  error: string;
  message: string;
}

/**
 * Extract JWT token from Authorization header
 * 
 * @param req - Next.js request object
 * @returns JWT token string or null if not found
 * 
 * @example
 * const token = extractToken(req);
 * // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Verify JWT token and extract payload
 * 
 * @param token - JWT token string
 * @returns Decoded JWT payload or null if invalid
 * 
 * @throws {Error} If JWT_SECRET not configured
 * 
 * @example
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log(payload.userId); // "user-123"
 * }
 */
function verifyToken(token: string): UserJwtPayload | null {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  try {
    const decoded = verify(token, JWT_SECRET) as UserJwtPayload;
    
    // Validate required fields
    if (!decoded.userId || !decoded.email) {
      console.warn('[Auth] JWT missing required fields:', decoded);
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      console.warn('[Auth] JWT verification failed:', error.message);
    }
    return null;
  }
}

/**
 * Fetch user from database and return with plan
 * 
 * @param userId - User ID from JWT payload
 * @returns Authenticated user with plan or null if not found
 * 
 * @example
 * const user = await getUserWithPlan('user-123');
 * console.log(user?.plan); // "FREE"
 */
async function getUserWithPlan(userId: string): Promise<AuthenticatedUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan: true,
        name: true,
      },
    });
    
    if (!user) {
      return null;
    }
    
    return {
      userId: user.id,
      email: user.email,
      plan: user.plan,
      name: user.name || undefined,
    };
  } catch (error) {
    console.error('[Auth] Database error fetching user:', error);
    return null;
  }
}

/**
 * Authenticate request and attach user to context
 * 
 * Validates JWT token from Authorization header, verifies user exists
 * in database, and attaches authenticated user to request object.
 * 
 * @param req - Next.js request object
 * @returns Authenticated user or null if authentication fails
 * 
 * @example
 * const user = await authenticateRequest(req);
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * console.log(user.plan); // "PRO"
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  // Step 1: Extract token from header
  const token = extractToken(req);
  
  if (!token) {
    return null;
  }
  
  // Step 2: Verify JWT signature and decode payload
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  // Step 3: Fetch user from database with plan
  const user = await getUserWithPlan(payload.userId);
  
  if (!user) {
    console.warn('[Auth] User not found in database:', payload.userId);
    return null;
  }
  
  return user;
}

/**
 * Higher-order function for route protection
 * 
 * Wraps a route handler with authentication middleware. Returns 401
 * if authentication fails, otherwise calls handler with authenticated user.
 * 
 * @param handler - Route handler that receives authenticated user
 * @returns Protected route handler
 * 
 * @example
 * export const POST = withAuth(async (req, user) => {
 *   console.log(`Upload from ${user.email} on ${user.plan} plan`);
 *   // ... handle upload
 * });
 */
export function withAuth<T = unknown>(
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>
): (req: NextRequest) => Promise<NextResponse<T | AuthErrorResponse>> {
  return async (req: NextRequest) => {
    const user = await authenticateRequest(req);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required. Please provide a valid JWT token in the Authorization header.',
        } as AuthErrorResponse,
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
}

/**
 * Require specific plan tier for route access
 * 
 * Wraps a route handler with plan-based authorization. Returns 403
 * if user's plan is insufficient.
 * 
 * @param minTier - Minimum required plan tier
 * @param handler - Route handler that receives authenticated user
 * @returns Protected route handler with plan check
 * 
 * @example
 * export const POST = withPlan('PRO', async (req, user) => {
 *   // Only PRO, TEAM, or ENTERPRISE users can access
 * });
 */
export function withPlan<T extends AuthErrorResponse = AuthErrorResponse>(
  minTier: SubscriptionTier,
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>
): (req: NextRequest) => Promise<NextResponse<T | AuthErrorResponse>> {
  const tierOrder: SubscriptionTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
  
  return withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
    const userTierIndex = tierOrder.indexOf(user.plan);
    const minTierIndex = tierOrder.indexOf(minTier);
    
    if (userTierIndex < minTierIndex) {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_PLAN',
          message: `This feature requires ${minTier} plan or higher. Your current plan: ${user.plan}`,
        } as AuthErrorResponse,
        { status: 403 }
      ) as NextResponse<AuthErrorResponse>;
    }
    
    return handler(req, user);
  });
}

/**
 * Generate JWT token for user (for testing/login)
 * 
 * @param userId - User ID
 * @param email - User email
 * @param expiresIn - Token expiration (default: 7 days)
 * @returns Signed JWT token
 * 
 * @example
 * const token = generateToken('user-123', 'user@example.com');
 * // Use in Authorization header: Bearer <token>
 */
export function generateToken(
  userId: string,
  email: string,
  expiresIn: string = '7d'
): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const jwt = require('jsonwebtoken');
  
  return jwt.sign(
    { userId, email } as UserJwtPayload,
    JWT_SECRET,
    { expiresIn }
  );
}
