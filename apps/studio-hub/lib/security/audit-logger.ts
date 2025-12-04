/**
 * SOC 2 Audit Logging System
 * 
 * Comprehensive audit trail for security compliance.
 * Logs all user actions, data access, and system changes.
 * 
 * SOC 2 Requirements:
 * - CC6.1: Logical access controls
 * - CC6.2: Prior to issuing system credentials
 * - CC6.3: Removes access when appropriate
 * - CC7.2: System monitoring
 */

import { prisma } from '@/lib/monitoring/database';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export enum AuditAction {
  // Authentication Events
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGED = 'auth.password_changed',
  MFA_ENABLED = 'auth.mfa_enabled',
  MFA_DISABLED = 'auth.mfa_disabled',
  
  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_INVITED = 'user.invited',
  USER_ROLE_CHANGED = 'user.role_changed',
  
  // Data Access
  DATA_EXPORTED = 'data.exported',
  DATA_DOWNLOADED = 'data.downloaded',
  SENSITIVE_DATA_ACCESSED = 'data.sensitive_accessed',
  
  // Organization Management
  ORG_CREATED = 'org.created',
  ORG_UPDATED = 'org.updated',
  ORG_DELETED = 'org.deleted',
  ORG_MEMBER_ADDED = 'org.member_added',
  ORG_MEMBER_REMOVED = 'org.member_removed',
  
  // Project Management
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  PROJECT_SETTINGS_CHANGED = 'project.settings_changed',
  
  // API Keys
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  API_KEY_ROTATED = 'api_key.rotated',
  
  // Security Events
  PERMISSION_DENIED = 'security.permission_denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  IP_BLOCKED = 'security.ip_blocked',
  
  // Billing
  SUBSCRIPTION_CREATED = 'billing.subscription_created',
  SUBSCRIPTION_UPDATED = 'billing.subscription_updated',
  SUBSCRIPTION_CANCELED = 'billing.subscription_canceled',
  PAYMENT_SUCCEEDED = 'billing.payment_succeeded',
  PAYMENT_FAILED = 'billing.payment_failed',
  
  // System Events
  BACKUP_CREATED = 'system.backup_created',
  BACKUP_RESTORED = 'system.backup_restored',
  CONFIG_CHANGED = 'system.config_changed',
}

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
}

/**
 * Create an audit log entry with full context
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  
  const ipAddress = entry.ipAddress || 
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown';
  
  const userAgent = entry.userAgent || 
    headersList.get('user-agent') ||
    'unknown';
  
  try {
    const userId = entry.userId || session?.user?.id;
    if (!userId) {
      logger.warn('Cannot create audit log without userId');
      return;
    }

    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId,
        metadata: entry.metadata || {},
        ipAddress,
        userAgent,
        resource: entry.resource,
        resourceId: entry.resourceId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Never throw - logging failures should not break application
    logger.error('Failed to create audit log', error as Error, { 
      action: entry.action,
      userId: entry.userId,
      resource: entry.resource 
    });
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    const timestampFilter = where.timestamp as Record<string, unknown>;
    if (filters.startDate) timestampFilter.gte = filters.startDate;
    if (filters.endDate) timestampFilter.lte = filters.endDate;
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  
  return {
    logs,
    total,
    hasMore: (filters.offset || 0) + logs.length < total,
  };
}

/**
 * Security event alerting for critical actions
 */
export async function alertSecurityEvent(
  event: AuditAction,
  metadata: Record<string, any>
): Promise<void> {
  // Log critical security event
  await createAuditLog({
    action: event,
    metadata,
  });
  
  // Send to monitoring system (e.g., Sentry, Datadog)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with Sentry/Datadog alerting
    logger.error('SECURITY EVENT', new Error(event), { event, metadata });
  }
}

/**
 * Wrapper for authenticated actions with automatic audit logging
 */
export async function withAuditLog<T>(
  action: AuditAction,
  handler: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await handler();
    
    await createAuditLog({
      action,
      metadata: {
        ...metadata,
        duration: Date.now() - startTime,
        success: true,
      },
    });
    
    return result;
  } catch (error) {
    await createAuditLog({
      action,
      metadata: {
        ...metadata,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    throw error;
  }
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Check for multiple failed login attempts
  const failedLogins = await prisma.auditLog.count({
    where: {
      userId,
      action: AuditAction.LOGIN_FAILED,
      timestamp: { gte: oneHourAgo },
    },
  });
  
  if (failedLogins >= 5) {
    await alertSecurityEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
      userId,
      reason: 'Multiple failed login attempts',
      count: failedLogins,
    });
    return true;
  }
  
  // Check for unusual number of API requests
  const apiRequests = await prisma.auditLog.count({
    where: {
      userId,
      timestamp: { gte: oneHourAgo },
    },
  });
  
  if (apiRequests >= 1000) {
    await alertSecurityEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
      userId,
      reason: 'Unusually high API activity',
      count: apiRequests,
    });
    return true;
  }
  
  return false;
}

/**
 * Export audit logs for compliance reporting
 */
export async function exportAuditLogs(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'asc' },
  });
  
  // Convert to CSV format for compliance auditors
  const headers = [
    'Timestamp',
    'Action',
    'User ID',
    'IP Address',
    'Resource',
    'Metadata',
  ];
  
  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.action,
    log.userId,
    log.ipAddress,
    log.resource || 'N/A',
    JSON.stringify(log.metadata),
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  // Log the export action
  await createAuditLog({
    action: AuditAction.DATA_EXPORTED,
    userId,
    metadata: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      recordCount: logs.length,
    },
  });
  
  return csv;
}

