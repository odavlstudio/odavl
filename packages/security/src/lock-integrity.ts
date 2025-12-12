/**
 * ODAVL Security — Lock Integrity Check
 * Verify pnpm-lock.yaml hasn't been tampered with
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

export interface IntegrityResult {
  valid: boolean;
  hash: string;
  timestamp: string;
}

export class LockIntegrity {
  /**
   * Compute SHA-256 hash of lockfile
   */
  computeHash(lockfilePath: string): string {
    if (!existsSync(lockfilePath)) {
      throw new Error(`Lockfile not found: ${lockfilePath}`);
    }
    const content = readFileSync(lockfilePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify lockfile integrity against expected hash
   */
  verify(lockfilePath: string, expectedHash: string): IntegrityResult {
    const actualHash = this.computeHash(lockfilePath);
    return {
      valid: actualHash === expectedHash,
      hash: actualHash,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if lockfile exists and is readable
   */
  check(lockfilePath: string): boolean {
    return existsSync(lockfilePath);
  }
}
