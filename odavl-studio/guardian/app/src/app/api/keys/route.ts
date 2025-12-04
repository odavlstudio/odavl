/**
 * API Key Management Routes for ODAVL Guardian
 * POST /api/keys - Generate new API key
 * GET /api/keys - List organization API keys
 * DELETE /api/keys/[id] - Revoke API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, generateApiKey, revokeApiKey } from '@/lib/auth-service';
import { prisma } from '@/lib/prisma';
import { requirePermissionWithRateLimit } from '@/middleware/combined-auth';
import logger from '@/lib/logger';

/**
 * POST /api/keys
 * Generate new API key for organization
 * 
 * Request body:
 * {
 *   "name": "Production API Key",
 *   "scopes": ["read:tests", "write:tests"],
 *   "expiresInDays": 90 (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "key": "odavl_abc123...",  // Show once, never stored
 *   "keyId": "key-id",
 *   "message": "Store this key securely - it won't be shown again"
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user || !user.organizationId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check RBAC permission (must have apikey:write)
        const authCheck = await requirePermissionWithRateLimit(
            request,
            'apikey:write',
            user.organizationId,
            user.id
        );

        if (authCheck) {
            return authCheck; // Permission denied or rate limited
        }

        // Parse request body
        const body = await request.json();
        const { name, scopes, expiresInDays } = body;

        if (!name || !scopes || !Array.isArray(scopes)) {
            return NextResponse.json(
                { success: false, error: 'Name and scopes (array) required' },
                { status: 400 }
            );
        }

        // Generate API key
        const { key, keyId } = await generateApiKey(
            user.organizationId,
            name,
            scopes,
            expiresInDays
        );

        return NextResponse.json({
            success: true,
            key, // Plaintext key - show once
            keyId,
            message: 'Store this key securely - it won\'t be shown again',
        });
    } catch (error) {
        logger.error('API key generation error', { error });
        return NextResponse.json(
            { success: false, error: 'Failed to generate API key' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/keys
 * List all API keys for user's organization
 * 
 * Response:
 * {
 *   "success": true,
 *   "keys": [
 *     { "id": "...", "name": "...", "lastUsedAt": "...", "scopes": [...] }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user || !user.organizationId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check RBAC permission (must have apikey:read)
        const authCheck = await requirePermissionWithRateLimit(
            request,
            'apikey:read',
            user.organizationId,
            user.id
        );

        if (authCheck) {
            return authCheck;
        }

        // Fetch API keys
        const keys = await prisma.apiKey.findMany({
            where: {
                organizationId: user.organizationId,
            },
            select: {
                id: true,
                name: true,
                scopes: true,
                lastUsedAt: true,
                createdAt: true,
                expiresAt: true,
                revoked: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            keys,
        });
    } catch (error) {
        logger.error('API key listing error', { error });
        return NextResponse.json(
            { success: false, error: 'Failed to list API keys' },
            { status: 500 }
        );
    }
}
