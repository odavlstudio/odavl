/**
 * ODAVL Telemetry — Audit Trail
 * SHA-256 attestation chain for autopilot improvements
 */

import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface AuditEntry {
  timestamp: string;
  action: string;
  product: 'insight' | 'autopilot' | 'guardian';
  hash: string;
  metadata?: Record<string, unknown>;
}

export class AuditTrail {
  private auditPath: string;

  constructor(workspaceRoot: string = process.cwd()) {
    const auditDir = join(workspaceRoot, '.odavl', 'audit');
    if (!existsSync(auditDir)) {
      mkdirSync(auditDir, { recursive: true });
    }
    this.auditPath = join(auditDir, 'trail.jsonl');
  }

  /**
   * Record an auditable action with SHA-256 proof
   */
  record(action: string, product: 'insight' | 'autopilot' | 'guardian', data: string, metadata?: Record<string, unknown>): string {
    const hash = createHash('sha256').update(data).digest('hex');
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      product,
      hash,
      ...(metadata && { metadata })
    };
    const line = JSON.stringify(entry) + '\n';
    writeFileSync(this.auditPath, line, { flag: 'a' });
    return hash;
  }
}
