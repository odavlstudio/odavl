import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext, getOrgContextWithPermission, OrgContext } from './org-context';
import { Permission } from './rbac';
import { logSecurityEvent } from './logger';

/**
 * Middleware wrapper for API routes with RBAC
 * Automatically extracts organization context and checks permissions
 */
export type ApiHandler<T = any> = (
  req: NextRequest,
  context: OrgContext
) => Promise<NextResponse<T>>;

/**
 * Wrap API handler with organization context extraction
 * No permission check - just ensures user is authenticated and has an org
 */
export function withOrgContext(handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      const context = await getOrgContext();
      return await handler(req, context);
    } catch (error) {
      logSecurityEvent('unauthorized_access', undefined, {
        path: req.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 401 }
      );
    }
  };
}

/**
 * Wrap API handler with organization context + permission check
 */
export function withPermission(permission: Permission, handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      const context = await getOrgContextWithPermission(permission);
      return await handler(req, context);
    } catch (error) {
      logSecurityEvent('permission_denied', undefined, {
        path: req.nextUrl.pathname,
        permission,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Forbidden' },
        { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }
  };
}

/**
 * Wrap API handler with multiple permission check (requires ANY)
 */
export function withAnyPermission(permissions: Permission[], handler: ApiHandler) {
  return async (req: NextRequest) => {
    try {
      const context = await getOrgContext();
      
      // Check if user has ANY of the permissions
      const hasAny = permissions.some((perm) => {
        try {
          const { hasPermission } = require('./rbac');
          return hasPermission(context.role, perm);
        } catch {
          return false;
        }
      });

      if (!hasAny) {
        throw new Error(`Forbidden: Requires one of: ${permissions.join(', ')}`);
      }

      return await handler(req, context);
    } catch (error) {
      logSecurityEvent('permission_denied', undefined, {
        path: req.nextUrl.pathname,
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Forbidden' },
        { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }
  };
}

/**
 * Organization isolation helper for Prisma queries
 * Ensures all queries are scoped to user's organization
 */
export class OrgIsolation {
  constructor(private organizationId: string) {}

  /**
   * Get where clause for organization isolation
   */
  where<T extends Record<string, any>>(additionalWhere?: T) {
    return {
      organizationId: this.organizationId,
      ...additionalWhere,
    };
  }

  /**
   * Get where clause for nested organization isolation (via project)
   */
  whereViaProject<T extends Record<string, any>>(additionalWhere?: T) {
    return {
      project: {
        organizationId: this.organizationId,
      },
      ...additionalWhere,
    };
  }

  /**
   * Check if resource belongs to organization
   */
  async checkProjectOwnership(projectId: string): Promise<boolean> {
    const { prisma } = require('./prisma');
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: this.organizationId,
      },
    });
    return !!project;
  }

  /**
   * Require project ownership or throw
   */
  async requireProjectOwnership(projectId: string): Promise<void> {
    const isOwner = await this.checkProjectOwnership(projectId);
    if (!isOwner) {
      throw new Error('Forbidden: Project does not belong to your organization');
    }
  }
}

/**
 * Create organization isolation helper from context
 */
export function createOrgIsolation(context: OrgContext): OrgIsolation {
  return new OrgIsolation(context.organizationId);
}
