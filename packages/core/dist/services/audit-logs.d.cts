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
declare enum AuditAction {
    USER_LOGIN = "USER_LOGIN",
    USER_LOGOUT = "USER_LOGOUT",
    USER_REGISTER = "USER_REGISTER",
    USER_UPDATE = "USER_UPDATE",
    USER_DELETE = "USER_DELETE",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    PASSWORD_RESET = "PASSWORD_RESET",
    ORG_CREATE = "ORG_CREATE",
    ORG_UPDATE = "ORG_UPDATE",
    ORG_DELETE = "ORG_DELETE",
    ORG_MEMBER_ADD = "ORG_MEMBER_ADD",
    ORG_MEMBER_REMOVE = "ORG_MEMBER_REMOVE",
    ORG_MEMBER_ROLE_CHANGE = "ORG_MEMBER_ROLE_CHANGE",
    PROJECT_CREATE = "PROJECT_CREATE",
    PROJECT_UPDATE = "PROJECT_UPDATE",
    PROJECT_DELETE = "PROJECT_DELETE",
    PROJECT_VIEW = "PROJECT_VIEW",
    PROJECT_ANALYZE = "PROJECT_ANALYZE",
    SECURITY_ROLE_CHANGE = "SECURITY_ROLE_CHANGE",
    SECURITY_PERMISSION_GRANT = "SECURITY_PERMISSION_GRANT",
    SECURITY_PERMISSION_REVOKE = "SECURITY_PERMISSION_REVOKE",
    SECURITY_API_KEY_CREATE = "SECURITY_API_KEY_CREATE",
    SECURITY_API_KEY_DELETE = "SECURITY_API_KEY_DELETE",
    SECURITY_2FA_ENABLE = "SECURITY_2FA_ENABLE",
    SECURITY_2FA_DISABLE = "SECURITY_2FA_DISABLE",
    INVITATION_SEND = "INVITATION_SEND",
    INVITATION_ACCEPT = "INVITATION_ACCEPT",
    INVITATION_DECLINE = "INVITATION_DECLINE",
    INVITATION_REVOKE = "INVITATION_REVOKE",
    DATA_EXPORT = "DATA_EXPORT",
    DATA_IMPORT = "DATA_IMPORT",
    DATA_DELETE = "DATA_DELETE",
    INTEGRATION_CONNECT = "INTEGRATION_CONNECT",
    INTEGRATION_DISCONNECT = "INTEGRATION_DISCONNECT",
    WEBHOOK_CREATE = "WEBHOOK_CREATE",
    WEBHOOK_DELETE = "WEBHOOK_DELETE",
    BILLING_PLAN_CHANGE = "BILLING_PLAN_CHANGE",
    BILLING_PAYMENT_SUCCESS = "BILLING_PAYMENT_SUCCESS",
    BILLING_PAYMENT_FAIL = "BILLING_PAYMENT_FAIL",
    BILLING_SUBSCRIPTION_CANCEL = "BILLING_SUBSCRIPTION_CANCEL"
}
declare enum AuditSeverity {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
declare enum AuditCategory {
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    DATA_ACCESS = "DATA_ACCESS",
    DATA_MODIFICATION = "DATA_MODIFICATION",
    SECURITY = "SECURITY",
    COMPLIANCE = "COMPLIANCE",
    SYSTEM = "SYSTEM"
}
interface AuditLogEntry {
    id: string;
    timestamp: Date;
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
    tags: string[];
}
interface AuditLogFilters {
    startDate?: Date;
    endDate?: Date;
    actions?: AuditAction[];
    categories?: AuditCategory[];
    severities?: AuditSeverity[];
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    projectId?: string;
    resourceType?: string;
    resourceId?: string;
    success?: boolean;
    searchQuery?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
}
interface AuditLogStats {
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
    last24Hours: number;
    last7Days: number;
    last30Days: number;
}
interface ComplianceReport {
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
declare class AuditLogsService {
    private static instance;
    private logs;
    private constructor();
    static getInstance(): AuditLogsService;
    /**
     * Log an audit event
     */
    log(params: {
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
    }): Promise<AuditLogEntry>;
    /**
     * Log user login
     */
    logLogin(params: {
        userId: string;
        userEmail: string;
        userName: string;
        ipAddress: string;
        userAgent: string;
        success: boolean;
        errorMessage?: string;
    }): Promise<AuditLogEntry>;
    /**
     * Log security event
     */
    logSecurityEvent(params: {
        action: AuditAction;
        description: string;
        userId?: string;
        userEmail?: string;
        organizationId?: string;
        severity?: AuditSeverity;
        changes?: {
            before?: Record<string, unknown>;
            after?: Record<string, unknown>;
        };
        success: boolean;
    }): Promise<AuditLogEntry>;
    /**
     * Log data access
     */
    logDataAccess(params: {
        userId: string;
        userEmail: string;
        resourceType: string;
        resourceId: string;
        action: AuditAction;
        organizationId?: string;
        projectId?: string;
    }): Promise<AuditLogEntry>;
    /**
     * Log data modification
     */
    logDataModification(params: {
        userId: string;
        userEmail: string;
        action: AuditAction;
        resourceType: string;
        resourceId: string;
        changes: {
            before?: Record<string, unknown>;
            after?: Record<string, unknown>;
        };
        organizationId?: string;
        projectId?: string;
        success: boolean;
        errorMessage?: string;
    }): Promise<AuditLogEntry>;
    /**
     * Get logs with filters
     */
    getLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]>;
    /**
     * Get statistics
     */
    getStats(organizationId?: string): Promise<AuditLogStats>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(params: {
        startDate: Date;
        endDate: Date;
        organizationId?: string;
    }): Promise<ComplianceReport>;
    /**
     * Export logs to JSON
     */
    exportLogs(filters?: AuditLogFilters): Promise<string>;
    /**
     * Export logs to CSV
     */
    exportLogsCSV(filters?: AuditLogFilters): Promise<string>;
    /**
     * Delete old logs (retention policy)
     */
    deleteOldLogs(daysToKeep?: number): Promise<number>;
}
declare const auditLogsService: AuditLogsService;

export { AuditAction, AuditCategory, type AuditLogEntry, type AuditLogFilters, type AuditLogStats, AuditLogsService, AuditSeverity, type ComplianceReport, auditLogsService };
