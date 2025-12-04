/**
 * Database Backup Service
 */

import { spawn } from 'child_process';
import { createWriteStream, createReadStream, existsSync, mkdirSync } from 'fs';
import { readdir, stat, unlink } from 'fs/promises';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import type {
  BackupConfig,
  BackupMetadata,
  BackupResult,
  RestoreOptions,
  RestoreResult,
  BackupListItem,
} from './types';

export class BackupService {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config: BackupConfig) {
    this.config = config;
    this.backupDir = config.storage.localPath || '.odavl-backups';

    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create database backup
   */
  async createBackup(type: 'full' | 'incremental' = 'full'): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}-${type}`;
    const filename = `${backupId}.sql.gz`;
    const filePath = join(this.backupDir, filename);

    try {
      // Generate pg_dump command
      const dumpArgs = this.buildPgDumpArgs(type);

      // Execute pg_dump
      await this.executePgDump(dumpArgs, filePath);

      // Calculate checksum
      const checksum = await this.calculateChecksum(filePath);

      // Get file size
      const stats = await stat(filePath);
      const size = stats.size;

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        database: this.config.database.database,
        size,
        duration: Date.now() - startTime,
        type,
        status: 'success',
        checksum,
        location: filePath,
      };

      // Save metadata
      await this.saveMetadata(metadata);

      // Upload to cloud storage if configured
      let uploadUrl: string | undefined;
      if (this.config.storage.provider !== 'local') {
        uploadUrl = await this.uploadToCloud(filePath, filename);
      }

      // Apply retention policy
      await this.applyRetentionPolicy();

      return {
        success: true,
        metadata,
        filePath,
        uploadUrl,
      };
    } catch (error: any) {
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        database: this.config.database.database,
        size: 0,
        duration: Date.now() - startTime,
        type,
        status: 'failed',
        error: error.message,
        checksum: '',
        location: filePath,
      };

      await this.saveMetadata(metadata);

      return {
        success: false,
        metadata,
        filePath,
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Find backup file
      const backupPath = await this.findBackup(options.backupId);
      if (!backupPath) {
        throw new Error(`Backup not found: ${options.backupId}`);
      }

      // Verify checksum
      const metadata = await this.loadMetadata(options.backupId);
      const currentChecksum = await this.calculateChecksum(backupPath);
      if (currentChecksum !== metadata.checksum) {
        warnings.push('Checksum mismatch - backup may be corrupted');
      }

      // Generate psql command
      const restoreArgs = this.buildPsqlArgs(options);

      // Execute psql
      await this.executePsql(restoreArgs, backupPath, options.continueOnError || false);

      return {
        success: true,
        duration: Date.now() - startTime,
        errors,
        warnings,
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupListItem[]> {
    const files = await readdir(this.backupDir);
    const backups: BackupListItem[] = [];

    for (const file of files) {
      if (file.endsWith('.sql.gz')) {
        const backupId = file.replace('.sql.gz', '');
        try {
          const metadata = await this.loadMetadata(backupId);
          backups.push({
            id: metadata.id,
            timestamp: metadata.timestamp,
            size: metadata.size,
            type: metadata.type,
            location: metadata.location,
          });
        } catch {
          // Skip invalid backups
        }
      }
    }

    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = await this.findBackup(backupId);
    if (backupPath) {
      await unlink(backupPath);
    }

    const metadataPath = join(this.backupDir, `${backupId}.meta.json`);
    if (existsSync(metadataPath)) {
      await unlink(metadataPath);
    }
  }

  /**
   * Build pg_dump arguments
   */
  private buildPgDumpArgs(type: 'full' | 'incremental'): string[] {
    const args = [
      '-h', this.config.database.host,
      '-p', this.config.database.port.toString(),
      '-U', this.config.database.user,
      '-d', this.config.database.database,
      '--no-password',
      '--verbose',
    ];

    if (type === 'full') {
      args.push('--clean', '--create', '--if-exists');
    } else {
      args.push('--data-only', '--inserts');
    }

    return args;
  }

  /**
   * Execute pg_dump
   */
  private async executePgDump(args: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.config.database.password };
      const pgDump = spawn('pg_dump', args, { env });
      const gzip = createGzip();
      const output = createWriteStream(outputPath);

      pgDump.stdout.pipe(gzip).pipe(output);

      let stderr = '';
      pgDump.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pgDump.on('error', (error) => reject(error));
      output.on('error', (error) => reject(error));

      output.on('finish', () => {
        if (pgDump.exitCode === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Build psql arguments
   */
  private buildPsqlArgs(options: RestoreOptions): string[] {
    const targetDb = options.targetDatabase || this.config.database.database;

    const args = [
      '-h', this.config.database.host,
      '-p', this.config.database.port.toString(),
      '-U', this.config.database.user,
      '-d', targetDb,
      '--no-password',
    ];

    if (options.continueOnError) {
      args.push('--single-transaction');
    }

    return args;
  }

  /**
   * Execute psql
   */
  private async executePsql(
    args: string[],
    backupPath: string,
    continueOnError: boolean
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: this.config.database.password };
      const psql = spawn('psql', args, { env });
      const gunzip = createGunzip();
      const input = createReadStream(backupPath);

      input.pipe(gunzip).pipe(psql.stdin);

      let stderr = '';
      psql.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      psql.on('error', (error) => reject(error));

      psql.on('close', (code) => {
        if (code === 0 || continueOnError) {
          resolve();
        } else {
          reject(new Error(`psql failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Save backup metadata
   */
  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = join(this.backupDir, `${metadata.id}.meta.json`);
    const content = JSON.stringify(metadata, null, 2);
    await pipeline(
      async function* () {
        yield content;
      },
      createWriteStream(metadataPath)
    );
  }

  /**
   * Load backup metadata
   */
  private async loadMetadata(backupId: string): Promise<BackupMetadata> {
    const metadataPath = join(this.backupDir, `${backupId}.meta.json`);
    const content = await readdir(this.backupDir).then(() => 
      import('fs/promises').then(fs => fs.readFile(metadataPath, 'utf-8'))
    );
    return JSON.parse(content);
  }

  /**
   * Find backup file
   */
  private async findBackup(backupId: string): Promise<string | null> {
    const filename = `${backupId}.sql.gz`;
    const filePath = join(this.backupDir, filename);
    return existsSync(filePath) ? filePath : null;
  }

  /**
   * Upload to cloud storage
   */
  private async uploadToCloud(filePath: string, filename: string): Promise<string> {
    // TODO: Implement cloud upload based on storage provider
    // For now, return local path
    return filePath;
  }

  /**
   * Apply retention policy
   */
  private async applyRetentionPolicy(): Promise<void> {
    if (!this.config.retention) return;

    const backups = await this.listBackups();
    const now = new Date();

    // Group backups by period
    const daily: BackupListItem[] = [];
    const weekly: BackupListItem[] = [];
    const monthly: BackupListItem[] = [];

    for (const backup of backups) {
      const date = new Date(backup.timestamp);
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 7) {
        daily.push(backup);
      } else if (daysDiff < 30) {
        weekly.push(backup);
      } else {
        monthly.push(backup);
      }
    }

    // Delete old backups
    const toDelete: string[] = [];

    if (daily.length > this.config.retention.dailyBackups) {
      toDelete.push(...daily.slice(this.config.retention.dailyBackups).map(b => b.id));
    }

    if (weekly.length > this.config.retention.weeklyBackups) {
      toDelete.push(...weekly.slice(this.config.retention.weeklyBackups).map(b => b.id));
    }

    if (monthly.length > this.config.retention.monthlyBackups) {
      toDelete.push(...monthly.slice(this.config.retention.monthlyBackups).map(b => b.id));
    }

    for (const backupId of toDelete) {
      await this.deleteBackup(backupId);
    }
  }
}
