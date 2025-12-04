/**
 * Backup Types
 */

export interface BackupConfig {
  database: DatabaseConfig;
  storage: StorageConfig;
  schedule?: ScheduleConfig;
  retention?: RetentionConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface StorageConfig {
  provider: 's3' | 'azure' | 'local';
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  accountName?: string;
  accountKey?: string;
  localPath?: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  cron: string; // Cron expression (e.g., '0 2 * * *' for daily at 2 AM)
  timezone?: string;
}

export interface RetentionConfig {
  dailyBackups: number; // Keep last N daily backups
  weeklyBackups: number; // Keep last N weekly backups
  monthlyBackups: number; // Keep last N monthly backups
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  database: string;
  size: number;
  duration: number;
  type: 'full' | 'incremental';
  status: 'success' | 'failed';
  error?: string;
  checksum: string;
  location: string;
}

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  skipData?: boolean;
  skipSchema?: boolean;
  continueOnError?: boolean;
}

export interface BackupResult {
  success: boolean;
  metadata: BackupMetadata;
  filePath: string;
  uploadUrl?: string;
}

export interface RestoreResult {
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
}

export interface BackupListItem {
  id: string;
  timestamp: string;
  size: number;
  type: 'full' | 'incremental';
  location: string;
}
