// Audit Log Schema
export interface AuditLog {
  id: string;
  timestamp: Date;
  actor: {
    userId: string;
    email: string;
    role: string;
    ip: string;
  };
  action: string;
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  changes?: {
    before: any;
    after: any;
  };
  metadata: {
    userAgent: string;
    location?: string;
    sessionId: string;
  };
  result: 'success' | 'failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
}