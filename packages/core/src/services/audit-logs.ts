/**
 * Audit Logging Service
 * Comprehensive activity tracking and compliance logging
 * 
 * Features:
 * - User action tracking (CRUD operations)
 * - Security event logging
 * - Compliance reporting
 * - Export capabilities
 * - Advanced filtering and search
 */

import crypto from 'node:crypto';

export enum AuditAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Organization actions
  ORG_CREATE = 'ORG_CREATE',
  ORG_UPDATE = 'ORG_UPDATE',
  ORG_DELETE = 'ORG_DELETE',
  ORG_MEMBER_ADD = 'ORG_MEMBER_ADD',
  ORG_MEMBER_REMOVE = 'ORG_MEMBER_REMOVE',
  ORG_MEMBER_ROLE_CHANGE = 'ORG_MEMBER_ROLE_CHANGE',
  
  // Project actions
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  PROJECT_VIEW = 'PROJECT_VIEW',
  PROJECT_ANALYZE = 'PROJECT_ANALYZE',
  
  // Security actions
  SECURITY_ROLE_CHANGE = 'SECURITY_ROLE_CHANGE',
  SECURITY_PERMISSION_GRANT = 'SECURITY_PERMISSION_GRANT',
  SECURITY_PERMISSION_REVOKE = 'SECURITY_PERMISSION_REVOKE',
  SECURITY_API_KEY_CREATE = 'SECURITY_API_KEY_CREATE',
  SECURITY_API_KEY_DELETE = 'SECURITY_API_KEY_DELETE',
  SECURITY_2FA_ENABLE = 'SECURITY_2FA_ENABLE',
  SECURITY_2FA_DISABLE = 'SECURITY_2FA_DISABLE',
  
  // Invitation actions
  INVITATION_SEND = 'INVITATION_SEND',
  INVITATION_ACCEPT = 'INVITATION_ACCEPT',
  INVITATION_DECLINE = 'INVITATION_DECLINE',
  INVITATION_REVOKE = 'INVITATION_REVOKE',
  
  // Data actions
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  DATA_DELETE = 'DATA_DELETE',
  
  // Integration actions
  INTEGRATION_CONNECT = 'INTEGRATION_CONNECT',
  INTEGRATION_DISCONNECT = 'INTEGRATION_DISCONNECT',
  WEBHOOK_CREATE = 'WEBHOOK_CREATE',
  WEBHOOK_DELETE = 'WEBHOOK_DELETE',
  
  // Billing actions
  BILLING_PLAN_CHANGE = 'BILLING_PLAN_CHANGE',
  BILLING_PAYMENT_SUCCESS = 'BILLING_PAYMENT_SUCCESS',
  BILLING_PAYMENT_FAIL = 'BILLING_PAYMENT_FAIL',
  BILLING_SUBSCRIPTION_CANCEL = 'BILLING_SUBSCRIPTION_CANCEL',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SECURITY = 'SECURITY',
  COMPLIANCE = 'COMPLIANCE',
  SYSTEM = 'SYSTEM',
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  
  // Action details
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  description: string;
  
  // Actor (who performed the action)
  userId?: string;
  userEmail?: string;
  userName?: string;
  
  // Target (what was affected)
  organizationId?: string;
  projectId?: string;
  resourceType?: string;
  resourceId?: string;
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  
  // Before/after values for changes
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  
  // Additional metadata
  metadata?: Record<string, unknown>;
  
  // Geolocation (optional)
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  
  // Result
  success: boolean;
  errorMessage?: string;
  
  // Tags for filtering
  tags: string[];
}

export interface AuditLogFilters {
  // Time range
  startDate?: Date;
  endDate?: Date;
  
  // Action filters
  actions?: AuditAction[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  
  // Actor filters
  userId?: string;
  userEmail?: string;
  
  // Organization/project filters
  organizationId?: string;
  projectId?: string;
  
  // Resource filters
  resourceType?: string;
  resourceId?: string;
  
  // Status filter
  success?: boolean;
  
  // Search
  searchQuery?: string;
  
  // Tags
  tags?: string[];
  
  // Pagination
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  byAction: Record<string, number>;
  
  successRate: number;
  failureCount: number;
  
  topUsers: Array<{
    userId: string;
    userEmail: string;
    actionCount: number;
  }>;
  
  recentActivity: AuditLogEntry[];
  
  // Time-based stats
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

export interface ComplianceReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  organizationId?: string;
  
  summary: {
    totalActions: number;
    securityEvents: number;
    dataAccess: number;
    dataModifications: number;
    failedActions: number;
  };
  
  userActivity: Array<{
    userId: string;
    userEmail: string;
    actionCount: number;
    lastActivity: Date;
  }>;
  
  securityEvents: AuditLogEntry[];
  criticalEvents: AuditLogEntry[];
  
  complianceMetrics: {
    mfaEnabled: number;
    passwordChanges: number;
    dataExports: number;
    dataDeletes: number;
    permissionChanges: number;
  };
}

export class AuditLogsService {
  private static instance: AuditLogsService;
  private logs = new Map<string, AuditLogEntry>();
  
  private constructor() {}
  
  public static getInstance(): AuditLogsService {
    if (!AuditLogsService.instance) {
      AuditLogsService.instance = new AuditLogsService();
    }
    return AuditLogsService.instance;
  }
  
  /**
   * Log an audit event
   */
  public async log(params: {
    action: AuditAction;
    category: AuditCategory;
    severity: AuditSeverity;
    description: string;
    
    userId?: string;
    userEmail?: string;
    userName?: string;
    
    organizationId?: string;
    projectId?: string;
    resourceType?: string;
    resourceId?: string;
    
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
    
    changes?: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    };
    
    metadata?: Record<string, unknown>;
    location?: {
      country?: string;
      city?: string;
      region?: string;
    };
    
    success: boolean;
    errorMessage?: string;
    tags?: string[];
  }): Promise<AuditLogEntry> {
    const id = `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const entry: AuditLogEntry = {
      id,
      timestamp: new Date(),
      action: params.action,
      category: params.category,
      severity: params.severity,
      description: params.description,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      organizationId: params.organizationId,
      projectId: params.projectId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      sessionId: params.sessionId,
      changes: params.changes,
      metadata: params.metadata,
      location: params.location,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: params.tags || [],
    };
    
    this.logs.set(id, entry);
    
    // TODO: In production, write to persistent storage (database, log aggregation service)
    // TODO: Send critical events to alerting service
    if (entry.severity === AuditSeverity.CRITICAL) {
      console.warn('[AUDIT] Critical event:', entry);
    }
    
    return entry;
  }
  
  /**
   * Log user login
   */
  public async logLogin(params: {
    userId: string;
    userEmail: string;
    userName: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<AuditLogEntry> {
    return this.log({
      action: AuditAction.USER_LOGIN,
      category: AuditCategory.AUTHENTICATION,
      severity: params.success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      description: `User ${params.userEmail} ${params.success ? 'logged in' : 'failed to log in'}`,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: ['authentication', 'login'],
    });
  }
  
  /**
   * Log security event
   */
  public async logSecurityEvent(params: {
    action: AuditAction;
    description: string;
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    severity?: AuditSeverity;
    changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
    success: boolean;
  }): Promise<AuditLogEntry> {
    return this.log({
      action: params.action,
      category: AuditCategory.SECURITY,
      severity: params.severity || AuditSeverity.WARNING,
      description: params.description,
      userId: params.userId,
      userEmail: params.userEmail,
      organizationId: params.organizationId,
      changes: params.changes,
      success: params.success,
      tags: ['security'],
    });
  }
  
  /**
   * Log data access
   */
  public async logDataAccess(params: {
    userId: string;
    userEmail: string;
    resourceType: string;
    resourceId: string;
    action: AuditAction;
    organizationId?: string;
    projectId?: string;
  }): Promise<AuditLogEntry> {
    return this.log({
      action: params.action,
      category: AuditCategory.DATA_ACCESS,
      severity: AuditSeverity.INFO,
      description: `User ${params.userEmail} accessed ${params.resourceType} ${params.resourceId}`,
      userId: params.userId,
      userEmail: params.userEmail,
      organizationId: params.organizationId,
      projectId: params.projectId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      success: true,
      tags: ['data-access'],
    });
  }
  
  /**
   * Log data modification
   */
  public async logDataModification(params: {
    userId: string;
    userEmail: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    changes: { before?: Record<string, unknown>; after?: Record<string, unknown> };
    organizationId?: string;
    projectId?: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<AuditLogEntry> {
    return this.log({
      action: params.action,
      category: AuditCategory.DATA_MODIFICATION,
      severity: params.success ? AuditSeverity.INFO : AuditSeverity.ERROR,
      description: `User ${params.userEmail} ${params.action} ${params.resourceType} ${params.resourceId}`,
      userId: params.userId,
      userEmail: params.userEmail,
      organizationId: params.organizationId,
      projectId: params.projectId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      changes: params.changes,
      success: params.success,
      errorMessage: params.errorMessage,
      tags: ['data-modification'],
    });
  }
  
  /**
   * Get logs with filters
   */
  public async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
    let logs = Array.from(this.logs.values());
    
    // Apply filters
    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    if (filters.actions && filters.actions.length > 0) {
      logs = logs.filter(log => filters.actions!.includes(log.action));
    }
    
    if (filters.categories && filters.categories.length > 0) {
      logs = logs.filter(log => filters.categories!.includes(log.category));
    }
    
    if (filters.severities && filters.severities.length > 0) {
      logs = logs.filter(log => filters.severities!.includes(log.severity));
    }
    
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.userEmail) {
      logs = logs.filter(log => log.userEmail === filters.userEmail);
    }
    
    if (filters.organizationId) {
      logs = logs.filter(log => log.organizationId === filters.organizationId);
    }
    
    if (filters.projectId) {
      logs = logs.filter(log => log.projectId === filters.projectId);
    }
    
    if (filters.resourceType) {
      logs = logs.filter(log => log.resourceType === filters.resourceType);
    }
    
    if (filters.resourceId) {
      logs = logs.filter(log => log.resourceId === filters.resourceId);
    }
    
    if (filters.success !== undefined) {
      logs = logs.filter(log => log.success === filters.success);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      logs = logs.filter(log => filters.tags!.some(tag => log.tags.includes(tag)));
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      logs = logs.filter(log =>
        log.description.toLowerCase().includes(query) ||
        log.userEmail?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    logs = logs.slice(offset, offset + limit);
    
    return logs;
  }
  
  /**
   * Get statistics
   */
  public async getStats(organizationId?: string): Promise<AuditLogStats> {
    let logs = Array.from(this.logs.values());
    
    if (organizationId) {
      logs = logs.filter(log => log.organizationId === organizationId);
    }
    
    const totalLogs = logs.length;
    
    // By category
    const byCategory = {} as Record<AuditCategory, number>;
    Object.values(AuditCategory).forEach(cat => {
      byCategory[cat] = logs.filter(log => log.category === cat).length;
    });
    
    // By severity
    const bySeverity = {} as Record<AuditSeverity, number>;
    Object.values(AuditSeverity).forEach(sev => {
      bySeverity[sev] = logs.filter(log => log.severity === sev).length;
    });
    
    // By action (top 10)
    const actionCounts = new Map<string, number>();
    logs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    });
    const byAction = Object.fromEntries(
      Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    );
    
    // Success/failure
    const successCount = logs.filter(log => log.success).length;
    const failureCount = logs.filter(log => !log.success).length;
    const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;
    
    // Top users
    const userCounts = new Map<string, { userId: string; userEmail: string; count: number }>();
    logs.forEach(log => {
      if (log.userId && log.userEmail) {
        const existing = userCounts.get(log.userId);
        if (existing) {
          existing.count++;
        } else {
          userCounts.set(log.userId, {
            userId: log.userId,
            userEmail: log.userEmail,
            count: 1,
          });
        }
      }
    });
    const topUsers = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(u => ({ userId: u.userId, userEmail: u.userEmail, actionCount: u.count }));
    
    // Recent activity
    const recentActivity = logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
    
    // Time-based stats
    const now = Date.now();
    const last24Hours = logs.filter(log => now - log.timestamp.getTime() < 24 * 60 * 60 * 1000).length;
    const last7Days = logs.filter(log => now - log.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000).length;
    const last30Days = logs.filter(log => now - log.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000).length;
    
    return {
      totalLogs,
      byCategory,
      bySeverity,
      byAction,
      successRate,
      failureCount,
      topUsers,
      recentActivity,
      last24Hours,
      last7Days,
      last30Days,
    };
  }
  
  /**
   * Generate compliance report
   */
  public async generateComplianceReport(params: {
    startDate: Date;
    endDate: Date;
    organizationId?: string;
  }): Promise<ComplianceReport> {
    const logs = await this.getLogs({
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });
    
    const id = `report_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // Security events
    const securityEvents = logs.filter(log => log.category === AuditCategory.SECURITY);
    const criticalEvents = logs.filter(log => log.severity === AuditSeverity.CRITICAL);
    
    // User activity
    const userActivity = new Map<string, { userId: string; userEmail: string; count: number; lastActivity: Date }>();
    logs.forEach(log => {
      if (log.userId && log.userEmail) {
        const existing = userActivity.get(log.userId);
        if (existing) {
          existing.count++;
          if (log.timestamp > existing.lastActivity) {
            existing.lastActivity = log.timestamp;
          }
        } else {
          userActivity.set(log.userId, {
            userId: log.userId,
            userEmail: log.userEmail,
            count: 1,
            lastActivity: log.timestamp,
          });
        }
      }
    });
    
    // Compliance metrics
    const complianceMetrics = {
      mfaEnabled: logs.filter(log => log.action === AuditAction.SECURITY_2FA_ENABLE).length,
      passwordChanges: logs.filter(log => log.action === AuditAction.PASSWORD_CHANGE).length,
      dataExports: logs.filter(log => log.action === AuditAction.DATA_EXPORT).length,
      dataDeletes: logs.filter(log => log.action === AuditAction.DATA_DELETE).length,
      permissionChanges: logs.filter(log =>
        log.action === AuditAction.SECURITY_PERMISSION_GRANT ||
        log.action === AuditAction.SECURITY_PERMISSION_REVOKE
      ).length,
    };
    
    return {
      id,
      generatedAt: new Date(),
      period: {
        start: params.startDate,
        end: params.endDate,
      },
      organizationId: params.organizationId,
      summary: {
        totalActions: logs.length,
        securityEvents: securityEvents.length,
        dataAccess: logs.filter(log => log.category === AuditCategory.DATA_ACCESS).length,
        dataModifications: logs.filter(log => log.category === AuditCategory.DATA_MODIFICATION).length,
        failedActions: logs.filter(log => !log.success).length,
      },
      userActivity: Array.from(userActivity.values()).sort((a, b) => b.count - a.count),
      securityEvents,
      criticalEvents,
      complianceMetrics,
    };
  }
  
  /**
   * Export logs to JSON
   */
  public async exportLogs(filters: AuditLogFilters = {}): Promise<string> {
    const logs = await this.getLogs(filters);
    return JSON.stringify(logs, null, 2);
  }
  
  /**
   * Export logs to CSV
   */
  public async exportLogsCSV(filters: AuditLogFilters = {}): Promise<string> {
    const logs = await this.getLogs(filters);
    
    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Category',
      'Severity',
      'Description',
      'User Email',
      'Organization ID',
      'Project ID',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'Success',
      'Error Message',
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.action,
      log.category,
      log.severity,
      log.description,
      log.userEmail || '',
      log.organizationId || '',
      log.projectId || '',
      log.resourceType || '',
      log.resourceId || '',
      log.ipAddress || '',
      log.success.toString(),
      log.errorMessage || '',
    ]);
    
    const csvLines = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );
    
    return csvLines.join('\n');
  }
  
  /**
   * Delete old logs (retention policy)
   */
  public async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const [id, log] of this.logs.entries()) {
      if (log.timestamp < cutoffDate) {
        this.logs.delete(id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// Export singleton instance
export const auditLogsService = AuditLogsService.getInstance();
