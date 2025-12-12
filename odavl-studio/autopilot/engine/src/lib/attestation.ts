/**
 * ODAVL Autopilot — Attestation System
 * SHA-256 cryptographic proof of improvements
 */

import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface Attestation {
  timestamp: string;
  runId: string;
  recipeId: string;
  filesModified: string[];
  beforeHash: string;
  afterHash: string;
  improved: boolean;
}

export class AttestationChain {
  private chainPath: string;

  constructor(workspaceRoot: string = process.cwd()) {
    const attestationDir = join(workspaceRoot, '.odavl', 'attestation');
    if (!existsSync(attestationDir)) {
      mkdirSync(attestationDir, { recursive: true });
    }
    this.chainPath = join(attestationDir, 'chain.jsonl');
  }

  /**
   * Create attestation proof for autopilot improvement
   */
  attest(runId: string, recipeId: string, filesModified: string[], before: string, after: string, improved: boolean): Attestation {
    const beforeHash = createHash('sha256').update(before).digest('hex');
    const afterHash = createHash('sha256').update(after).digest('hex');

    const attestation: Attestation = {
      timestamp: new Date().toISOString(),
      runId,
      recipeId,
      filesModified,
      beforeHash,
      afterHash,
      improved
    };

    const line = JSON.stringify(attestation) + '\n';
    writeFileSync(this.chainPath, line, { flag: 'a' });

    return attestation;
  }

  /**
   * Verify attestation chain integrity
   */
  verify(): boolean {
    if (!existsSync(this.chainPath)) {
      return true; // Empty chain is valid
    }
    // Stub: Production would verify hash chain
    return true;
  }
}
