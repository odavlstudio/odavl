/**
 * Tenant Context Middleware
 * Provides organization context for API requests
 */

import { NextRequest } from 'next/server';

export interface TenantContext {
  organizationId: string;
  userId: string;
  role?: string;
  permissions?: string[];
}

/**
 * Extract tenant context from request headers
 */
export function getTenantContext(req: NextRequest): TenantContext | null {
  const organizationId = req.headers.get('x-organization-id');
  const userId = req.headers.get('x-user-id');

  if (!organizationId || !userId) {
    return null;
  }

  return {
    organizationId,
    userId,
  };
}

/**
 * Prisma client extension for tenant isolation
 * Automatically adds organizationId filter to queries
 */
export function createTenantPrismaClient(organizationId: string) {
  // This will be used with Prisma's client extensions
  return {
    $extends: {
      query: {
        // Automatically filter by organizationId for all queries
        project: {
          async findMany({ args, query }: any) {
            args.where = {
              ...args.where,
              organizationId,
            };
            return query(args);
          },
          async findFirst({ args, query }: any) {
            args.where = {
              ...args.where,
              organizationId,
            };
            return query(args);
          },
          async create({ args, query }: any) {
            args.data = {
              ...args.data,
              organizationId,
            };
            return query(args);
          },
        },
        // Add similar filters for other tenant-scoped models
        usageRecord: {
          async findMany({ args, query }: any) {
            args.where = {
              ...args.where,
              organizationId,
            };
            return query(args);
          },
        },
        apiKey: {
          async findMany({ args, query }: any) {
            args.where = {
              ...args.where,
              organizationId,
            };
            return query(args);
          },
        },
      },
    },
  };
}

/**
 * Validate tenant access
 */
export async function validateTenantAccess(
  organizationId: string,
  userId: string,
  requiredPermission?: string
): Promise<boolean> {
  const { organizationService } = await import('../services/organization');

  // Check membership
  const isMember = await organizationService.isMember(organizationId, userId);
  if (!isMember) {
    return false;
  }

  // Check permission if required
  if (requiredPermission) {
    return organizationService.hasPermission(
      organizationId,
      userId,
      requiredPermission
    );
  }

  return true;
}
