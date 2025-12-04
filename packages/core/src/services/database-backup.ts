/**
 * Automated Database Backup Service
 * Backs up PostgreSQL database to S3 daily
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { cloudStorage } from './cloud-storage';
import path from 'path';

const execAsync = promisify(exec);

export interface BackupOptions {
  databaseUrl?: string;
  s3Bucket?: string;
  retentionDays?: number;
  compress?: boolean;
}

export interface BackupResult {
  success: boolean;
  filename: string;
  s3Key?: string;
  size?: number;
  duration?: number;
  error?: string;
}

/**
 * Database Backup Service (Singleton)
 * Automated backups with S3 storage and retention management
 */
export class DatabaseBackupService {
  private static instance: DatabaseBackupService;
  private databaseUrl: string;
  private s3Bucket: string;
  private retentionDays: number;

  private constructor() {
    this.databaseUrl = process.env.DATABASE_URL || '';
    this.s3Bucket = process.env.AWS_S3_BUCKET || 'odavl-storage';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }
  }

  public static getInstance(): DatabaseBackupService {
    if (!DatabaseBackupService.instance) {
      DatabaseBackupService.instance = new DatabaseBackupService();
    }
    return DatabaseBackupService.instance;
  }

  /**
   * Create database backup and upload to S3
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql${options.compress !== false ? '.gz' : ''}`;
    const localPath = path.join('/tmp', filename);

    console.log(`[Backup] Starting database backup: ${filename}`);

    try {
      // Step 1: Create database dump
      const databaseUrl = options.databaseUrl || this.databaseUrl;
      const dumpCommand = options.compress !== false
        ? `pg_dump "${databaseUrl}" | gzip > ${localPath}`
        : `pg_dump "${databaseUrl}" > ${localPath}`;

      await execAsync(dumpCommand);
      console.log(`[Backup] Database dump created: ${localPath}`);

      // Step 2: Get file size
      const { stdout: sizeOutput } = await execAsync(`du -b ${localPath} | cut -f1`);
      const size = parseInt(sizeOutput.trim(), 10);

      // Step 3: Upload to S3
      const s3Key = `backups/database/${filename}`;
      const buffer = require('fs').readFileSync(localPath);

      await cloudStorage.uploadBuffer(buffer, s3Key, 'application/sql', {
        backupType: 'database',
        timestamp: new Date().toISOString(),
        size: size.toString(),
      });

      console.log(`[Backup] Uploaded to S3: ${s3Key}`);

      // Step 4: Cleanup local file
      await unlink(localPath);
      console.log(`[Backup] Cleaned up local file: ${localPath}`);

      // Step 5: Cleanup old backups
      await this.cleanupOldBackups(options.retentionDays || this.retentionDays);

      const duration = Date.now() - startTime;
      console.log(`[Backup] Backup completed in ${duration}ms`);

      return {
        success: true,
        filename,
        s3Key,
        size,
        duration,
      };
    } catch (error) {
      console.error('[Backup] Backup failed:', error);

      // Cleanup on error
      try {
        await unlink(localPath);
      } catch {}

      return {
        success: false,
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore database from S3 backup
   */
  async restoreBackup(s3Key: string, targetDatabaseUrl?: string): Promise<boolean> {
    const localPath = path.join('/tmp', path.basename(s3Key));

    console.log(`[Backup] Starting restore from: ${s3Key}`);

    try {
      // Step 1: Download from S3
      const downloadUrl = await cloudStorage.generateDownloadUrl(s3Key, 3600);
      await execAsync(`curl -o ${localPath} "${downloadUrl}"`);
      console.log(`[Backup] Downloaded from S3: ${localPath}`);

      // Step 2: Restore database
      const databaseUrl = targetDatabaseUrl || this.databaseUrl;
      const isCompressed = s3Key.endsWith('.gz');
      
      const restoreCommand = isCompressed
        ? `gunzip -c ${localPath} | psql "${databaseUrl}"`
        : `psql "${databaseUrl}" < ${localPath}`;

      await execAsync(restoreCommand);
      console.log(`[Backup] Database restored successfully`);

      // Step 3: Cleanup
      await unlink(localPath);

      return true;
    } catch (error) {
      console.error('[Backup] Restore failed:', error);

      // Cleanup on error
      try {
        await unlink(localPath);
      } catch {}

      return false;
    }
  }

  /**
   * List available backups in S3
   */
  async listBackups(): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    try {
      const result = await cloudStorage.listFiles({
        prefix: 'backups/database/',
        maxKeys: 100,
      });

      return result.files.map((file) => ({
        key: file.key,
        size: file.size,
        lastModified: new Date(file.lastModified),
      }));
    } catch (error) {
      console.error('[Backup] Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete backups older than retention period
   */
  async cleanupOldBackups(retentionDays: number): Promise<number> {
    console.log(`[Backup] Cleaning up backups older than ${retentionDays} days`);

    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldBackups = backups.filter((backup) => backup.lastModified < cutoffDate);

      let deletedCount = 0;
      for (const backup of oldBackups) {
        try {
          await cloudStorage.deleteFile(backup.key);
          console.log(`[Backup] Deleted old backup: ${backup.key}`);
          deletedCount++;
        } catch (error) {
          console.error(`[Backup] Failed to delete ${backup.key}:`, error);
        }
      }

      console.log(`[Backup] Cleanup complete: ${deletedCount} backups deleted`);
      return deletedCount;
    } catch (error) {
      console.error('[Backup] Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Verify backup integrity (test restore to temporary database)
   */
  async verifyBackup(s3Key: string): Promise<boolean> {
    console.log(`[Backup] Verifying backup: ${s3Key}`);

    // TODO: Implement backup verification
    // 1. Create temporary database
    // 2. Restore backup to temp DB
    // 3. Run basic queries to verify
    // 4. Drop temporary database

    console.warn('[Backup] Backup verification not yet implemented');
    return true;
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    latestBackup?: Date;
  }> {
    try {
      const backups = await this.listBackups();

      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
        };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const dates = backups.map((b) => b.lastModified);

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: new Date(Math.min(...dates.map((d) => d.getTime()))),
        latestBackup: new Date(Math.max(...dates.map((d) => d.getTime()))),
      };
    } catch (error) {
      console.error('[Backup] Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
      };
    }
  }
}

// Export singleton instance
export const databaseBackupService = DatabaseBackupService.getInstance();
