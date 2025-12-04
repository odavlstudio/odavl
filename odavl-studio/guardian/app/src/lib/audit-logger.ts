/**
 * ODAVL Guardian - Audit Logger (Stub)
 * Simplified console-based audit logging
 */

export enum AuditEventType {
  AUTH = 'auth',
  ACCESS = 'access',
  DATA = 'data',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
}

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export class AuditLogger {
  log(event: AuditEvent): void {
    console.log('[AUDIT]', {
      ...event,
      timestamp: event.timestamp || new Date(),
    });
  }

  logAuth(userId: string, action: string, metadata?: Record<string, any>): void {
    this.log({
      type: AuditEventType.AUTH,
      userId,
      action,
      metadata,
    });
  }

  logAccess(userId: string, resource: string, action: string, metadata?: Record<string, any>): void {
    this.log({
      type: AuditEventType.ACCESS,
      userId,
      resource,
      action,
      metadata,
    });
  }

  logSecurityEvent(action: string, metadata?: Record<string, any>): void {
    this.log({
      type: AuditEventType.SECURITY,
      action,
      metadata,
    });
  }
}

export const auditLogger = new AuditLogger();
