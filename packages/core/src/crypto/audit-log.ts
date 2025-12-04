/**
 * Secure Audit Log with HMAC-SHA256 Integrity Verification
 * Provides cryptographic verification for append-only audit logs
 * 
 * Usage:
 *   import { SecureAuditLog } from '@odavl-studio/core/crypto';
 *   
 *   const log = new SecureAuditLog(process.env.AUDIT_SECRET);
 *   const entry = log.append({ decision: 'approved', reason: 'high_trust' });
 *   fs.appendFileSync('.odavl/audit/autoapproval.jsonl', entry);
 *   
 *   const isValid = log.verify(auditLogContent);
 */

import crypto from 'crypto';

export interface AuditEntry {
  timestamp?: string;
  [key: string]: any;
}

export interface SecureAuditEntry extends AuditEntry {
  hash: string;
  timestamp: string;
}

export class SecureAuditLog {
  private readonly secret: string;
  private readonly algorithm = 'sha256';

  /**
   * Creates a new SecureAuditLog instance
   * @param secret - Secret key for HMAC generation (should be from env var)
   */
  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error('Audit secret must be at least 32 characters');
    }
    this.secret = secret;
  }

  /**
   * Appends an entry to the audit log with HMAC verification
   * @param entry - Audit entry data (timestamp will be added if missing)
   * @returns JSONL line (JSON + newline) ready to append to file
   */
  append(entry: AuditEntry): string {
    const timestamp = entry.timestamp || new Date().toISOString();
    const dataWithTimestamp = { ...entry, timestamp };

    // Calculate HMAC-SHA256
    const hash = this.calculateHash(dataWithTimestamp);

    const secureEntry: SecureAuditEntry = {
      ...dataWithTimestamp,
      hash
    };

    return JSON.stringify(secureEntry) + '\n';
  }

  /**
   * Verifies the integrity of an entire audit log
   * @param log - Complete audit log content (JSONL format)
   * @returns true if all entries are valid, false otherwise
   */
  verify(log: string): boolean {
    const lines = log.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      try {
        const entry: SecureAuditEntry = JSON.parse(line);
        
        if (!this.verifyEntry(entry)) {
          return false;
        }
      } catch (error) {
        console.error('Failed to parse audit log entry:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Verifies a single audit log entry
   * @param entry - Audit entry with hash
   * @returns true if hash is valid, false otherwise
   */
  verifyEntry(entry: SecureAuditEntry): boolean {
    const { hash, ...data } = entry;

    if (!hash) {
      console.error('Audit entry missing hash');
      return false;
    }

    const expectedHash = this.calculateHash(data);
    return hash === expectedHash;
  }

  /**
   * Calculates HMAC-SHA256 hash for audit data
   * @param data - Data to hash
   * @returns HMAC-SHA256 hash in hexadecimal
   */
  private calculateHash(data: any): string {
    const dataString = this.canonicalize(data);
    
    return crypto
      .createHmac(this.algorithm, this.secret)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Canonicalizes data to ensure consistent hashing
   * Sorts object keys and stringifies in deterministic way
   * @param data - Data to canonicalize
   * @returns Canonical JSON string
   */
  private canonicalize(data: any): string {
    if (typeof data !== 'object' || data === null) {
      return JSON.stringify(data);
    }

    if (Array.isArray(data)) {
      return JSON.stringify(data.map(item => this.canonicalize(item)));
    }

    // Sort keys for deterministic output
    const sortedKeys = Object.keys(data).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = data[key];
    }

    return JSON.stringify(sortedObj);
  }

  /**
   * Extracts all entries from an audit log
   * @param log - Complete audit log content (JSONL format)
   * @returns Array of audit entries (without hashes)
   */
  static parseLog(log: string): AuditEntry[] {
    const lines = log.split('\n').filter(line => line.trim().length > 0);
    const entries: AuditEntry[] = [];

    for (const line of lines) {
      try {
        const entry: SecureAuditEntry = JSON.parse(line);
        const { hash, ...data } = entry;
        entries.push(data);
      } catch (error) {
        console.error('Failed to parse audit log entry:', error);
      }
    }

    return entries;
  }

  /**
   * Generates a summary of audit log statistics
   * @param log - Complete audit log content (JSONL format)
   * @returns Summary statistics
   */
  static analyzLog(log: string): {
    totalEntries: number;
    firstEntry: string | null;
    lastEntry: string | null;
    decisionCounts: Record<string, number>;
  } {
    const entries = SecureAuditLog.parseLog(log);

    const decisionCounts: Record<string, number> = {};
    
    for (const entry of entries) {
      const decision = entry.decision || 'unknown';
      decisionCounts[decision] = (decisionCounts[decision] || 0) + 1;
    }

    return {
      totalEntries: entries.length,
      firstEntry: entries.length > 0 ? entries[0].timestamp : null,
      lastEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
      decisionCounts
    };
  }
}

/**
 * Utility function to create a secure audit log instance
 * Reads secret from environment variable
 */
export function createAuditLog(): SecureAuditLog {
  const secret = process.env.ODAVL_AUDIT_SECRET || process.env.AUDIT_SECRET;
  
  if (!secret) {
    throw new Error(
      'ODAVL_AUDIT_SECRET or AUDIT_SECRET environment variable must be set'
    );
  }

  return new SecureAuditLog(secret);
}
