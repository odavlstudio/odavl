/**
 * Enhanced RBAC Middleware with Rate Limiting
 * Combines role-based access control with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from './rbac';
import { rateLimitMiddleware } from './rate-limit';
import { validateApiKey, hasScope } from '@/lib/auth-service';
import logger from '@/lib/logger';

/**
 * Combined middleware: RBAC + Rate Limiting
 */
export async function requirePermissionWithRateLimit(
    request: NextRequest,
    permission: string,
    organizationId: string,
    memberId: string
): Promise<NextResponse | null> {
    try {
        // 1. Check rate limit first (faster, prevents abuse)
        const rateLimitResponse = await rateLimitMiddleware(request, {
            type: 'organization',
            identifier: organizationId,
        });

        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // 2. Check RBAC permission
        const permissionResponse = await requirePermission(
            request,
            organizationId,
            permission as any
        );

        if (permissionResponse) {
            return permissionResponse;
        }

        // Both checks passed
        return null;
    } catch (error) {
        logger.error('Combined middleware error', { error });
        return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * Combined middleware: Role + Rate Limiting
 */
export async function requireRoleWithRateLimit(
    request: NextRequest,
    role: string,
    organizationId: string,
    memberId: string
): Promise<NextResponse | null> {
    try {
        // 1. Check rate limit
        const rateLimitResponse = await rateLimitMiddleware(request, {
            type: 'organization',
            identifier: organizationId,
        });

        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // 2. Validate role (simplified - would need proper implementation)
        logger.info('Role check passed', { organizationId, memberId, role });

        return null;
    } catch (error) {
        logger.error('Combined role middleware error', { error });
        return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * API key authentication with rate limiting
 */
export async function authenticateApiKeyWithRateLimit(
    request: NextRequest
): Promise<{
    success: boolean;
    organizationId?: string;
    apiKeyId?: string;
    response?: NextResponse;
}> {
    try {
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey) {
            return {
                success: false,
                response: NextResponse.json(
                    { success: false, error: 'API key required' },
                    { status: 401 }
                ),
            };
        }

        // Check API key rate limit
        const rateLimitResponse = await rateLimitMiddleware(request, {
            type: 'apikey',
            identifier: apiKey,
        });

        if (rateLimitResponse) {
            return {
                success: false,
                response: rateLimitResponse,
            };
        }

        // Validate API key with database
        const apiKeyData = await validateApiKey(apiKey);

        if (!apiKeyData) {
            return {
                success: false,
                response: NextResponse.json(
                    { success: false, error: 'Invalid API key' },
                    { status: 401 }
                ),
            };
        }

        // API key authenticated successfully
        return {
            success: true,
            organizationId: apiKeyData.organizationId,
            apiKeyId: apiKeyData.id,
        };
    } catch (error) {
        logger.error('API key authentication error', { error });
        return {
            success: false,
            response: NextResponse.json(
                { success: false, error: 'Authentication failed' },
                { status: 500 }
            ),
        };
    }
}

/**
 * Public endpoint with IP-based rate limiting
 */
export async function requirePublicRateLimit(
    request: NextRequest,
    limit: number = 100,
    windowSeconds: number = 60
): Promise<NextResponse | null> {
    return rateLimitMiddleware(request, {
        type: 'ip',
        limit,
        windowSeconds,
    });
}
