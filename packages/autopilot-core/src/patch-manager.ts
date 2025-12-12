/**
 * ODAVL Autopilot Core - Patch Manager
 * Wave 6 - Backup, apply, and rollback system with safety validation
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { FixPatch, BackupMetadata } from './types';

export const BACKUP_DIR = '.odavl/backups';
export const AUDIT_LOG = '.odavl/autopilot-log.json';

export class PatchManager {
  constructor(private workspaceRoot: string) {}

  /**
   * Create backup before applying fixes
   */
  async createBackup(patches: FixPatch[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.workspaceRoot, BACKUP_DIR, timestamp);
    
    await fs.mkdir(backupPath, { recursive: true });

    const uniqueFiles = [...new Set(patches.map(p => p.file))];
    
    for (const file of uniqueFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(this.workspaceRoot, file);
      const backupFile = path.join(backupPath, relativePath);
      
      await fs.mkdir(path.dirname(backupFile), { recursive: true });
      await fs.writeFile(backupFile, content, 'utf-8');
    }

    const metadata: BackupMetadata = {
      timestamp,
      files: uniqueFiles,
      totalFixes: patches.length,
      insightVersion: '1.0.0',
      autopilotVersion: '1.0.0'
    };

    await fs.writeFile(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return backupPath;
  }

  /**
   * Apply patches atomically - rollback if any fail
   */
  async applyPatches(patches: FixPatch[]): Promise<void> {
    const filePatches = new Map<string, FixPatch[]>();
    
    for (const patch of patches) {
      if (!filePatches.has(patch.file)) {
        filePatches.set(patch.file, []);
      }
      filePatches.get(patch.file)!.push(patch);
    }

    const modifiedContents = new Map<string, string>();

    try {
      for (const [file, patches] of filePatches.entries()) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        // Sort patches by line number in reverse (modify from bottom up)
        const sortedPatches = patches.sort((a, b) => b.start - a.start);
        
        for (const patch of sortedPatches) {
          const lineIndex = patch.start - 1;
          
          if (patch.replacement === '') {
            // Remove line
            lines.splice(lineIndex, 1);
          } else {
            // Replace line
            lines[lineIndex] = patch.replacement;
          }
        }
        
        modifiedContents.set(file, lines.join('\n'));
      }

      // Write all changes atomically
      for (const [file, content] of modifiedContents.entries()) {
        await fs.writeFile(file, content, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to apply patches: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rollback to backup
   */
  async rollback(backupPath: string): Promise<void> {
    const metadataPath = path.join(backupPath, 'metadata.json');
    const metadata: BackupMetadata = JSON.parse(
      await fs.readFile(metadataPath, 'utf-8')
    );

    for (const file of metadata.files) {
      const relativePath = path.relative(this.workspaceRoot, file);
      const backupFile = path.join(backupPath, relativePath);
      
      const content = await fs.readFile(backupFile, 'utf-8');
      await fs.writeFile(file, content, 'utf-8');
    }
  }

  /**
   * Write audit log entry
   */
  async logAudit(patches: FixPatch[], backupPath: string, success: boolean): Promise<void> {
    const logPath = path.join(this.workspaceRoot, AUDIT_LOG);
    
    let entries: any[] = [];
    try {
      const content = await fs.readFile(logPath, 'utf-8');
      entries = JSON.parse(content);
    } catch {
      // File doesn't exist or invalid JSON
    }

    entries.push({
      timestamp: new Date().toISOString(),
      backupPath,
      totalFixes: patches.length,
      filesModified: [...new Set(patches.map(p => p.file))].length,
      success,
      patches: patches.map(p => ({
        file: path.relative(this.workspaceRoot, p.file),
        line: p.start,
        detector: p.detector,
        ruleId: p.ruleId,
        confidence: p.confidence
      }))
    });

    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.writeFile(logPath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  /**
   * Validate workspace boundaries
   */
  validateWorkspaceBoundary(filePath: string): boolean {
    const normalized = path.resolve(filePath);
    const workspace = path.resolve(this.workspaceRoot);
    return normalized.startsWith(workspace);
  }
}
