/**
 * Authentication Service for ODAVL Guardian
 * Handles JWT token validation, API key authentication, and user session management
 */

import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import crypto from 'node:crypto';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'odavl-guardian-secret-change-in-production'
);
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = '24h';

export interface AuthUser {
    id: string;
    email: string;
    organizationId?: string;
    role?: string;
}

export interface ApiKeyData {
    id: string;
    organizationId: string;
    name: string;
    scopes: string[];
    lastUsedAt: Date;
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(user: AuthUser): Promise<string> {
    try {
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            role: user.role,
        })
            .setProtectedHeader({ alg: JWT_ALGORITHM })
            .setIssuedAt()
            .setExpirationTime(JWT_EXPIRATION)
            .sign(JWT_SECRET);

        logger.debug('Generated JWT token', { userId: user.id });
        return token;
    } catch (error) {
        logger.error('JWT generation failed', { error });
        throw new Error('Token generation failed');
    }
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            algorithms: [JWT_ALGORITHM],
        });

        return {
            id: payload.sub as string,
            email: payload.email as string,
            organizationId: payload.organizationId as string | undefined,
            role: payload.role as string | undefined,
        };
    } catch (error) {
        logger.warn('JWT verification failed', { error });
        return null;
    }
}

/**
 * Extract user from request (Bearer token or session)
 */
export async function getUserFromRequest(
    request: NextRequest
): Promise<AuthUser | null> {
    // 1. Try Bearer token (API clients)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        return verifyToken(token);
    }

    // 2. Try cookie session (web clients)
    const cookieToken = request.cookies.get('odavl-auth-token')?.value;
    if (cookieToken) {
        return verifyToken(cookieToken);
    }

    // 3. Development mode: x-user-id header (REMOVE IN PRODUCTION)
    if (process.env.NODE_ENV === 'development') {
        const userId = request.headers.get('x-user-id');
        const userEmail = request.headers.get('x-user-email');
        if (userId && userEmail) {
            logger.warn('Using dev headers for auth (PRODUCTION UNSAFE)', {
                userId,
            });
            return { id: userId, email: userEmail };
        }
    }

    return null;
}

/**
 * Validate API key and return organization/key data
 */
export async function validateApiKey(
    apiKey: string
): Promise<ApiKeyData | null> {
    try {
        // Hash the API key (keys are stored hashed for security)
        const keyHash = crypto
            .createHash('sha256')
            .update(apiKey)
            .digest('hex');

        // Find API key in database
        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { keyHash },
            select: {
                id: true,
                organizationId: true,
                name: true,
                scopes: true,
                lastUsedAt: true,
                expiresAt: true,
                revoked: true,
            },
        });

        if (!apiKeyRecord) {
            logger.warn('API key not found', { keyHash });
            return null;
        }

        // Check if key is revoked
        if (apiKeyRecord.revoked) {
            logger.warn('API key revoked', {
                keyId: apiKeyRecord.id,
                organizationId: apiKeyRecord.organizationId,
            });
            return null;
        }

        // Check if key is expired
        if (
            apiKeyRecord.expiresAt &&
            apiKeyRecord.expiresAt < new Date()
        ) {
            logger.warn('API key expired', {
                keyId: apiKeyRecord.id,
                expiresAt: apiKeyRecord.expiresAt,
            });
            return null;
        }

        // Update last used timestamp (async, don't wait)
        prisma.apiKey
            .update({
                where: { id: apiKeyRecord.id },
                data: { lastUsedAt: new Date() },
            })
            .catch((error: unknown) =>
                logger.error('Failed to update API key lastUsedAt', { error })
            );

        return {
            id: apiKeyRecord.id,
            organizationId: apiKeyRecord.organizationId,
            name: apiKeyRecord.name,
            scopes: apiKeyRecord.scopes,
            lastUsedAt: apiKeyRecord.lastUsedAt || new Date(),
        };
    } catch (error) {
        logger.error('API key validation error', { error });
        return null;
    }
}

/**
 * Generate new API key (returns plaintext key - show once to user)
 */
export async function generateApiKey(
    organizationId: string,
    name: string,
    scopes: string[],
    expiresInDays?: number
): Promise<{ key: string; keyId: string }> {
    try {
        // Generate random API key (32 bytes = 64 hex chars)
        const key = `odavl_${crypto.randomBytes(32).toString('hex')}`;

        // Hash the key for storage
        const keyHash = crypto.createHash('sha256').update(key).digest('hex');

        // Calculate expiration date
        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // Store hashed key in database
        const apiKeyRecord = await prisma.apiKey.create({
            data: {
                organizationId,
                name,
                keyHash,
                scopes,
                expiresAt,
            },
        });

        logger.info('Generated new API key', {
            keyId: apiKeyRecord.id,
            organizationId,
            name,
        });

        return {
            key, // Plaintext key (show once, never stored)
            keyId: apiKeyRecord.id,
        };
    } catch (error) {
        logger.error('API key generation failed', { error });
        throw new Error('API key generation failed');
    }
}

/**
 * Revoke API key
 */
export async function revokeApiKey(keyId: string): Promise<void> {
    try {
        await prisma.apiKey.update({
            where: { id: keyId },
            data: { revoked: true },
        });

        logger.info('Revoked API key', { keyId });
    } catch (error) {
        logger.error('API key revocation failed', { keyId, error });
        throw new Error('API key revocation failed');
    }
}

/**
 * Check if API key has required scope
 */
export function hasScope(apiKeyData: ApiKeyData, requiredScope: string): boolean {
    return apiKeyData.scopes.includes(requiredScope) || apiKeyData.scopes.includes('*');
}
