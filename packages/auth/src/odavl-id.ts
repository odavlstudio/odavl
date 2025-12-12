/**
 * ODAVL ID - Unified Authentication Identity
 * 
 * One authentication identity across all Insight touchpoints:
 * - Cloud backend (API protection)
 * - CLI (device code flow)
 * - VS Code extension (SecretStorage)
 * - SDK (token-based client)
 * 
 * Built on top of existing JWT infrastructure with Insight-specific enhancements.
 */

import type { TokenPayload, TokenPair } from './jwt.js';
import { generateTokens, verifyToken } from './jwt.js';

/**
 * Insight plan identifiers (matches product config)
 */
export type InsightPlanId = 
  | 'INSIGHT_FREE' 
  | 'INSIGHT_PRO' 
  | 'INSIGHT_TEAM' 
  | 'INSIGHT_ENTERPRISE';

/**
 * Branded type for ODAVL User ID
 * Provides type safety to prevent mixing user IDs with other strings
 */
export type OdavlUserId = string & { readonly __brand: 'OdavlUserId' };

/**
 * Create branded OdavlUserId from string
 */
export function createOdavlUserId(id: string): OdavlUserId {
  return id as OdavlUserId;
}

/**
 * Enhanced token payload with Insight-specific fields
 * Extends base TokenPayload from jwt.ts
 */
export interface OdavlTokenPayload extends TokenPayload {
  /**
   * User display name
   */
  name: string;
  
  /**
   * Current Insight plan subscription
   * Undefined for users without Insight subscription (default to FREE)
   */
  insightPlanId?: InsightPlanId;
  
  /**
   * Organization ID for team plans
   * Undefined for individual plans (FREE, PRO)
   */
  organizationId?: string;
  
  /**
   * Account creation timestamp (ISO 8601)
   */
  createdAt: string;
}

/**
 * ODAVL session with full user context
 * Used after token verification in middleware and services
 */
export interface OdavlSession {
  /**
   * Branded user ID
   */
  userId: OdavlUserId;
  
  /**
   * User email (verified)
   */
  email: string;
  
  /**
   * User display name
   */
  name: string;
  
  /**
   * User role (from base TokenPayload)
   */
  role: string;
  
  /**
   * Current Insight plan (defaults to FREE if undefined)
   */
  insightPlanId: InsightPlanId;
  
  /**
   * Organization ID (undefined for individual plans)
   */
  organizationId?: string;
  
  /**
   * Account creation timestamp
   */
  createdAt: Date;
  
  /**
   * Token expiration timestamp (from JWT exp claim)
   */
  expiresAt?: Date;
}

/**
 * Input for generating ODAVL ID tokens
 * All fields required except optional organization
 */
export interface OdavlTokenInput {
  userId: string;
  email: string;
  name: string;
  role: string;
  insightPlanId?: InsightPlanId;
  organizationId?: string;
  createdAt: Date;
}

/**
 * Generate ODAVL ID tokens with Insight context
 * 
 * Creates access token (15min) + refresh token (7d) with full user context.
 * 
 * @param input User data for token generation
 * @returns Token pair (access + refresh)
 * 
 * @example
 * ```typescript
 * const tokens = generateOdavlTokens({
 *   userId: 'user_123',
 *   email: 'dev@odavl.com',
 *   name: 'Developer',
 *   role: 'user',
 *   insightPlanId: 'INSIGHT_PRO',
 *   createdAt: new Date()
 * });
 * ```
 */
export function generateOdavlTokens(input: OdavlTokenInput): TokenPair {
  const payload: OdavlTokenPayload = {
    userId: input.userId,
    email: input.email,
    name: input.name,
    role: input.role,
    insightPlanId: input.insightPlanId,
    organizationId: input.organizationId,
    createdAt: input.createdAt.toISOString(),
  };
  
  return generateTokens(payload);
}

/**
 * Verify ODAVL ID token and extract session
 * 
 * Validates JWT signature and expiration, then constructs full session object.
 * 
 * @param token Access token to verify
 * @returns Session object or null if invalid/expired
 * 
 * @example
 * ```typescript
 * const session = verifyOdavlToken(token);
 * if (session) {
 *   console.log(`User: ${session.name} (${session.insightPlanId})`);
 * }
 * ```
 */
export function verifyOdavlToken(token: string): OdavlSession | null {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }
  
  // Cast to OdavlTokenPayload (assumes enhanced payload)
  const odavlPayload = payload as OdavlTokenPayload;
  
  // Validate required Insight-specific fields
  if (!odavlPayload.name) {
    console.error('[ODAVL ID] Token missing required field: name');
    return null;
  }
  
  return {
    userId: createOdavlUserId(odavlPayload.userId),
    email: odavlPayload.email,
    name: odavlPayload.name,
    role: odavlPayload.role,
    insightPlanId: odavlPayload.insightPlanId || 'INSIGHT_FREE',
    organizationId: odavlPayload.organizationId,
    createdAt: new Date(odavlPayload.createdAt),
    expiresAt: odavlPayload.exp ? new Date(odavlPayload.exp * 1000) : undefined,
  };
}

/**
 * Get Insight plan from session
 * 
 * Helper to extract plan ID with fallback to FREE tier.
 * 
 * @param session ODAVL session
 * @returns Plan ID (defaults to FREE)
 * 
 * @example
 * ```typescript
 * const plan = getInsightPlanFromSession(session);
 * const canRunCloudAnalysis = canRunCloudAnalysis(plan);
 * ```
 */
export function getInsightPlanFromSession(session: OdavlSession): InsightPlanId {
  return session.insightPlanId || 'INSIGHT_FREE';
}

/**
 * Check if session belongs to organization (team plan)
 * 
 * @param session ODAVL session
 * @returns True if organization member
 */
export function isOrganizationMember(session: OdavlSession): boolean {
  return !!session.organizationId;
}

/**
 * Check if token is expired or about to expire
 * 
 * @param session ODAVL session
 * @param bufferMinutes Minutes before expiry to consider token "expired" (default: 5)
 * @returns True if token should be refreshed
 * 
 * @example
 * ```typescript
 * if (isTokenExpiringSoon(session, 10)) {
 *   // Refresh token proactively (10 min before expiry)
 *   await refreshAccessToken();
 * }
 * ```
 */
export function isTokenExpiringSoon(
  session: OdavlSession,
  bufferMinutes: number = 5
): boolean {
  if (!session.expiresAt) {
    return false; // No expiry = long-lived token
  }
  
  const expiryTime = session.expiresAt.getTime();
  const now = Date.now();
  const bufferMs = bufferMinutes * 60 * 1000;
  
  return (expiryTime - now) < bufferMs;
}

/**
 * Serialize session for storage (removes Date objects)
 * 
 * Useful for storing in localStorage, SecretStorage, or config files.
 * 
 * @param session ODAVL session
 * @returns JSON-safe session object
 */
export function serializeSession(session: OdavlSession): Record<string, any> {
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    insightPlanId: session.insightPlanId,
    organizationId: session.organizationId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt?.toISOString(),
  };
}

/**
 * Deserialize session from storage
 * 
 * @param data Serialized session object
 * @returns ODAVL session
 */
export function deserializeSession(data: Record<string, any>): OdavlSession {
  return {
    userId: createOdavlUserId(data.userId as string),
    email: data.email as string,
    name: data.name as string,
    role: data.role as string,
    insightPlanId: (data.insightPlanId as InsightPlanId) || 'INSIGHT_FREE',
    organizationId: data.organizationId as string | undefined,
    createdAt: new Date(data.createdAt as string),
    expiresAt: data.expiresAt ? new Date(data.expiresAt as string) : undefined,
  };
}
