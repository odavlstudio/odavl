/**
 * Audit Logger Module
 * 
 * Provides comprehensive audit logging for security-sensitive operations.
 * Uses Winston with daily file rotation for compliance and forensic analysis.
 * 
 * @module audit-logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

/**
 * Audit log directory
 */
const AUDIT_LOG_DIR = path.join(process.cwd(), 'logs', 'audit');

// Ensure audit log directory exists
if (!fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

/**
 * Audit event types
 */
export enum AuditEventType {
    // Authentication
    LOGIN_SUCCESS = 'auth.login.success',
    LOGIN_FAILURE = 'auth.login.failure',
    LOGOUT = 'auth.logout',
    TOKEN_CREATED = 'auth.token.created',
    TOKEN_REVOKED = 'auth.token.revoked',

    // Authorization
    ACCESS_GRANTED = 'authz.access.granted',
    ACCESS_DENIED = 'authz.access.denied',

    // Organization Management
    ORG_CREATED = 'org.created',
    ORG_UPDATED = 'org.updated',
    ORG_DELETED = 'org.deleted',
    ORG_MEMBER_ADDED = 'org.member.added',
    ORG_MEMBER_REMOVED = 'org.member.removed',
    ORG_ROLE_CHANGED = 'org.role.changed',

    // API Keys
    API_KEY_CREATED = 'apikey.created',
    API_KEY_REVOKED = 'apikey.revoked',
    API_KEY_USED = 'apikey.used',

    // Data Operations
    DATA_READ = 'data.read',
    DATA_CREATED = 'data.created',
    DATA_UPDATED = 'data.updated',
    DATA_DELETED = 'data.deleted',

    // Security Events
    SECURITY_VIOLATION = 'security.violation',
    RATE_LIMIT_EXCEEDED = 'security.rate_limit',
    CSRF_VIOLATION = 'security.csrf',
    SIGNATURE_INVALID = 'security.signature',

    // System Events
    SYSTEM_ERROR = 'system.error',
    SYSTEM_CONFIG_CHANGED = 'system.config.changed',
}

/**
 * Audit event severity
 */
export enum AuditSeverity {
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    CRITICAL = 'critical',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
    timestamp: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    actor: {
        userId?: string;
        email?: string;
        organizationId?: string;
        apiKeyId?: string;
        ipAddress?: string;
        userAgent?: string;
    };
    resource: {
        type: string;
        id?: string;
        name?: string;
    };
    action: string;
    result: 'success' | 'failure';
    metadata?: Record<string, any>;
    error?: {
        message: string;
        code?: string;
        stack?: string;
    };
}

/**
 * Winston audit logger configuration
 */
const auditLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        // Daily rotating file transport
        new DailyRotateFile({
            dirname: AUDIT_LOG_DIR,
            filename: 'audit-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m', // Rotate when file reaches 20MB
            maxFiles: '90d', // Keep logs for 90 days (compliance requirement)
            zippedArchive: true, // Compress old logs
            format: winston.format.json(),
        }),

        // Separate file for critical events
        new DailyRotateFile({
            dirname: AUDIT_LOG_DIR,
            filename: 'audit-critical-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '365d', // Keep critical logs for 1 year
            zippedArchive: true,
            level: 'error',
            format: winston.format.json(),
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    auditLogger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

/**
 * Log an audit event
 * 
 * @param {AuditLogEntry} entry - Audit log entry
 * 
 * @example
 * logAuditEvent({
 *   eventType: AuditEventType.LOGIN_SUCCESS,
 *   severity: AuditSeverity.INFO,
 *   actor: { userId: '123', email: 'user@example.com', ipAddress: '1.2.3.4' },
 *   resource: { type: 'session', id: 'sess-456' },
 *   action: 'login',
 *   result: 'success',
 * });
 */
export function logAuditEvent(entry: AuditLogEntry): void {
    const logEntry = {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
    };

    // Map severity to Winston log level
    const level = entry.severity === AuditSeverity.CRITICAL ? 'error' : entry.severity;

    auditLogger.log(level, 'Audit event', logEntry);
}

/**
 * Log authentication event
 */
export function logAuthEvent(params: {
    type: 'login' | 'logout' | 'token_created' | 'token_revoked';
    userId?: string;
    email?: string;
    organizationId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
}): void {
    const eventTypeMap = {
        login: params.success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE,
        logout: AuditEventType.LOGOUT,
        token_created: AuditEventType.TOKEN_CREATED,
        token_revoked: AuditEventType.TOKEN_REVOKED,
    };

    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: eventTypeMap[params.type],
        severity: params.success ? AuditSeverity.INFO : AuditSeverity.WARN,
        actor: {
            userId: params.userId,
            email: params.email,
            organizationId: params.organizationId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        },
        resource: { type: 'authentication' },
        action: params.type,
        result: params.success ? 'success' : 'failure',
        error: params.error ? { message: params.error } : undefined,
    });
}

/**
 * Log authorization event
 */
export function logAuthzEvent(params: {
    userId?: string;
    organizationId?: string;
    resource: { type: string; id?: string };
    action: string;
    granted: boolean;
    reason?: string;
}): void {
    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: params.granted ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED,
        severity: params.granted ? AuditSeverity.INFO : AuditSeverity.WARN,
        actor: {
            userId: params.userId,
            organizationId: params.organizationId,
        },
        resource: params.resource,
        action: params.action,
        result: params.granted ? 'success' : 'failure',
        metadata: params.reason ? { reason: params.reason } : undefined,
    });
}

/**
 * Log data operation
 */
export function logDataOperation(params: {
    operation: 'read' | 'create' | 'update' | 'delete';
    userId?: string;
    organizationId?: string;
    resource: { type: string; id?: string; name?: string };
    success: boolean;
    metadata?: Record<string, any>;
    error?: string;
}): void {
    const eventTypeMap = {
        read: AuditEventType.DATA_READ,
        create: AuditEventType.DATA_CREATED,
        update: AuditEventType.DATA_UPDATED,
        delete: AuditEventType.DATA_DELETED,
    };

    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: eventTypeMap[params.operation],
        severity: params.success ? AuditSeverity.INFO : AuditSeverity.ERROR,
        actor: {
            userId: params.userId,
            organizationId: params.organizationId,
        },
        resource: params.resource,
        action: params.operation,
        result: params.success ? 'success' : 'failure',
        metadata: params.metadata,
        error: params.error ? { message: params.error } : undefined,
    });
}

/**
 * Log security violation
 */
export function logSecurityViolation(params: {
    type: 'rate_limit' | 'csrf' | 'signature' | 'other';
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource: string;
    details: string;
}): void {
    const eventTypeMap = {
        rate_limit: AuditEventType.RATE_LIMIT_EXCEEDED,
        csrf: AuditEventType.CSRF_VIOLATION,
        signature: AuditEventType.SIGNATURE_INVALID,
        other: AuditEventType.SECURITY_VIOLATION,
    };

    logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: eventTypeMap[params.type],
        severity: AuditSeverity.CRITICAL,
        actor: {
            userId: params.userId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        },
        resource: { type: 'security', name: params.resource },
        action: 'violation',
        result: 'failure',
        metadata: { details: params.details },
    });
}

/**
 * Query audit logs (for admin dashboard)
 * 
 * @param {object} filters - Query filters
 * @returns {Promise<AuditLogEntry[]>} Filtered audit logs
 * 
 * @example
 * const logs = await queryAuditLogs({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 *   userId: '123',
 *   eventType: AuditEventType.LOGIN_SUCCESS,
 * });
 */
export async function queryAuditLogs(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    organizationId?: string;
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    limit?: number;
}): Promise<AuditLogEntry[]> {
    // TODO: Implement log querying
    // For production, consider using a log aggregation service (ELK, Splunk, etc.)
    // or database storage for efficient querying

    console.warn('queryAuditLogs not implemented - use log aggregation service');
    return [];
}

export default auditLogger;
