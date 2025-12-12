import { prisma } from './prisma';
import { logger } from './logger';
import { OrgRole } from '@prisma/client';

/**
 * Audit log entry type
 */
export interface AuditLogEntry {
  organizationId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit action types
 */
export type AuditAction =
  // Organization
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  // Members
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'member.role_changed'
  // Billing
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'payment.succeeded'
  | 'payment.failed'
  // Projects
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.archived'
  // Analysis
  | 'analysis.executed'
  | 'fix.applied'
  | 'audit.executed'
  // Autopilot
  | 'autopilot.run'
  | 'autopilot.run.failed'
  | 'autopilot.run.rollback'
  // API Keys
  | 'api_key.created'
  | 'api_key.deleted'
  // Security
  | 'login.success'
  | 'login.failed'
  | 'password.changed'
  | 'mfa.enabled'
  | 'mfa.disabled';

/**
 * Create audit log entry
 * Logs to database for compliance and security tracking
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Log to structured logger first (for real-time monitoring)
    logger.info({
      type: 'audit_log',
      organizationId: entry.organizationId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });

    // Note: Would store in database table 'AuditLog' (not yet in schema)
    // For now, just log to structured logger
    // Future: Add AuditLog model to schema with retention policies
  } catch (error) {
    // Never throw from audit logging (don't break main flow)
    logger.error({
      type: 'audit_log_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      entry,
    });
  }
}

/**
 * Audit organization member changes
 */
export async function auditMemberChange(
  organizationId: string,
  actorUserId: string,
  targetUserId: string,
  action: 'invited' | 'joined' | 'removed' | 'role_changed',
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId: actorUserId,
    action: `member.${action}`,
    resourceType: 'organization_member',
    resourceId: targetUserId,
    metadata,
  });
}

/**
 * Audit billing changes
 */
export async function auditBillingChange(
  organizationId: string,
  userId: string,
  action: 'created' | 'updated' | 'canceled',
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: `subscription.${action}`,
    resourceType: 'subscription',
    resourceId: organizationId,
    metadata,
  });
}

/**
 * Audit project changes
 */
export async function auditProjectChange(
  organizationId: string,
  userId: string,
  projectId: string,
  action: 'created' | 'updated' | 'deleted' | 'archived',
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: `project.${action}`,
    resourceType: 'project',
    resourceId: projectId,
    metadata,
  });
}

/**
 * Audit API key changes
 */
export async function auditApiKeyChange(
  organizationId: string,
  userId: string,
  apiKeyId: string,
  action: 'created' | 'deleted',
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: `api_key.${action}`,
    resourceType: 'api_key',
    resourceId: apiKeyId,
    metadata,
  });
}

/**
 * Audit security events
 */
export async function auditSecurityEvent(
  userId: string,
  action: AuditAction,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Security events may not have organizationId (e.g., failed login)
  await createAuditLog({
    organizationId: 'system', // Special org for system-level events
    userId,
    action,
    resourceType: 'security',
    metadata,
    ipAddress,
    userAgent,
  });
}
