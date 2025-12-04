/**
 * RBAC (Role-Based Access Control) Middleware
 * Enforces role-based permissions for multi-tenant routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest as getAuthUser } from '@/lib/auth-service';
import logger from '@/lib/logger';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export type Permission =
    | 'organization:read'
    | 'organization:write'
    | 'organization:delete'
    | 'team:read'
    | 'team:write'
    | 'team:delete'
    | 'member:read'
    | 'member:write'
    | 'member:delete'
    | 'apikey:read'
    | 'apikey:write'
    | 'apikey:delete'
    | 'project:read'
    | 'project:write'
    | 'project:delete'
    | 'test:read'
    | 'test:write'
    | 'monitor:read'
    | 'monitor:write';

/**
 * Role hierarchy and permissions
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    owner: [
        // Full access to everything
        'organization:read',
        'organization:write',
        'organization:delete',
        'team:read',
        'team:write',
        'team:delete',
        'member:read',
        'member:write',
        'member:delete',
        'apikey:read',
        'apikey:write',
        'apikey:delete',
        'project:read',
        'project:write',
        'project:delete',
        'test:read',
        'test:write',
        'monitor:read',
        'monitor:write',
    ],
    admin: [
        // All except organization deletion
        'organization:read',
        'organization:write',
        'team:read',
        'team:write',
        'team:delete',
        'member:read',
        'member:write',
        'member:delete',
        'apikey:read',
        'apikey:write',
        'apikey:delete',
        'project:read',
        'project:write',
        'project:delete',
        'test:read',
        'test:write',
        'monitor:read',
        'monitor:write',
    ],
    member: [
        // Standard access - read/write own resources
        'organization:read',
        'team:read',
        'member:read',
        'apikey:read',
        'project:read',
        'project:write',
        'test:read',
        'test:write',
        'monitor:read',
        'monitor:write',
    ],
    viewer: [
        // Read-only access
        'organization:read',
        'team:read',
        'member:read',
        'apikey:read',
        'project:read',
        'test:read',
        'monitor:read',
    ],
};

/**
 * Check if role has permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get user from request (uses centralized auth service)
 */
async function getUserFromRequest(request: NextRequest): Promise<{
    id: string;
    email: string;
} | null> {
    return getAuthUser(request);
}

/**
 * Get member role in organization
 */
async function getMemberRole(
    organizationId: string,
    userEmail: string
): Promise<Role | null> {
    const member = await prisma.member.findUnique({
        where: {
            organizationId_email: {
                organizationId,
                email: userEmail,
            },
        },
        select: {
            role: true,
        },
    });

    return member?.role as Role | null;
}

/**
 * RBAC Middleware
 */
export async function requirePermission(
    request: NextRequest,
    organizationId: string,
    permission: Permission
): Promise<NextResponse | null> {
    try {
        // Get authenticated user
        const user = await getUserFromRequest(request);
        if (!user) {
            logger.warn('Unauthorized access attempt', { organizationId, permission });
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentication required',
                },
                { status: 401 }
            );
        }

        // Get member role
        const role = await getMemberRole(organizationId, user.email);
        if (!role) {
            logger.warn('Access denied - not a member', {
                organizationId,
                userEmail: user.email,
                permission,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: 'Forbidden',
                    message: 'You are not a member of this organization',
                },
                { status: 403 }
            );
        }

        // Check permission
        if (!hasPermission(role, permission)) {
            logger.warn('Access denied - insufficient permissions', {
                organizationId,
                userEmail: user.email,
                role,
                permission,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: 'Forbidden',
                    message: `Insufficient permissions. Required: ${permission}`,
                },
                { status: 403 }
            );
        }

        // Permission granted
        logger.info('Access granted', {
            organizationId,
            userEmail: user.email,
            role,
            permission,
        });
        return null; // null = continue processing
    } catch (error) {
        logger.error('RBAC middleware error', { error });
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * Extract organization ID from request
 */
export function getOrganizationIdFromRequest(request: NextRequest): string | null {
    // Try to get from URL params
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const orgIndex = pathSegments.indexOf('organizations');
    if (orgIndex !== -1 && pathSegments[orgIndex + 1]) {
        return pathSegments[orgIndex + 1];
    }

    // Try to get from query params
    return url.searchParams.get('organizationId');
}
