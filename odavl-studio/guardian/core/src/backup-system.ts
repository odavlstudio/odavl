/**
 * Backup System
 * Creates file backups before modifications for rollback capability
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Backup {
  timestamp: string;
  files: BackupFile[];
  restorePath: string;
}

export interface BackupFile {
  originalPath: string;
  backupPath: string;
  content: string;
  hash: string;
}

export class BackupSystem {
  private backupDir: string;

  constructor(workspaceRoot: string) {
    this.backupDir = path.join(workspaceRoot, '.odavl', 'guardian', 'backups');
  }

  /**
   * Create backup before modifications
   */
  async createBackup(filePaths: string[]): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupId);

    // Ensure backup directory exists
    await fs.mkdir(backupPath, { recursive: true });

    const files: BackupFile[] = [];

    for (const filePath of filePaths) {
      try {
        // Read original file
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Generate hash for integrity verification
        const hash = this.generateHash(content);
        
        // Create backup filename
        const relativePath = path.basename(filePath);
        const backupFilePath = path.join(backupPath, relativePath);
        
        // Write backup
        await fs.writeFile(backupFilePath, content, 'utf-8');

        files.push({
          originalPath: filePath,
          backupPath: backupFilePath,
          content,
          hash,
        });
      } catch (error) {
        console.error(`Failed to backup ${filePath}:`, error);
      }
    }

    // Write backup manifest
    const backup: Backup = {
      timestamp,
      files,
      restorePath: backupPath,
    };

    await fs.writeFile(
      path.join(backupPath, 'manifest.json'),
      JSON.stringify(backup, null, 2),
      'utf-8'
    );

    return backup;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    // Read manifest
    const manifestPath = path.join(backupPath, 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const backup: Backup = JSON.parse(manifestContent);

    // Restore each file
    for (const file of backup.files) {
      try {
        // Read backup content
        const backupContent = await fs.readFile(file.backupPath, 'utf-8');
        
        // Verify integrity
        const hash = this.generateHash(backupContent);
        if (hash !== file.hash) {
          console.warn(`Hash mismatch for ${file.originalPath}, skipping`);
          continue;
        }

        // Restore original file
        await fs.writeFile(file.originalPath, backupContent, 'utf-8');
        console.log(`✅ Restored ${file.originalPath}`);
      } catch (error) {
        console.error(`Failed to restore ${file.originalPath}:`, error);
      }
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<string[]> {
    try {
      const backups = await fs.readdir(this.backupDir);
      return backups.filter(name => name.startsWith('backup-'));
    } catch {
      return [];
    }
  }

  /**
   * Delete old backups (keep last 10)
   */
  async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    
    if (backups.length <= 10) return;

    // Sort by timestamp (oldest first)
    backups.sort();
    
    // Delete oldest backups
    const toDelete = backups.slice(0, backups.length - 10);
    
    for (const backup of toDelete) {
      const backupPath = path.join(this.backupDir, backup);
      await fs.rm(backupPath, { recursive: true, force: true });
      console.log(`🗑️  Deleted old backup: ${backup}`);
    }
  }

  /**
   * Generate simple hash for content verification
   */
  private generateHash(content: string): string {
    // Simple hash: length + first 100 chars + last 100 chars
    const first = content.slice(0, 100);
    const last = content.slice(-100);
    return `${content.length}-${first}-${last}`;
  }

  /**
   * Get backup info
   */
  async getBackupInfo(backupId: string): Promise<Backup | null> {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      const manifestPath = path.join(backupPath, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
