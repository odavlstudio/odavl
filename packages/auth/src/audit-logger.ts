/**
 * Audit Logging System
 * Comprehensive audit trail for compliance and security
 * 
 * Week 9-10: Enterprise Features
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

export type AuditEventType =
    // Authentication events
    | 'auth.login'
    | 'auth.logout'
    | 'auth.failed-login'
    | 'auth.password-reset'
    | 'auth.token-refresh'
    | 'auth.sso-login'
    // User management
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'user.role-changed'
    | 'user.suspended'
    | 'user.activated'
    // Team management
    | 'team.created'
    | 'team.updated'
    | 'team.deleted'
    | 'team.member-added'
    | 'team.member-removed'
    // Settings changes
    | 'settings.updated'
    | 'settings.saml-configured'
    | 'settings.api-key-created'
    | 'settings.api-key-deleted'
    // Data operations
    | 'data.exported'
    | 'data.deleted'
    | 'data.imported'
    // Autopilot actions
    | 'autopilot.run-started'
    | 'autopilot.run-completed'
    | 'autopilot.run-failed'
    | 'autopilot.file-modified'
    | 'autopilot.recipe-applied'
    // Guardian actions
    | 'guardian.scan-started'
    | 'guardian.scan-completed'
    | 'guardian.issue-found'
    // Insight actions
    | 'insight.analysis-started'
    | 'insight.analysis-completed'
    | 'insight.detector-run'
    // Security events
    | 'security.unauthorized-access'
    | 'security.permission-denied'
    | 'security.rate-limit-exceeded'
    | 'security.suspicious-activity';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLog {
    id: string;
    timestamp: Date;
    eventType: AuditEventType;
    severity: AuditSeverity;
    
    // Actor (who performed the action)
    userId?: string;
    userEmail?: string;
    userRole?: string;
    
    // Context
    organizationId?: string;
    teamId?: string;
    
    // Details
    action: string;
    resource?: string;
    resourceId?: string;
    
    // Request metadata
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    
    // Changes (for update events)
    changes?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    };
    
    // Additional metadata
    metadata?: Record<string, any>;
    
    // Success/failure
    success: boolean;
    errorMessage?: string;
}

export interface AuditQuery {
    organizationId?: string;
    userId?: string;
    eventTypes?: AuditEventType[];
    severity?: AuditSeverity[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface AuditStats {
    totalEvents: number;
    byEventType: Record<AuditEventType, number>;
    bySeverity: Record<AuditSeverity, number>;
    failedActions: number;
    uniqueUsers: number;
}

/**
 * Audit Logger - Core logging interface
 */
export class AuditLogger {
    private logs: AuditLog[] = [];
    private maxLogsInMemory = 10000;

    /**
     * Log an audit event
     */
    async log(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
        const auditLog: AuditLog = {
            id: this.generateId(),
            timestamp: new Date(),
            ...event,
        };

        // Add to in-memory buffer
        this.logs.push(auditLog);

        // Trim if necessary
        if (this.logs.length > this.maxLogsInMemory) {
            this.logs = this.logs.slice(-this.maxLogsInMemory);
        }

        // In production: Write to database/logging service
        // await this.persistToDatabase(auditLog);

        return auditLog.id;
    }

    /**
     * Query audit logs
     */
    async query(query: AuditQuery): Promise<AuditLog[]> {
        let filtered = [...this.logs];

        // Filter by organization
        if (query.organizationId) {
            filtered = filtered.filter(
                log => log.organizationId === query.organizationId
            );
        }

        // Filter by user
        if (query.userId) {
            filtered = filtered.filter(log => log.userId === query.userId);
        }

        // Filter by event types
        if (query.eventTypes && query.eventTypes.length > 0) {
            filtered = filtered.filter(log =>
                query.eventTypes!.includes(log.eventType)
            );
        }

        // Filter by severity
        if (query.severity && query.severity.length > 0) {
            filtered = filtered.filter(log =>
                query.severity!.includes(log.severity)
            );
        }

        // Filter by date range
        if (query.startDate) {
            filtered = filtered.filter(
                log => log.timestamp >= query.startDate!
            );
        }

        if (query.endDate) {
            filtered = filtered.filter(
                log => log.timestamp <= query.endDate!
            );
        }

        // Text search
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            filtered = filtered.filter(
                log =>
                    log.action.toLowerCase().includes(searchLower) ||
                    log.resource?.toLowerCase().includes(searchLower) ||
                    log.userEmail?.toLowerCase().includes(searchLower)
            );
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Pagination
        const offset = query.offset || 0;
        const limit = query.limit || 100;

        return filtered.slice(offset, offset + limit);
    }

    /**
     * Get audit statistics
     */
    async getStats(organizationId?: string): Promise<AuditStats> {
        let logs = this.logs;

        if (organizationId) {
            logs = logs.filter(log => log.organizationId === organizationId);
        }

        const byEventType = {} as Record<AuditEventType, number>;
        const bySeverity = {} as Record<AuditSeverity, number>;
        const uniqueUsers = new Set<string>();
        let failedActions = 0;

        for (const log of logs) {
            // Count by event type
            byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;

            // Count by severity
            bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;

            // Track unique users
            if (log.userId) {
                uniqueUsers.add(log.userId);
            }

            // Count failures
            if (!log.success) {
                failedActions++;
            }
        }

        return {
            totalEvents: logs.length,
            byEventType,
            bySeverity,
            failedActions,
            uniqueUsers: uniqueUsers.size,
        };
    }

    /**
     * Export logs to JSON
     */
    async exportLogs(query: AuditQuery): Promise<string> {
        const logs = await this.query(query);
        return JSON.stringify(logs, null, 2);
    }

    /**
     * Export logs to CSV
     */
    async exportCSV(query: AuditQuery): Promise<string> {
        const logs = await this.query(query);
        
        const headers = [
            'ID',
            'Timestamp',
            'Event Type',
            'Severity',
            'User Email',
            'Action',
            'Resource',
            'Success',
            'IP Address',
        ];

        const rows = logs.map(log => [
            log.id,
            log.timestamp.toISOString(),
            log.eventType,
            log.severity,
            log.userEmail || '',
            log.action,
            log.resource || '',
            log.success ? 'Yes' : 'No',
            log.ipAddress || '',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        return csv;
    }

    private generateId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}

/**
 * Helper functions for common audit operations
 */

export function logAuthEvent(
    logger: AuditLogger,
    eventType: Extract<AuditEventType, `auth.${string}`>,
    userId: string,
    email: string,
    success: boolean,
    metadata?: Record<string, any>
): Promise<string> {
    return logger.log({
        eventType,
        severity: success ? 'info' : 'warning',
        userId,
        userEmail: email,
        action: eventType.replace('auth.', '').replace('-', ' '),
        success,
        metadata,
    });
}

export function logUserChange(
    logger: AuditLogger,
    eventType: Extract<AuditEventType, `user.${string}`>,
    actorId: string,
    actorEmail: string,
    targetUserId: string,
    changes?: { before?: any; after?: any }
): Promise<string> {
    return logger.log({
        eventType,
        severity: 'info',
        userId: actorId,
        userEmail: actorEmail,
        action: eventType.replace('user.', '').replace('-', ' '),
        resource: 'user',
        resourceId: targetUserId,
        changes,
        success: true,
    });
}

export function logSecurityEvent(
    logger: AuditLogger,
    eventType: Extract<AuditEventType, `security.${string}`>,
    userId: string | undefined,
    email: string | undefined,
    details: string,
    ipAddress?: string
): Promise<string> {
    return logger.log({
        eventType,
        severity: 'critical',
        userId,
        userEmail: email,
        action: details,
        ipAddress,
        success: false,
    });
}

/**
 * Singleton audit logger instance
 */
export const auditLogger = new AuditLogger();

/**
 * Express/Next.js middleware for automatic audit logging
 */
export function auditMiddleware(logger: AuditLogger) {
    return async (req: any, res: any, next: any) => {
        const startTime = Date.now();
        const user = req.user;

        // Capture response
        const originalSend = res.send;
        res.send = function (data: any) {
            res.send = originalSend;
            
            // Log request
            logger.log({
                eventType: 'security.suspicious-activity', // Default, should be overridden
                severity: 'info',
                userId: user?.id,
                userEmail: user?.email,
                userRole: user?.role,
                action: `${req.method} ${req.path}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                success: res.statusCode < 400,
                metadata: {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: Date.now() - startTime,
                },
            });

            return originalSend.call(this, data);
        };

        next();
    };
}
